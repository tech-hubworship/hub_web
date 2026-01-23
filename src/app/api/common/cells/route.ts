import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const group_id = url.searchParams.get("group_id");

  try {
    let query = supabaseAdmin.from("hub_cells").select("id, name, group_id");

    if (group_id) {
      query = query.eq("group_id", Number(group_id));
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("cells api error:", error);
      return jsonError("셀 조회 실패", 500);
    }

    return jsonOk({ cells: data }, 200);
  } catch (err) {
    console.error("cells api exception:", err);
    return jsonError("서버 에러", 500);
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

