import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = ["new", "answered", "closed"];
const MAX_ANSWER_LENGTH = 5000;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) return null;
  return session;
}

/** 전도 질문 답변/상태 업데이트 (관리자 전용) */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 401);

  const { id } = await ctx.params;
  if (!id) return jsonError("유효하지 않은 ID입니다.", 400);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updateData: Record<string, unknown> = {};

  if (body.answer !== undefined) {
    const answer =
      typeof body.answer === "string" ? body.answer.trim() : "";
    if (answer.length > MAX_ANSWER_LENGTH) {
      return jsonError(`답변은 ${MAX_ANSWER_LENGTH}자를 초과할 수 없습니다.`, 400);
    }
    updateData.answer = answer || null;
    if (answer) {
      updateData.answered_at = getKoreanTimestamp();
      updateData.status = "answered";
    } else {
      updateData.answered_at = null;
    }
  }

  if (typeof body.status === "string") {
    if (!VALID_STATUS.includes(body.status)) {
      return jsonError("유효하지 않은 상태입니다.", 400);
    }
    updateData.status = body.status;
  }

  if (Object.keys(updateData).length === 0) {
    return jsonError("업데이트할 내용이 없습니다.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("evangelism_questions")
    .update(updateData)
    .eq("id", id)
    .select("id, created_at, name, contact, question, status, answer, answered_at")
    .single();

  if (error) {
    console.error("전도 질문 업데이트 오류:", error);
    return jsonError("질문 업데이트에 실패했습니다.", 500);
  }

  return jsonOk({ success: true, message: "저장되었습니다.", data }, 200);
}

/** 전도 질문 삭제 (관리자 전용) */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 401);

  const { id } = await ctx.params;
  if (!id) return jsonError("유효하지 않은 ID입니다.", 400);

  const { error } = await supabaseAdmin
    .from("evangelism_questions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("전도 질문 삭제 오류:", error);
    return jsonError("질문 삭제에 실패했습니다.", 500);
  }

  return jsonOk({ success: true, message: "삭제되었습니다." }, 200);
}

export function GET() {
  return methodNotAllowed(["PATCH", "DELETE"]);
}

export function POST() {
  return methodNotAllowed(["PATCH", "DELETE"]);
}
