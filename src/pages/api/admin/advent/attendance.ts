import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';
import { getKoreanTimestamp } from '@src/lib/utils/date';
import { getDayNumber } from '@src/lib/advent/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  // POST: 관리자가 출석 생성
  if (req.method === 'POST') {
    try {
      const { user_id, post_dt } = req.body;

      if (!user_id || !post_dt) {
        return res.status(400).json({ error: '사용자 ID와 날짜는 필수입니다.' });
      }

      if (typeof post_dt !== 'string' || post_dt.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      // 일차 계산
      const day_number = getDayNumber(post_dt);
      if (!day_number || day_number < 1) {
        return res.status(400).json({ error: '유효한 대림절 날짜가 아닙니다.' });
      }

      // 이미 출석했는지 확인
      const { data: existing } = await supabaseAdmin
        .from('advent_attendance')
        .select('*')
        .eq('user_id', user_id)
        .eq('post_dt', post_dt)
        .single();

      if (existing) {
        return res.status(200).json({ 
          message: '이미 출석 처리되어 있습니다.',
          attendance: existing 
        });
      }

      // 출석 기록 생성 (한국 시간)
      const now = getKoreanTimestamp();
      const { data, error } = await supabaseAdmin
        .from('advent_attendance')
        .insert({
          user_id,
          post_dt,
          day_number,
          reg_dt: now,
          mod_dt: now,
        })
        .select()
        .single();

      if (error) {
        console.error('출석 기록 오류:', error);
        return res.status(500).json({ error: '출석 기록에 실패했습니다.' });
      }

      return res.status(201).json({ attendance: data });
    } catch (error) {
      console.error('출석 기록 오류:', error);
      return res.status(500).json({ error: '출석 기록 중 오류가 발생했습니다.' });
    }
  }

  // GET: 출석 현황 조회
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, search = '', group_id, cell_id } = req.query;

  if (!date || typeof date !== 'string' || date.length !== 8) {
    return res.status(400).json({ error: '유효한 날짜가 필요합니다. (YYYYMMDD)' });
  }

  try {
    /** ------------------------------
     * 1) 묵상 작성자 목록 조회 (advent_comments)
     * ------------------------------ */
    let meditationQuery = supabaseAdmin
      .from('advent_comments')
      .select('reg_id, reg_dt')
      .eq('post_dt', date);

    const { data: meditationData, error: meditationError } = await meditationQuery;

    if (meditationError) {
      console.error('❌ 묵상 조회 오류:', meditationError);
      return res.status(500).json({ error: '묵상 조회 오류' });
    }

    const meditationUserIds = Array.from(new Set((meditationData || []).map(m => m.reg_id)));
    
    if (meditationUserIds.length === 0) {
      return res.status(200).json({
        date,
        total_users: 0,
        attended: 0,
        meditation_count: 0,
        attendance_rate: 0,
        list: []
      });
    }

    /** ------------------------------
     * 2) 출석자 목록 조회
     * ------------------------------ */
    const { data: attendanceData, error: attendanceError } = await supabaseAdmin
      .from('advent_attendance')
      .select('user_id, reg_dt')
      .eq('post_dt', date);

    if (attendanceError) {
      console.error('❌ 출석 조회 오류:', attendanceError);
      return res.status(500).json({ error: '출석 조회 오류' });
    }

    const attendedUserIds = attendanceData?.map(a => a.user_id) ?? [];
    
    // 출석 데이터를 user_id로 매핑 (빠른 조회를 위해)
    // reg_dt가 null이거나 undefined인 경우를 처리
    const attendanceMap = new Map<string, string | null>();
    (attendanceData || []).forEach(a => {
      if (a.user_id && a.reg_dt) {
        attendanceMap.set(a.user_id, a.reg_dt);
      }
    });

    /** ------------------------------
     * 3) 묵상 작성자들의 profiles + group + cell JOIN
     * ------------------------------ */
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        user_id,
        name,
        email,
        group_id,
        cell_id,
        hub_groups:group_id (id, name),
        hub_cells:cell_id (id, name)
      `)
      .in('user_id', meditationUserIds);

    // 🔍 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 🔍 그룹 필터
    if (group_id) {
      query = query.eq('group_id', Number(group_id));
    }

    // 🔍 셀 필터
    if (cell_id) {
      query = query.eq('cell_id', Number(cell_id));
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('❌ User 조회 오류:', error);
      return res.status(500).json({ error: '사용자 조회 오류' });
    }

    const safeUsers = users ?? [];
    const safeMeditation = meditationData ?? [];

    // 묵상 데이터를 user_id로 매핑 (빠른 조회를 위해)
    const meditationMap = new Map(
      (safeMeditation || []).map(m => [m.reg_id, m.reg_dt])
    );

    /** ------------------------------
     * 4) 묵상 여부와 출석 여부 매핑
     * ------------------------------ */
    const list = safeUsers.map(u => {
      const hasMeditation = meditationUserIds.includes(u.user_id);
      const hasAttendance = attendedUserIds.includes(u.user_id);
      const meditationTime = meditationMap.get(u.user_id) || null;
      const attendanceTime = attendanceMap.get(u.user_id) || null;

      return {
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        hub_groups: u.hub_groups || null,
        hub_cells: u.hub_cells || null,
        has_meditation: hasMeditation,
        attended: hasAttendance,
        meditation_created_at: meditationTime,
        attendance_created_at: attendanceTime
      };
    });

    /** ------------------------------
     * 5) 통계 계산
     * ------------------------------ */
    const total_users = list.length;
    const attended = list.filter(u => u.attended).length;
    const meditation_count = list.filter(u => u.has_meditation).length;
    const attendance_rate =
      total_users > 0 ? Math.round((attended / total_users) * 100) : 0;

    return res.status(200).json({
      date,
      total_users,
      attended,
      meditation_count,
      attendance_rate,
      list
    });
  } catch (err) {
    console.error('attendance API error', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
