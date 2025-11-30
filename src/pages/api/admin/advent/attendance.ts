import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  const { date, search = '', group_id, cell_id } = req.query;

  if (!date || typeof date !== 'string' || date.length !== 8) {
    return res.status(400).json({ error: '유효한 날짜가 필요합니다. (YYYYMMDD)' });
  }

  try {
    /** ------------------------------
     * 1) 출석자 목록 조회
     * ------------------------------ */
    const { data: attendanceData } = await supabaseAdmin
      .from('advent_attendance')
      .select('user_id, reg_dt')
      .eq('post_dt', date);

    const attendedUserIds = attendanceData?.map(a => a.user_id) ?? [];

    /** ------------------------------
     * 2) profiles + group + cell JOIN
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
      /** 🔥 null group/cell 제거 */
      .not('group_id', 'is', null)
      .not('cell_id', 'is', null);

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
    const safeAttendance = attendanceData ?? [];

    /** ------------------------------
     * 3) 출석 여부 매핑
     * ------------------------------ */
    const list = safeUsers.map(u => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      hub_groups: u.hub_groups || null,
      hub_cells: u.hub_cells || null,
      attended: attendedUserIds.includes(u.user_id),
      created_at: safeAttendance.find(a => a.user_id === u.user_id)?.reg_dt || null
    }));

    /** ------------------------------
     * 4) 통계 계산
     * ------------------------------ */
    const total_users = list.length;
    const attended = list.filter(u => u.attended).length;
    const attendance_rate =
      total_users > 0 ? Math.round((attended / total_users) * 100) : 0;

    return res.status(200).json({
      date,
      total_users,
      attended,
      attendance_rate,
      list
    });
  } catch (err) {
    console.error('attendance API error', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
