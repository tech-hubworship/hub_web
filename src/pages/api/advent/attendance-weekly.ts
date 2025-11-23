import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const userId = session.user.id || session.user.email;

  try {
    // 출석 현황 조회 (일차별)
    const { data: attendanceList, error } = await supabaseAdmin
      .from('advent_attendance')
      .select('day_number')
      .eq('user_id', userId)
      .order('day_number', { ascending: true });

    if (error) {
      console.error('출석 현황 조회 오류:', error);
      return res.status(500).json({ error: '출석 현황 조회에 실패했습니다.' });
    }

    // 일차별로 매핑 (day_number -> true)
    const attendanceMap: { [day: number]: boolean } = {};
    
    attendanceList?.forEach((attendance) => {
      attendanceMap[attendance.day_number] = true;
    });

    return res.status(200).json({ attendance: attendanceMap });
  } catch (error) {
    console.error('출석 현황 조회 오류:', error);
    return res.status(500).json({ error: '출석 현황 조회 중 오류가 발생했습니다.' });
  }
}
