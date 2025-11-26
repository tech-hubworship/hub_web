import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';
import { use } from 'react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin || !session.user.roles?.includes('목회자')) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  const { date, search = '' } = req.query;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date 파라미터가 필요합니다.' });
  }

  try {
    /** ------------------------------
     * 1) 출석자 목록 조회
     * ------------------------------*/
    const { data: attendanceData } = await supabaseAdmin
      .from('advent_attendance')
      .select('user_id, reg_dt')
      .eq('post_dt', date);

    const attendedUserIds = attendanceData?.map(a => a.user_id) || [];

    /** ------------------------------
     * 2) profiles + group + cell 조인
     * ------------------------------*/
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        user_id,
        name,
        email,
        group_id,
        cell_id,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name)
      `)
      .not('group_id', 'is', null)     // group_id 있는 경우
      .not('cell_id', 'is', null);     // cell_id 있는 경우

    // 검색어 있을 경우 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('❌ User 조회 오류:', error);
      return res.status(500).json({ error: '사용자 조회 오류' });
    }

    const safeUsers = users ?? [];
    const safeAttendance = attendanceData ?? [];

    /** ------------------------------
     * 3) 출석 정보 매핑
     * ------------------------------*/    
    const list = safeUsers.map(user => ({
      ...user,

      attended: attendedUserIds.includes(user.user_id),
      created_at:
        safeAttendance.find(a => a.user_id === user.user_id)?.reg_dt || null,
    }));
        console.log('Users fetched:', list);


    /** ------------------------------
     * 4) 통계 계산
     * ------------------------------*/
    const total = list.length;
    const attended = list.filter(u => u.attended).length;

    return res.status(200).json({
      date,
      total_users: total,
      attended,
      attendance_rate: total > 0 ? Math.round((attended / total) * 100) : 0,
      list,
    });
  } catch (err) {
    console.error('attendance API error', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
