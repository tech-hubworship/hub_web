import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION_LENGTH = 3000;
const MAX_NAME_LENGTH = 60;
const DUPLICATE_WINDOW_MINUTES = 3;

/**
 * 전도 페이지(/evangelism) 질문 접수 API.
 *
 * 전도 대상자는 비로그인 익명 방문자이므로 세션/인증을 요구하지 않는다.
 * 간단한 중복/도배 방지를 위해 동일 IP + 동일 질문이 짧은 시간 내 반복되면 거부한다.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const rawQuestion = typeof body.question === "string" ? body.question.trim() : "";
    const rawName = typeof body.name === "string" ? body.name.trim() : "";

    if (!rawQuestion) {
      return jsonError("질문 내용을 입력해주세요.", 400);
    }
    if (rawQuestion.length > MAX_QUESTION_LENGTH) {
      return jsonError(`질문은 ${MAX_QUESTION_LENGTH}자를 초과할 수 없습니다.`, 400);
    }

    const name = rawName ? rawName.slice(0, MAX_NAME_LENGTH) : null;

    const userIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    // 중복/도배 방지: 같은 IP + 같은 질문이 최근 N분 내 있으면 거부
    if (userIp) {
      const since = new Date(
        Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000
      ).toISOString();

      const { data: recent, error: dupError } = await supabaseAdmin
        .from("evangelism_questions")
        .select("id")
        .eq("question", rawQuestion)
        .gte("created_at", since)
        .limit(1);

      if (!dupError && recent && recent.length > 0) {
        return jsonError(
          "같은 질문이 방금 접수되었어요. 잠시 후 다시 시도해주세요.",
          429
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("evangelism_questions")
      .insert({
        name,
        question: rawQuestion,
        status: "new",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("전도 질문 저장 오류:", error);
      return jsonError("질문 저장에 실패했습니다.", 500, {
        details: (error as { message?: string }).message,
      });
    }

    return jsonOk(
      {
        success: true,
        message: "질문이 전달되었어요. 소중한 마음으로 읽겠습니다.",
        id: data.id,
      },
      201
    );
  } catch (error) {
    console.error("Evangelism Questions API Error:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export function GET() {
  return methodNotAllowed(["POST"]);
}

export function PUT() {
  return methodNotAllowed(["POST"]);
}

export function PATCH() {
  return methodNotAllowed(["POST"]);
}

export function DELETE() {
  return methodNotAllowed(["POST"]);
}
