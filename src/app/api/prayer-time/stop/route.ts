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
    // 종료 시각: 서버 현재 시각(UTC)으로 계산해 시간대/파싱 오차 방지
    const endTimeMs = Date.now();
    const endTimeISO = getKoreanISOString();

    // 진행 중인 기도 시간 레코드 찾기
    const { data: activePrayer, error: findError } = await supabaseAdmin
      .from("prayer_times")
      .select("id, start_time")
      .eq("user_id", userId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    // 이미 종료된 경우(중복 클릭·다른 탭에서 종료 등): 200으로 성공 처리해 클라이언트가 상태 초기화
    if (findError || !activePrayer) {
      return Response.json(
        {
          success: true,
          data: null,
          message: "이미 종료된 기도입니다.",
        },
        { status: 200 }
      );
    }

    // 기도 시간 계산: start_time은 DB 저장값 그대로 파싱, end는 Date.now()로 비교
    const startTimeMs = new Date(activePrayer.start_time).getTime();
    let durationSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);

    // 시계 오차로 음수면 0, 1초 미만이면 1초로 저장(최소 1초 이상만 허용하던 검증 완화)
    if (durationSeconds < 0) durationSeconds = 0;
    if (durationSeconds < 1) durationSeconds = 1;

    // prayer_times 테이블 업데이트 (DB 저장용 종료 시각은 한국 시간 문자열 유지)
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

