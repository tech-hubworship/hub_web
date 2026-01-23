import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanDateString } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const todayStr = getKoreanDateString();

    const { data: todayStatsData } = await supabaseAdmin.rpc("get_advent_today_stats", {
      today_date: todayStr,
    });

    const todayStatsRaw = (todayStatsData as any)?.[0] || {
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

    const startDateStr = startDateParam ? startDateParam.replace(/-/g, "") : "20251130";
    const endDateStr = endDateParam ? endDateParam.replace(/-/g, "") : "20251225";

    const startDateForRpc = `${startDateStr.slice(0, 4)}-${startDateStr.slice(4, 6)}-${startDateStr.slice(6, 8)}`;
    const endDateForRpc = `${endDateStr.slice(0, 4)}-${endDateStr.slice(4, 6)}-${endDateStr.slice(6, 8)}`;

    const getDayNumber = (dateStr: string): number => {
      const year = parseInt(dateStr.slice(0, 4), 10);
      const month = parseInt(dateStr.slice(4, 6), 10);
      const day = parseInt(dateStr.slice(6, 8), 10);
      const currentDateUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const baseDateUTC = new Date(Date.UTC(2025, 10, 30, 0, 0, 0));
      const diffTime = currentDateUTC.getTime() - baseDateUTC.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    };

    const { data: dailyStatsData } = await supabaseAdmin.rpc("get_advent_daily_stats", {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
    });

    const dailyStats = ((dailyStatsData as any[]) || []).map((d: any) => ({
      date: d.date,
      dayNumber: d.day_number,
      completed: d.completed || 0,
      commentOnly: d.comment_only || 0,
      attendanceOnly: d.attendance_only || 0,
      commentCount: d.comment_count || 0,
      attendanceCount: d.attendance_count || 0,
    }));

    const { data: streakStatsData } = await supabaseAdmin.rpc("get_advent_streak_stats", {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
    });

    const streakStats: Record<number, number> = {};
    ((streakStatsData as any[]) || []).forEach((s: any) => {
      if (s.streak && s.count) streakStats[s.streak] = s.count;
    });

    const { data: cumulativeStatsData } = await supabaseAdmin.rpc("get_advent_cumulative_stats", {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
    });

    const cumulativeStats = ((cumulativeStatsData as any[]) || []).map((c: any) => ({
      date: c.date,
      dayNumber: c.day_number,
      cumulativeCompleted: c.cumulative_completed || 0,
    }));

    const { data: hourlyCumulativeData } = await supabaseAdmin.rpc("get_advent_hourly_cumulative", {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
    });

    const hourlyCumulativeByDateMap = new Map<
      string,
      Array<{ hour: number; cumulative: number }>
    >();
    ((hourlyCumulativeData as any[]) || []).forEach((h: any) => {
      if (!hourlyCumulativeByDateMap.has(h.date)) hourlyCumulativeByDateMap.set(h.date, []);
      hourlyCumulativeByDateMap.get(h.date)!.push({ hour: h.hour, cumulative: h.cumulative || 0 });
    });

    const hourlyCumulativeByDate: Array<{
      date: string;
      dayNumber: number;
      hourlyData: Array<{ hour: number; cumulative: number }>;
    }> = [];

    hourlyCumulativeByDateMap.forEach((hourlyData, dateStr) => {
      const dayNumber = getDayNumber(dateStr);
      if (dayNumber < 1) return;

      const completeHourlyData: Array<{ hour: number; cumulative: number }> = [];
      for (let hour = 0; hour < 24; hour++) {
        const existing = hourlyData.find((h: any) => h.hour === hour);
        completeHourlyData.push({ hour, cumulative: existing?.cumulative || 0 });
      }

      hourlyCumulativeByDate.push({ date: dateStr, dayNumber, hourlyData: completeHourlyData });
    });

    hourlyCumulativeByDate.sort((a, b) => a.dayNumber - b.dayNumber);

    const hourlyCumulative: Array<{ hour: number; cumulative: number }> = [];
    for (let hour = 0; hour < 24; hour++) hourlyCumulative.push({ hour, cumulative: 0 });

    return Response.json(
      {
        today: todayStats,
        daily: dailyStats || [],
        streaks: streakStats || {},
        cumulative: cumulativeStats || [],
        hourlyCumulative,
        hourlyCumulativeByDate: hourlyCumulativeByDate || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return Response.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

