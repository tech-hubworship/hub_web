import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return jsonOk({ terms: [] }, 200);
    }

    const ids = idsParam.split(",").map((id) => parseInt(id.trim(), 10)).filter(Boolean);

    if (ids.length === 0) {
      return jsonOk({ terms: [] }, 200);
    }

    const { data, error } = await supabaseAdmin
      .from("glossary_terms")
      .select("*")
      .in("id", ids)
      .eq("is_active", true)
      .order("term_name", { ascending: true });

    if (error) {
      console.error("관련 용어 조회 오류:", error);
      return jsonError("관련 용어 조회에 실패했습니다.", 500);
    }

    return jsonOk({ terms: data || [] }, 200);
  } catch (error) {
    console.error("관련 용어 조회 오류:", error);
    return jsonError("관련 용어 조회에 실패했습니다.", 500);
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
