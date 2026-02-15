import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanDateString } from "@src/lib/utils/date";
import { getDayNumber } from "@src/lib/video-event/utils";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

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
    const baseDateForRpc = `${VIDEO_EVENT.BASE_DATE.slice(0, 4)}-${VIDEO_EVENT.BASE_DATE.slice(4, 6)}-${VIDEO_EVENT.BASE_DATE.slice(6, 8)}`;

    const rpcTodayStats = `${VIDEO_EVENT.RPC_PREFIX}_today_stats` as "get_video_event_today_stats";
    const { data: todayStatsData } = await supabaseAdmin.rpc(rpcTodayStats, {
      today_date: todayStr,
      p_event_slug: VIDEO_EVENT.EVENT_SLUG,
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

    const startDateStr = startDateParam ? startDateParam.replace(/-/g, "") : VIDEO_EVENT.BASE_DATE;
    const endDateStr = endDateParam ? endDateParam.replace(/-/g, "") : VIDEO_EVENT.END_DATE;

    const startDateForRpc = `${startDateStr.slice(0, 4)}-${startDateStr.slice(4, 6)}-${startDateStr.slice(6, 8)}`;
    const endDateForRpc = `${endDateStr.slice(0, 4)}-${endDateStr.slice(4, 6)}-${endDateStr.slice(6, 8)}`;

    const rpcDailyStats = `${VIDEO_EVENT.RPC_PREFIX}_daily_stats` as "get_video_event_daily_stats";
    const { data: dailyStatsData } = await supabaseAdmin.rpc(rpcDailyStats, {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
      p_event_slug: VIDEO_EVENT.EVENT_SLUG,
      p_base_date: baseDateForRpc,
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

    const rpcStreakStats = `${VIDEO_EVENT.RPC_PREFIX}_streak_stats` as "get_video_event_streak_stats";
    const { data: streakStatsData } = await supabaseAdmin.rpc(rpcStreakStats, {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
      p_event_slug: VIDEO_EVENT.EVENT_SLUG,
      p_base_date: baseDateForRpc,
    });

    const streakStats: Record<number, number> = {};
    ((streakStatsData as any[]) || []).forEach((s: any) => {
      if (s.streak && s.count) streakStats[s.streak] = s.count;
    });

    const rpcCumulativeStats = `${VIDEO_EVENT.RPC_PREFIX}_cumulative_stats` as "get_video_event_cumulative_stats";
    const { data: cumulativeStatsData } = await supabaseAdmin.rpc(rpcCumulativeStats, {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
      p_event_slug: VIDEO_EVENT.EVENT_SLUG,
      p_base_date: baseDateForRpc,
    });

    const cumulativeStats = ((cumulativeStatsData as any[]) || []).map((c: any) => ({
      date: c.date,
      dayNumber: c.day_number,
      cumulativeCompleted: c.cumulative_completed || 0,
    }));

    const rpcHourlyCumulative = `${VIDEO_EVENT.RPC_PREFIX}_hourly_cumulative` as "get_video_event_hourly_cumulative";
    const { data: hourlyCumulativeData } = await supabaseAdmin.rpc(rpcHourlyCumulative, {
      start_date: startDateForRpc,
      end_date: endDateForRpc,
      p_event_slug: VIDEO_EVENT.EVENT_SLUG,
      p_base_date: baseDateForRpc,
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
      const dayNum = getDayNumber(dateStr);
      if (dayNum === null || dayNum < 1) return;

      const completeHourlyData: Array<{ hour: number; cumulative: number }> = [];
      for (let hour = 0; hour < 24; hour++) {
        const existing = hourlyData.find((h: any) => h.hour === hour);
        completeHourlyData.push({ hour, cumulative: existing?.cumulative || 0 });
      }
      hourlyCumulativeByDate.push({ date: dateStr, dayNumber: dayNum, hourlyData: completeHourlyData });
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
