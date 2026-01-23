import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  try {
    const { data, error } = await supabaseAdmin
      .from("ice_breaking_questions")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("질문 목록 조회 오류:", error);
      return jsonError("질문 목록을 가져오는데 실패했습니다.", 500);
    }

    return jsonOk({ questions: data || [] }, 200);
  } catch (error) {
    console.error("질문 목록 조회 오류:", error);
    return jsonError("질문 목록을 가져오는데 실패했습니다.", 500);
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { question, is_active, order_index } = body as Record<string, any>;

    if (!question) return jsonError("질문 내용은 필수입니다.", 400);

    const { data, error } = await supabaseAdmin
      .from("ice_breaking_questions")
      .insert({
        question,
        is_active: is_active !== false,
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("질문 추가 오류:", error);
      return jsonError("질문 추가에 실패했습니다.", 500);
    }

    return jsonOk({ question: data }, 201);
  } catch (error) {
    console.error("질문 추가 오류:", error);
    return jsonError("질문 추가에 실패했습니다.", 500);
  }
}

export async function PUT() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET", "POST"]);
}

