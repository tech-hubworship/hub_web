import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { userId, community, group_id, cell_id, status } = body as Record<
      string,
      any
    >;

    if (!userId) return jsonError("사용자 ID가 필요합니다.", 400);

    const updateData: Record<string, any> = {};

    if (community !== undefined) updateData.community = community || null;
    if (group_id !== undefined) updateData.group_id = group_id || null;
    if (cell_id !== undefined) updateData.cell_id = cell_id || null;
    if (status !== undefined) updateData.status = status || null;

    if (Object.keys(updateData).length === 0) {
      return jsonError("수정할 필드가 없습니다.", 400);
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating user:", updateError);
      return jsonError("사용자 정보 수정에 실패했습니다.", 500);
    }

    return jsonOk({ message: "사용자 정보가 수정되었습니다." }, 200);
  } catch (error) {
    console.error("Error in user update API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}

export async function POST() {
  return methodNotAllowed(["PUT"]);
}

export async function PATCH() {
  return methodNotAllowed(["PUT"]);
}

export async function DELETE() {
  return methodNotAllowed(["PUT"]);
}

