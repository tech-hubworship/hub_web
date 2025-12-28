import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { executeSql } from '@src/lib/utils/sql';

/**
 * GET: 모든 사용자의 대림절 출석/묵상 통계 조회
 * 
 * 반환 데이터:
 * - user_id: 사용자 ID
 * - name: 사용자 이름
 * - email: 이메일
 * - group_name: 그룹명
 * - cell_name: 다락방명
 * - total_meditations: 총 묵상 수
 * - total_attendance: 총 출석 수
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sortBy = 'attendance' } = req.query; // 'attendance' 또는 'meditation'

    // SQL 쿼리: 사용자별 총 묵상 수와 총 출석 수를 집계
    const query = `
      WITH meditation_counts AS (
        SELECT 
          reg_id as user_id,
          COUNT(*) as total_meditations
        FROM advent_comments
        WHERE post_dt >= '20251130' AND post_dt <= '20251225'
        GROUP BY reg_id
      ),
      attendance_counts AS (
        SELECT 
          user_id,
          COUNT(*) as total_attendance
        FROM advent_attendance
        WHERE post_dt >= '20251130' AND post_dt <= '20251225'
        GROUP BY user_id
      )
      SELECT 
        p.user_id,
        p.name,
        p.email,
        COALESCE(g.name, '') as group_name,
        COALESCE(c.name, '') as cell_name,
        COALESCE(m.total_meditations, 0) as total_meditations,
        COALESCE(a.total_attendance, 0) as total_attendance
      FROM profiles p
      LEFT JOIN meditation_counts m ON p.user_id = m.user_id
      LEFT JOIN attendance_counts a ON p.user_id = a.user_id
      LEFT JOIN hub_groups g ON p.group_id = g.id
      LEFT JOIN hub_cells c ON p.cell_id = c.id
      WHERE (m.total_meditations > 0 OR a.total_attendance > 0)
      ORDER BY 
        ${sortBy === 'meditation' 
          ? 'COALESCE(m.total_meditations, 0) DESC, COALESCE(a.total_attendance, 0) DESC' 
          : 'COALESCE(a.total_attendance, 0) DESC, COALESCE(m.total_meditations, 0) DESC'
        },
        p.name ASC
    `;

    const { data, error } = await executeSql<{
      user_id: string;
      name: string;
      email: string;
      group_name: string;
      cell_name: string;
      total_meditations: number;
      total_attendance: number;
    }>(query);

    if (error) {
      console.error('사용자 통계 조회 오류:', error);
      return res.status(500).json({ error: '사용자 통계 조회에 실패했습니다.' });
    }

    return res.status(200).json({
      stats: data || [],
      total_users: data?.length || 0
    });
  } catch (err) {
    console.error('사용자 통계 조회 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
