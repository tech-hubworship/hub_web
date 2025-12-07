import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';
import { getKoreanDateString } from '@src/lib/utils/date';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
    }

    // 쿼리 파라미터에서 시작일과 종료일 가져오기 (선택적)
    const { startDate: startDateParam, endDate: endDateParam } = req.query;

    // 오늘 날짜 (한국 시간 기준)
    const todayStr = getKoreanDateString();

    // 오늘 통계를 RPC 함수로 조회
    const { data: todayStatsData, error: todayError } = await supabaseAdmin.rpc('get_advent_today_stats', {
      today_date: todayStr
    });
    
    const todayStatsRaw = todayStatsData?.[0] || {
      completed: 0,
      comment_only: 0,
      attendance_only: 0,
      comment_count: 0,
      attendance_count: 0,
    };
    
    const todayStats = {
      completed: todayStatsRaw.completed || 0,
      commentOnly: todayStatsRaw.comment_only || 0,
      attendanceOnly: todayStatsRaw.attendance_only || 0,
      commentCount: todayStatsRaw.comment_count || 0,
      attendanceCount: todayStatsRaw.attendance_count || 0,
    };

    // 기간 설정 (시작일과 종료일)
    const startDateStr = startDateParam && typeof startDateParam === 'string' 
      ? startDateParam.replace(/-/g, '') 
      : '20251130';
    const endDateStr = endDateParam && typeof endDateParam === 'string'
      ? endDateParam.replace(/-/g, '')
      : '20251225';
    
    // YYYYMMDD를 YYYY-MM-DD로 변환
    const startDateForRpc = `${startDateStr.slice(0, 4)}-${startDateStr.slice(4, 6)}-${startDateStr.slice(6, 8)}`;
    const endDateForRpc = `${endDateStr.slice(0, 4)}-${endDateStr.slice(4, 6)}-${endDateStr.slice(6, 8)}`;

    // 일차 계산 함수 (한국 시간대 기준)
    const getDayNumber = (dateStr: string): number => {
      const year = parseInt(dateStr.slice(0, 4), 10);
      const month = parseInt(dateStr.slice(4, 6), 10);
      const day = parseInt(dateStr.slice(6, 8), 10);
      // 한국 시간대 기준으로 날짜 생성 (UTC+9)
      const currentDateUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const baseDateUTC = new Date(Date.UTC(2025, 10, 30, 0, 0, 0)); // 11월 30일
      const diffTime = currentDateUTC.getTime() - baseDateUTC.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    };

    // 일별 통계를 RPC 함수로 조회
    const { data: dailyStatsData } = await supabaseAdmin.rpc('get_advent_daily_stats', {
      start_date: startDateForRpc,
      end_date: endDateForRpc
    });
    
    const dailyStats = (dailyStatsData || []).map((d: any) => ({
      date: d.date,
      dayNumber: d.day_number,
      completed: d.completed || 0,
      commentOnly: d.comment_only || 0,
      attendanceOnly: d.attendance_only || 0,
      commentCount: d.comment_count || 0,
      attendanceCount: d.attendance_count || 0,
    }));


    // 연속 완료 일수별 통계를 RPC 함수로 조회
    const { data: streakStatsData } = await supabaseAdmin.rpc('get_advent_streak_stats', {
      start_date: startDateForRpc,
      end_date: endDateForRpc
    });
    
    const streakStats: Record<number, number> = {};
    (streakStatsData || []).forEach((s: any) => {
      if (s.streak && s.count) {
        streakStats[s.streak] = s.count;
      }
    });

    // 누적 완료 통계를 RPC 함수로 조회
    const { data: cumulativeStatsData } = await supabaseAdmin.rpc('get_advent_cumulative_stats', {
      start_date: startDateForRpc,
      end_date: endDateForRpc
    });
    
    const cumulativeStats = (cumulativeStatsData || []).map((c: any) => ({
      date: c.date,
      dayNumber: c.day_number,
      cumulativeCompleted: c.cumulative_completed || 0,
    }));

    // 시간대별 누적 추이를 RPC 함수로 조회
    const { data: hourlyCumulativeData, error: hourlyError } = await supabaseAdmin.rpc('get_advent_hourly_cumulative', {
      start_date: startDateForRpc,
      end_date: endDateForRpc
    });
    
    // 날짜별로 그룹화
    const hourlyCumulativeByDateMap = new Map<string, Array<{ hour: number; cumulative: number }>>();
    (hourlyCumulativeData || []).forEach((h: any) => {
      if (!hourlyCumulativeByDateMap.has(h.date)) {
        hourlyCumulativeByDateMap.set(h.date, []);
      }
      hourlyCumulativeByDateMap.get(h.date)!.push({
        hour: h.hour,
        cumulative: h.cumulative || 0,
      });
    });
    
    // 각 날짜별로 0-23시 데이터 보장
    const hourlyCumulativeByDate: Array<{
      date: string;
      dayNumber: number;
      hourlyData: Array<{ hour: number; cumulative: number }>;
    }> = [];
    
    hourlyCumulativeByDateMap.forEach((hourlyData, dateStr) => {
      const dayNumber = getDayNumber(dateStr);
      if (dayNumber < 1) return;
      
      // 0-23시 데이터 보장
      const completeHourlyData: Array<{ hour: number; cumulative: number }> = [];
      for (let hour = 0; hour < 24; hour++) {
        const existing = hourlyData.find((h: any) => h.hour === hour);
        completeHourlyData.push({
          hour,
          cumulative: existing?.cumulative || 0,
        });
      }
      
      hourlyCumulativeByDate.push({
        date: dateStr,
        dayNumber,
        hourlyData: completeHourlyData,
      });
    });
    
    // 일차 순서대로 정렬
    hourlyCumulativeByDate.sort((a, b) => a.dayNumber - b.dayNumber);

    // 기존 형식도 유지 (하위 호환성)
    const hourlyCumulative: Array<{ hour: number; cumulative: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      hourlyCumulative.push({ hour, cumulative: 0 });
    }

    return res.status(200).json({
      today: todayStats,
      daily: dailyStats || [],
      streaks: streakStats || {},
      cumulative: cumulativeStats || [],
      hourlyCumulative: hourlyCumulative,
      hourlyCumulativeByDate: hourlyCumulativeByDate || [],
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
}

