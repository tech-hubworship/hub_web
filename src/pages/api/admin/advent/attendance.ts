import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin || !session.user.roles?.includes('목회자')) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  const { date, search = '' } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date 파라미터가 필요합니다.' });
  }

  try {
    // 출석자 조회
    const { data: attendanceData } = await supabaseAdmin
      .from('advent_attendance')
      .select('user_id, created_at')
      .eq('post_dt', date);

    const attendedUserIds = attendanceData?.map(a => a.user_id) || [];

    // 전체 사용자 목록
    let query = supabaseAdmin
      .from('profiles')
      .select('user_id, name, email');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users } = await query;

    const safeUsers = users ?? [];
    const safeAttendance = attendanceData ?? [];

    const list = safeUsers.map(user => ({
    ...user,
    attended: attendedUserIds.includes(user.user_id),
    created_at: safeAttendance.find(a => a.user_id === user.user_id)?.created_at || null
    }));

    const total = safeUsers.length;
    const attended = list.filter(u => u.attended).length;

    return res.status(200).json({
      date,
      total_users: total,
      attended,
      attendance_rate: Math.round((attended / total) * 100),
      list
    });
  } catch (err) {
    console.error('attendance API error', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
