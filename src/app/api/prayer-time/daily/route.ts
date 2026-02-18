import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** start_time을 한국 시간 기준 날짜(YYYY-MM-DD)로 반환 */
function getDateKeyInKorea(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * 날짜별 기도 시간 조회 API
 * GET /api/prayer-time/daily
 * start_date, end_date는 한국 시간(KST) 기준 날짜(YYYY-MM-DD)로 해석합니다.
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

    const targetUserId = user_id || userId;

    // 한국 시간(KST) 기준으로 구간 설정 (오늘 나의 기도 시간과 동일한 기준)
    let rangeStart: string;
    let rangeEnd: string;
    let resStart = start_date ?? "";
    let resEnd = end_date ?? "";

    if (start_date && end_date) {
      rangeStart = `${start_date}T00:00:00.000+09:00`;
      rangeEnd = `${end_date}T23:59:59.999+09:00`;
    } else {
      const now = new Date();
      const kstDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
      const [y, m] = kstDate.split("-");
      rangeStart = `${y}-${m}-01T00:00:00.000+09:00`;
      rangeEnd = `${kstDate}T23:59:59.999+09:00`;
      resStart = `${y}-${m}-01`;
      resEnd = kstDate;
    }

    const { data: prayers, error } = await supabaseAdmin
      .from("prayer_times")
      .select("start_time, duration_seconds")
      .eq("user_id", targetUserId)
      .gte("start_time", rangeStart)
      .lte("start_time", rangeEnd)
      .not("duration_seconds", "is", null);

    if (error) {
      console.error("Error fetching daily prayers:", error);
      return Response.json(
        { error: "날짜별 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 한국 시간 기준 날짜별로 집계 (캘린더가 오늘 나의 기도 시간과 일치)
    const dailyStatsMap = new Map<string, number>();
    prayers?.forEach((prayer: any) => {
      const dateKey = getDateKeyInKorea(prayer.start_time);
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
          start_date: resStart,
          end_date: resEnd,
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

