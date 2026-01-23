import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 날짜별 기도 시간 조회 API
 * GET /api/prayer-time/daily
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);

    const start_date = url.searchParams.get("start_date");
    const end_date = url.searchParams.get("end_date");
    const user_id = url.searchParams.get("user_id");

    // 관리자가 다른 사용자의 데이터를 조회할 수 있도록 user_id 파라미터 지원 (기존 동작 유지)
    const targetUserId = user_id || userId;

    // 날짜 범위 설정
    let startDate: Date;
    let endDate: Date;

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      // 기본값: 현재 월의 첫날부터 오늘까지
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // 날짜별 기도 시간 집계
    const { data: prayers, error } = await supabaseAdmin
      .from("prayer_times")
      .select("start_time, duration_seconds")
      .eq("user_id", targetUserId)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())
      .not("duration_seconds", "is", null);

    if (error) {
      console.error("Error fetching daily prayers:", error);
      return Response.json(
        { error: "날짜별 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 날짜별로 집계
    const dailyStatsMap = new Map<string, number>();
    prayers?.forEach((prayer: any) => {
      const date = new Date(prayer.start_time);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const duration = prayer.duration_seconds || 0;

      dailyStatsMap.set(dateKey, (dailyStatsMap.get(dateKey) || 0) + duration);
    });

    // 배열로 변환
    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, total_seconds]) => ({ date, total_seconds }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return Response.json(
      {
        success: true,
        data: {
          user_id: targetUserId,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          daily_stats: dailyStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time daily API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

