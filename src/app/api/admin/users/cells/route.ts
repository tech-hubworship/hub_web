import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  try {
    const url = new URL(req.url);
    const group_id = url.searchParams.get("group_id");

    let query = supabaseAdmin
      .from("hub_cells")
      .select("id, name, group_id, is_active")
      .order("name", { ascending: true });

    if (group_id) {
      query = query.eq("group_id", parseInt(group_id, 10));
    }

    const { data: cells, error } = await query;
    if (error) {
      console.error("Error fetching cells:", error);
      return jsonError("다락방 목록을 가져오는 데 실패했습니다.", 500);
    }

    return jsonOk(cells || [], 200);
  } catch (error) {
    console.error("Error in cells API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
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

