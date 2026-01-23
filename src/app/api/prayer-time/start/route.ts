import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기도 시작 API
 * POST /api/prayer-time/start
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    // 이미 진행 중인 세션이 있는지 확인
    const { data: existingSession } = await supabaseAdmin
      .from("prayer_sessions")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingSession) {
      return Response.json(
        { error: "이미 기도 중인 세션이 있습니다. 먼저 기도를 종료해주세요." },
        { status: 400 }
      );
    }

    // 진행 중인 기도 시간 레코드가 있는지 확인
    const { data: activePrayer } = await supabaseAdmin
      .from("prayer_times")
      .select("id")
      .eq("user_id", userId)
      .is("end_time", null)
      .single();

    if (activePrayer) {
      return Response.json(
        { error: "이미 진행 중인 기도 시간이 있습니다. 먼저 기도를 종료해주세요." },
        { status: 400 }
      );
    }

    const startTime = new Date();

    // prayer_times 테이블에 레코드 생성
    const { data: prayerTime, error: prayerError } = await supabaseAdmin
      .from("prayer_times")
      .insert({
        user_id: userId,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_seconds: null,
      })
      .select()
      .single();

    if (prayerError) {
      console.error("Error creating prayer time:", prayerError);
      return Response.json({ error: "기도 시작에 실패했습니다." }, { status: 500 });
    }

    // prayer_sessions 테이블에 세션 추가
    const { error: sessionError } = await supabaseAdmin
      .from("prayer_sessions")
      .insert({
        user_id: userId,
        start_time: startTime.toISOString(),
      });

    if (sessionError) {
      console.error("Error creating prayer session:", sessionError);
      // prayer_times는 생성되었으므로 롤백하지 않음 (기존 동작 유지)
      return Response.json(
        { error: "기도 세션 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          id: prayerTime.id,
          start_time: prayerTime.start_time,
        },
        message: "기도가 시작되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prayer time start API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

