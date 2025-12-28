import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { executeSql, escapeSqlString } from '@src/lib/utils/sql';

/**
 * GET: 특정 사용자의 날짜별 묵상/출석 상세 정보 조회
 * 
 * Query Parameters:
 * - user_id: 사용자 ID (필수)
 * 
 * 반환 데이터:
 * - date: 날짜 (YYYYMMDD)
 * - day_number: 일차
 * - has_meditation: 묵상 작성 여부
 * - meditation_content: 묵상 내용
 * - meditation_reg_dt: 묵상 작성 시간
 * - has_attendance: 출석 여부
 * - attendance_reg_dt: 출석 시간
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id } = req.query;

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
  }

  try {
    // SQL 쿼리: 사용자의 날짜별 묵상과 출석 정보를 조회
    // day_number 계산: 2025년 11월 30일을 기준으로 일차 계산
    // user_id를 직접 이스케이프 처리하여 SQL 인젝션 방지
    const escapedUserId = escapeSqlString(user_id);
    const query = `
      WITH date_series AS (
        SELECT 
          generate_series(
            '2025-11-30'::date,
            '2025-12-25'::date,
            '1 day'::interval
          )::date as date
      ),
      all_dates AS (
        SELECT 
          TO_CHAR(date, 'YYYYMMDD') as post_dt,
          (date - '2025-11-30'::date)::integer + 1 as day_number
        FROM date_series
        WHERE (date - '2025-11-30'::date)::integer >= 0
        ORDER BY date ASC
      ),
      user_meditations AS (
        SELECT 
          post_dt,
          content as meditation_content,
          reg_dt as meditation_reg_dt
        FROM advent_comments
        WHERE reg_id = '${escapedUserId}'
          AND post_dt >= '20251130' AND post_dt <= '20251225'
      ),
      user_attendance AS (
        SELECT 
          post_dt,
          reg_dt as attendance_reg_dt
        FROM advent_attendance
        WHERE user_id = '${escapedUserId}'
          AND post_dt >= '20251130' AND post_dt <= '20251225'
      )
      SELECT 
        ad.post_dt as date,
        ad.day_number,
        CASE WHEN um.post_dt IS NOT NULL THEN true ELSE false END as has_meditation,
        um.meditation_content,
        um.meditation_reg_dt,
        CASE WHEN ua.post_dt IS NOT NULL THEN true ELSE false END as has_attendance,
        ua.attendance_reg_dt
      FROM all_dates ad
      LEFT JOIN user_meditations um ON ad.post_dt = um.post_dt
      LEFT JOIN user_attendance ua ON ad.post_dt = ua.post_dt
      ORDER BY ad.post_dt ASC
    `;

    const { data, error } = await executeSql<{
      date: string;
      day_number: number;
      has_meditation: boolean;
      meditation_content: string | null;
      meditation_reg_dt: string | null;
      has_attendance: boolean;
      attendance_reg_dt: string | null;
    }>(query);

    if (error) {
      console.error('사용자 상세 정보 조회 오류:', error);
      return res.status(500).json({ error: '사용자 상세 정보 조회에 실패했습니다.' });
    }

    // 사용자 기본 정보도 함께 조회
    const userInfoQuery = `
      SELECT 
        p.user_id,
        p.name,
        p.email,
        COALESCE(g.name, '') as group_name,
        COALESCE(c.name, '') as cell_name
      FROM profiles p
      LEFT JOIN hub_groups g ON p.group_id = g.id
      LEFT JOIN hub_cells c ON p.cell_id = c.id
      WHERE p.user_id = '${escapedUserId}'
    `;

    const { data: userInfo, error: userInfoError } = await executeSql<{
      user_id: string;
      name: string;
      email: string;
      group_name: string;
      cell_name: string;
    }>(userInfoQuery);

    if (userInfoError) {
      console.error('사용자 정보 조회 오류:', userInfoError);
    }

    return res.status(200).json({
      user_info: userInfo?.[0] || null,
      details: data || []
    });
  } catch (err) {
    console.error('사용자 상세 정보 조회 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
