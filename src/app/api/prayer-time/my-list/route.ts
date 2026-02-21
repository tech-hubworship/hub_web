import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanDateFormatted } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 내 기도 시간 목록 조회 (당일 기록만)
 * GET /api/prayer-time/my-list
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const kstToday = getKoreanDateFormatted();
    const todayStart = `${kstToday}T00:00:00.000+09:00`;
    const todayEnd = `${kstToday}T23:59:59.999+09:00`;

    const { data, error } = await supabaseAdmin
      .from("prayer_times")
      .select("id, start_time, duration_seconds")
      .eq("user_id", session.user.id)
      .not("duration_seconds", "is", null)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching my prayer list:", error);
      return Response.json(
        { error: "목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, data: data ?? [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Prayer time my-list API error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
