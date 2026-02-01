import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanDateFormatted } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 내 기도 시간 통계 API
 * GET /api/prayer-time/my-stats
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    // 오늘 나의 기도 시간 (한국 시간 KST 기준 오늘 00:00 ~ 내일 00:00)
    const kstToday = getKoreanDateFormatted(); // YYYY-MM-DD
    const todayStartISO = `${kstToday}T00:00:00.000+09:00`;
    const tomorrowKst = new Date(`${kstToday}T00:00:00+09:00`);
    tomorrowKst.setDate(tomorrowKst.getDate() + 1);
    const tomorrowStr = tomorrowKst.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const todayEndISO = `${tomorrowStr}T00:00:00.000+09:00`;

    const { data: todayPrayers, error: todayError } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("start_time", todayStartISO)
      .lt("start_time", todayEndISO)
      .not("duration_seconds", "is", null);

    if (todayError) {
      console.error("Error fetching today prayers:", todayError);
      return Response.json(
        { error: "오늘 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const todayTotalSeconds =
      todayPrayers?.reduce((sum, p: any) => sum + (p.duration_seconds || 0), 0) ||
      0;

    // 나의 총 기도 시간
    const { data: allPrayers, error: allError } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .eq("user_id", userId)
      .not("duration_seconds", "is", null);

    if (allError) {
      console.error("Error fetching all prayers:", allError);
      return Response.json(
        { error: "총 기도 시간 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const totalSeconds =
      allPrayers?.reduce((sum, p: any) => sum + (p.duration_seconds || 0), 0) ||
      0;

    // 현재 진행 중인 기도 시간
    const { data: activePrayer, error: activeError } = await supabaseAdmin
      .from("prayer_times")
      .select("id, start_time")
      .eq("user_id", userId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    let activeSession = null;
    if (activePrayer && !activeError) {
      const startTime = new Date(activePrayer.start_time);
      const now = new Date();
      const durationSeconds = Math.floor(
        (now.getTime() - startTime.getTime()) / 1000
      );
      activeSession = {
        id: activePrayer.id,
        start_time: activePrayer.start_time,
        duration_seconds: durationSeconds,
      };
    }

    return Response.json(
      {
        success: true,
        data: {
          today_seconds: todayTotalSeconds,
          total_seconds: totalSeconds,
          active_session: activeSession,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time stats API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

