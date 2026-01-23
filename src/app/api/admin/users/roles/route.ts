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
    const { userId, roles } = body as Record<string, any>;

    if (!userId || !Array.isArray(roles)) {
      return jsonError("유효하지 않은 요청입니다.", 400);
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("id, name")
      .in("name", roles);

    if (roleError) {
      console.error("Error fetching roles:", roleError);
      return jsonError("역할 조회에 실패했습니다.", 500);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("admin_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting roles:", deleteError);
      return jsonError("기존 권한 삭제에 실패했습니다.", 500);
    }

    if (roleData && roleData.length > 0) {
      const adminRoles = roleData.map((role) => ({
        user_id: userId,
        role_id: role.id,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("admin_roles")
        .insert(adminRoles);

      if (insertError) {
        console.error("Error inserting roles:", insertError);
        return jsonError("권한 추가에 실패했습니다.", 500);
      }
    }

    const newStatus = roleData && roleData.length > 0 ? "관리자" : "활성";
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating status:", updateError);
      // status 업데이트 실패는 치명적이지 않음
    }

    return jsonOk({ message: "권한이 수정되었습니다." }, 200);
  } catch (error) {
    console.error("Error in roles API:", error);
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

