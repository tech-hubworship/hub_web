import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const { data, error } = await supabaseAdmin
      .from("glossary_terms")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("용어 상세 조회 오류:", error);
      return jsonError("용어를 찾을 수 없습니다.", 404);
    }

    return jsonOk({ term: data }, 200);
  } catch (error) {
    console.error("용어 상세 조회 오류:", error);
    return jsonError("용어 상세 조회에 실패했습니다.", 500);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // 검색 카운트 증가
    const { data: term } = await supabaseAdmin
      .from("glossary_terms")
      .select("search_count")
      .eq("id", id)
      .single();

    if (term) {
      await supabaseAdmin
        .from("glossary_terms")
        .update({ search_count: (term.search_count || 0) + 1 })
        .eq("id", id);
    }

    return jsonOk({ message: "조회 카운트가 증가했습니다." }, 200);
  } catch (error) {
    console.error("조회 카운트 증가 오류:", error);
    return jsonError("조회 카운트 증가에 실패했습니다.", 500);
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
