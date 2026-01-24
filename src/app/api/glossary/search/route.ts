import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";

    let dbQuery = supabaseAdmin
      .from("glossary_terms")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .order("search_count", { ascending: false });

    if (category && category !== "전체") {
      dbQuery = dbQuery.eq("category", category);
    }

    if (query) {
      // 키워드 검색 (용어명, 정의에서 검색)
      dbQuery = dbQuery.or(
        `term_name.ilike.%${query}%,definition.ilike.%${query}%,example.ilike.%${query}%`
      );
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("용어 검색 오류:", error);
      return jsonError("용어 검색에 실패했습니다.", 500);
    }

    return jsonOk({ terms: data || [] }, 200);
  } catch (error) {
    console.error("용어 검색 오류:", error);
    return jsonError("용어 검색에 실패했습니다.", 500);
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
