/**
 * GET /api/hub-challenge/my-progress
 * 내 챌린지 진행 상황 조회
 * - 내가 나눔한 day 목록
 * - 현재 프로그레스바 위치 (마지막으로 나눔한 day)
 * - 오늘 나눔 여부
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { HUB_CHALLENGE, getChallengeDayNumber, getKSTDateStr, CHALLENGE_DAYS } from "@src/lib/hub-challenge/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    let userId = (session.user as any).id || session.user.email || "anonymous";
    if (userId.length > 100) userId = userId.substring(0, 100);

    // 내가 나눔한 모든 기록 조회
    const { data, error } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .select("share_id, day, reg_dt")
      .eq("slug", HUB_CHALLENGE.SLUG)
      .eq("reg_id", userId)
      .order("day", { ascending: true });

    if (error) {
      console.error("진행상황 조회 오류:", error);
      return Response.json({ error: "진행상황을 불러오는데 실패했습니다." }, { status: 500 });
    }

    const completedDays = (data || []).map((s: any) => s.day as number);
    const lastCompletedDay = completedDays.length > 0 ? Math.max(...completedDays) : 0;

    // 오늘 날짜 기준 day number
    const todayStr = getKSTDateStr();
    const todayDayNumber = getChallengeDayNumber(todayStr);

    // 오늘 나눔 여부
    const todayDone = todayDayNumber !== null && completedDays.includes(todayDayNumber);

    return Response.json({
      completedDays,
      lastCompletedDay,
      todayDayNumber,
      todayDone,
      totalShares: completedDays.length,
    });
  } catch (error) {
    console.error("진행상황 조회 오류:", error);
    return Response.json({ error: "진행상황을 불러오는데 실패했습니다." }, { status: 500 });
  }
}
