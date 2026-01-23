import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, drawnQuestions } = body as Record<string, any>;

    if (!sessionId) return jsonError("세션 ID가 필요합니다.", 400);

    let query = supabaseAdmin
      .from("ice_breaking_questions")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (drawnQuestions && Array.isArray(drawnQuestions) && drawnQuestions.length > 0) {
      query = query.not("id", "in", `(${drawnQuestions.join(",")})`);
    }

    const { data: availableQuestions, error: questionsError } = await query;

    if (questionsError) {
      console.error("질문 조회 오류:", questionsError);
      return jsonError("질문을 가져오는데 실패했습니다.", 500);
    }

    if (!availableQuestions || availableQuestions.length === 0) {
      return jsonError("더 이상 뽑을 질문이 없습니다!", 404, {
        message:
          "모든 질문을 뽑으셨습니다. 세션을 초기화하면 다시 뽑을 수 있습니다.",
      });
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    const { error: sessionError } = await supabaseAdmin.from("ice_breaking_sessions").upsert(
      {
        session_id: sessionId,
        question_ids: [...(drawnQuestions || []), selectedQuestion.id],
        updated_at: getKoreanTimestamp(),
      },
      { onConflict: "session_id" }
    );

    if (sessionError) {
      console.error("세션 업데이트 오류:", sessionError);
      // 세션 업데이트 실패해도 질문은 반환
    }

    return jsonOk(
      {
        question: selectedQuestion,
        totalQuestions: availableQuestions.length,
        drawnCount: drawnQuestions ? drawnQuestions.length + 1 : 1,
      },
      200
    );
  } catch (error) {
    console.error("질문 뽑기 오류:", error);
    return jsonError("질문 뽑기에 실패했습니다.", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

export async function PUT() {
  return methodNotAllowed(["POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["POST"]);
}

