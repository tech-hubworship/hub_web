import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 공동체 기도 시간 통계 API
 * GET /api/prayer-time/community
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 허브 전체 기도 시간 합계
    const { data: allPrayers, error: allError } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .not("duration_seconds", "is", null);

    if (allError) {
      console.error("Error fetching all prayers:", allError);
      return Response.json(
        { error: "전체 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const totalSeconds =
      allPrayers?.reduce((sum, p: any) => sum + (p.duration_seconds || 0), 0) ||
      0;

    // 각 허브 지체의 기도 시간 목록 (오늘 기준)
    const { data: todayPrayers, error: todayError } = await supabaseAdmin
      .from("prayer_times")
      .select("user_id, duration_seconds")
      .gte("start_time", targetDate.toISOString())
      .lt("start_time", nextDate.toISOString())
      .not("duration_seconds", "is", null);

    if (todayError) {
      console.error("Error fetching today prayers:", todayError);
      return Response.json(
        { error: "오늘 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 사용자별로 집계
    const userStatsMap = new Map<string, { total_seconds: number }>();
    todayPrayers?.forEach((prayer: any) => {
      const userId = prayer.user_id;
      const duration = prayer.duration_seconds || 0;

      if (userStatsMap.has(userId)) {
        userStatsMap.get(userId)!.total_seconds += duration;
      } else {
        userStatsMap.set(userId, { total_seconds: duration });
      }
    });

    // 사용자 이름 조회
    const userIds = Array.from(userStatsMap.keys());
    let profiles: any[] | null = null;
    if (userIds.length > 0) {
      const { data, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      profiles = data;
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }
    }

    // 프로필 맵 생성
    const profileMap = new Map<string, string>();
    profiles?.forEach((profile: any) => {
      profileMap.set(profile.user_id, profile.name);
    });

    // 배열로 변환하고 시간 순으로 정렬
    const userStats = Array.from(userStatsMap.entries())
      .map(([user_id, stats]) => ({
        user_id,
        name: profileMap.get(user_id) || "알 수 없음",
        total_seconds: stats.total_seconds,
      }))
      .sort((a, b) => b.total_seconds - a.total_seconds);

    return Response.json(
      {
        success: true,
        data: {
          total_seconds: totalSeconds,
          user_stats: userStats,
          date: targetDate.toISOString().split("T")[0],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time community API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

