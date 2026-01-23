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

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  const { id } = await ctx.params;

  try {
    const body = await req.json().catch(() => ({}));
    const { question, is_active, order_index } = body as Record<string, any>;

    const updateData: any = {};
    if (question !== undefined) updateData.question = question;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data, error } = await supabaseAdmin
      .from("ice_breaking_questions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("질문 수정 오류:", error);
      return jsonError("질문 수정에 실패했습니다.", 500);
    }

    return jsonOk({ question: data }, 200);
  } catch (error) {
    console.error("질문 수정 오류:", error);
    return jsonError("질문 수정에 실패했습니다.", 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  const { id } = await ctx.params;

  try {
    const { error } = await supabaseAdmin
      .from("ice_breaking_questions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("질문 삭제 오류:", error);
      return jsonError("질문 삭제에 실패했습니다.", 500);
    }

    return jsonOk({ message: "질문이 삭제되었습니다." }, 200);
  } catch (error) {
    console.error("질문 삭제 오류:", error);
    return jsonError("질문 삭제에 실패했습니다.", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["PUT", "DELETE"]);
}

export async function POST() {
  return methodNotAllowed(["PUT", "DELETE"]);
}

export async function PATCH() {
  return methodNotAllowed(["PUT", "DELETE"]);
}

