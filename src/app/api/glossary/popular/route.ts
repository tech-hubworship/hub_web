import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("glossary_terms")
      .select("*")
      .eq("is_active", true)
      .order("search_count", { ascending: false })
      .limit(10);

    if (error) {
      console.error("인기 용어 조회 오류:", error);
      return jsonError("인기 용어 조회에 실패했습니다.", 500);
    }

    return jsonOk({ terms: data || [] }, 200);
  } catch (error) {
    console.error("인기 용어 조회 오류:", error);
    return jsonError("인기 용어 조회에 실패했습니다.", 500);
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

export async function PUT() {
  return methodNotAllowed(["GET"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET"]);
}
