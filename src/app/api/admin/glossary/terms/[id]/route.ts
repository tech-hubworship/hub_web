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
    const {
      term_name,
      category,
      definition,
      example,
      schedule,
      location,
      related_terms,
      is_active,
      order_index,
    } = body as Record<string, any>;

    const updateData: any = {};
    if (term_name !== undefined) updateData.term_name = term_name;
    if (category !== undefined) updateData.category = category;
    if (definition !== undefined) updateData.definition = definition;
    if (example !== undefined) updateData.example = example;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (location !== undefined) updateData.location = location;
    if (related_terms !== undefined) updateData.related_terms = related_terms;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data, error } = await supabaseAdmin
      .from("glossary_terms")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("용어 수정 오류:", error);
      return jsonError("용어 수정에 실패했습니다.", 500);
    }

    return jsonOk({ term: data }, 200);
  } catch (error) {
    console.error("용어 수정 오류:", error);
    return jsonError("용어 수정에 실패했습니다.", 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  const { id } = await ctx.params;

  try {
    const { error } = await supabaseAdmin.from("glossary_terms").delete().eq("id", id);

    if (error) {
      console.error("용어 삭제 오류:", error);
      return jsonError("용어 삭제에 실패했습니다.", 500);
    }

    return jsonOk({ message: "용어가 삭제되었습니다." }, 200);
  } catch (error) {
    console.error("용어 삭제 오류:", error);
    return jsonError("용어 삭제에 실패했습니다.", 500);
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
