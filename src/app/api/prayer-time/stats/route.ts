import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanDateFormatted } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기도 시간 통계 통합 API (내 통계 + 공동체 통계)
 * GET /api/prayer-time/stats
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    // KST 오늘 구간 (내 통계·공동체 모두 동일 기준)
    const kstToday = getKoreanDateFormatted();
    const todayStartISO = `${kstToday}T00:00:00.000+09:00`;
    const tomorrowKst = new Date(`${kstToday}T00:00:00+09:00`);
    tomorrowKst.setDate(tomorrowKst.getDate() + 1);
    const tomorrowStr = tomorrowKst.toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    });
    const todayEndISO = `${tomorrowStr}T00:00:00.000+09:00`;

    // 1) 내 통계: 오늘 기도 시간
    const { data: myTodayPrayers, error: myTodayError } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("start_time", todayStartISO)
      .lt("start_time", todayEndISO)
      .not("duration_seconds", "is", null);

    if (myTodayError) {
      console.error("Error fetching my today prayers:", myTodayError);
      return Response.json(
        { error: "오늘 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const todayTotalSeconds =
      myTodayPrayers?.reduce(
        (sum: number, p: { duration_seconds?: number }) =>
          sum + (p.duration_seconds || 0),
        0
      ) ?? 0;

    // 2) 내 통계: 총 기도 시간
    const { data: myAllPrayers, error: myAllError } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .eq("user_id", userId)
      .not("duration_seconds", "is", null);

    if (myAllError) {
      console.error("Error fetching my all prayers:", myAllError);
      return Response.json(
        { error: "총 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const myTotalSeconds =
      myAllPrayers?.reduce(
        (sum: number, p: { duration_seconds?: number }) =>
          sum + (p.duration_seconds || 0),
        0
      ) ?? 0;

    // 3) 내 통계: 진행 중인 세션
    const { data: activePrayer, error: activeError } = await supabaseAdmin
      .from("prayer_times")
      .select("id, start_time")
      .eq("user_id", userId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    let activeSession: { start_time: string } | null = null;
    if (activePrayer && !activeError) {
      activeSession = { start_time: activePrayer.start_time };
    }

    // 4) 공동체: 허브 전체 총 기도 시간
    const { data: hubAllPrayers, error: hubAllError } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .not("duration_seconds", "is", null);

    if (hubAllError) {
      console.error("Error fetching hub all prayers:", hubAllError);
      return Response.json(
        { error: "전체 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const communityTotalSeconds =
      hubAllPrayers?.reduce(
        (sum: number, p: { duration_seconds?: number }) =>
          sum + (p.duration_seconds || 0),
        0
      ) ?? 0;

    // 5) 공동체: 오늘(KST) 사용자별 기도 시간
    const { data: todayPrayers, error: todayError } = await supabaseAdmin
      .from("prayer_times")
      .select("user_id, duration_seconds")
      .gte("start_time", todayStartISO)
      .lt("start_time", todayEndISO)
      .not("duration_seconds", "is", null);

    if (todayError) {
      console.error("Error fetching today prayers for community:", todayError);
      return Response.json(
        { error: "오늘 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const userStatsMap = new Map<string, number>();
    todayPrayers?.forEach((p: { user_id: string; duration_seconds?: number }) => {
      const uid = p.user_id;
      const duration = p.duration_seconds || 0;
      userStatsMap.set(uid, (userStatsMap.get(uid) ?? 0) + duration);
    });

    const userIds = Array.from(userStatsMap.keys());
    let profiles: { user_id: string; name: string }[] | null = null;
    if (userIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      profiles = data;
    }

    const profileMap = new Map<string, string>();
    profiles?.forEach((p) => profileMap.set(p.user_id, p.name ?? "알 수 없음"));

    const userStats = Array.from(userStatsMap.entries())
      .map(([user_id, total_seconds]) => ({
        user_id,
        name: profileMap.get(user_id) || "알 수 없음",
        total_seconds,
      }))
      .sort((a, b) => b.total_seconds - a.total_seconds);

    return Response.json(
      {
        success: true,
        data: {
          my: {
            today_seconds: todayTotalSeconds,
            total_seconds: myTotalSeconds,
            active_session: activeSession,
          },
          community: {
            total_seconds: communityTotalSeconds,
            user_stats: userStats,
            date: kstToday,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time stats API error:", error);
    return Response.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
