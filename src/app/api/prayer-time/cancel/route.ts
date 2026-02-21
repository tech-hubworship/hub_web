import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기도 기록 취소(삭제) API — 진행 중인 기도 세션을 기록 없이 삭제
 * POST /api/prayer-time/cancel
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    const { data: activePrayer, error: findError } = await supabaseAdmin
      .from("prayer_times")
      .select("id")
      .eq("user_id", userId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (findError || !activePrayer) {
      return Response.json(
        { success: true, data: null, message: "진행 중인 기도가 없습니다." },
        { status: 200 }
      );
    }

    const { error: deletePrayerError } = await supabaseAdmin
      .from("prayer_times")
      .delete()
      .eq("id", activePrayer.id);

    if (deletePrayerError) {
      console.error("Error deleting prayer time:", deletePrayerError);
      return Response.json({ error: "기도 기록 삭제에 실패했습니다." }, { status: 500 });
    }

    await supabaseAdmin.from("prayer_sessions").delete().eq("user_id", userId);

    return Response.json(
      { success: true, data: null, message: "기록이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time cancel API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
