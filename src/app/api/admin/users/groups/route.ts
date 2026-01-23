import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  try {
    const { data: groups, error } = await supabaseAdmin
      .from("hub_groups")
      .select("id, name, is_active")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching groups:", error);
      return jsonError("그룹 목록을 가져오는 데 실패했습니다.", 500);
    }

    return jsonOk(groups || [], 200);
  } catch (error) {
    console.error("Error in groups API:", error);
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

