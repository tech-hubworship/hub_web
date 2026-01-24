import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanISOString } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기도 종료 API
 * POST /api/prayer-time/stop
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;
    // 한국 시간 기준으로 종료 시간 설정
    const endTimeISO = getKoreanISOString();
    const endTime = new Date(endTimeISO);

    // 진행 중인 기도 시간 레코드 찾기
    const { data: activePrayer, error: findError } = await supabaseAdmin
      .from("prayer_times")
      .select("id, start_time")
      .eq("user_id", userId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (findError || !activePrayer) {
      return Response.json(
        { error: "진행 중인 기도 시간이 없습니다." },
        { status: 400 }
      );
    }

    // 기도 시간 계산 (초 단위)
    const startTime = new Date(activePrayer.start_time);
    const durationSeconds = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    // 최소 1초 이상이어야 함
    if (durationSeconds < 1) {
      return Response.json(
        { error: "기도 시간이 너무 짧습니다. 최소 1초 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // prayer_times 테이블 업데이트
    const { data: updatedPrayer, error: updateError } = await supabaseAdmin
      .from("prayer_times")
      .update({
        end_time: endTimeISO,
        duration_seconds: durationSeconds,
      })
      .eq("id", activePrayer.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating prayer time:", updateError);
      return Response.json({ error: "기도 종료에 실패했습니다." }, { status: 500 });
    }

    // prayer_sessions 테이블에서 세션 제거
    const { error: sessionError } = await supabaseAdmin
      .from("prayer_sessions")
      .delete()
      .eq("user_id", userId);

    if (sessionError) {
      console.error("Error deleting prayer session:", sessionError);
      // prayer_times는 업데이트되었으므로 계속 진행 (기존 동작 유지)
    }

    return Response.json(
      {
        success: true,
        data: {
          id: updatedPrayer.id,
          start_time: updatedPrayer.start_time,
          end_time: updatedPrayer.end_time,
          duration_seconds: updatedPrayer.duration_seconds,
        },
        message: "기도가 종료되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time stop API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

