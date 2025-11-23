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
  const { week } = req.query;

  if (!week || (week !== '1' && week !== '2' && week !== '3' && week !== '4')) {
    return res.status(400).json({ error: '올바른 주차를 선택해주세요. (1-4)' });
  }

  try {
    // 주차별 일차 범위 계산
    const weekNumber = parseInt(week as string);
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;

    // 해당 주차의 출석 현황 조회
    const { data: attendanceList, error } = await supabaseAdmin
      .from('advent_attendance')
      .select('day_number')
      .eq('user_id', userId)
      .gte('day_number', startDay)
      .lte('day_number', endDay)
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

    return res.status(200).json({ 
      week: weekNumber,
      attendance: attendanceMap,
      startDay,
      endDay
    });
  } catch (error) {
    console.error('출석 현황 조회 오류:', error);
    return res.status(500).json({ error: '출석 현황 조회 중 오류가 발생했습니다.' });
  }
}

