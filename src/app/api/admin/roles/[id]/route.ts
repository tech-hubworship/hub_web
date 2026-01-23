import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRoleId(id: string) {
  const roleId = parseInt(id, 10);
  if (Number.isNaN(roleId)) return null;
  return roleId;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  const { id } = await ctx.params;
  const roleId = parseRoleId(id);
  if (!roleId) return jsonError("유효하지 않은 권한 ID입니다.", 400);

  try {
    const body = await req.json().catch(() => ({}));
    const { name, description } = body as Record<string, any>;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return jsonError("권한 이름은 필수입니다.", 400);
    }

    const updateData: { name: string; description?: string | null } = {
      name: name.trim(),
    };

    if (description !== undefined) {
      updateData.description =
        typeof description === "string" ? description.trim() || null : null;
    }

    const { data: role, error } = await supabaseAdmin
      .from("roles")
      .update(updateData)
      .eq("id", roleId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        return jsonError("이미 존재하는 권한 이름입니다.", 400);
      }
      if ((error as any).code === "PGRST116") {
        return jsonError("권한을 찾을 수 없습니다.", 404);
      }
      console.error("Error updating role:", error);
      return jsonError("권한 수정에 실패했습니다.", 500);
    }

    return jsonOk(role as any, 200);
  } catch (error) {
    console.error("Error in roles API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  const { id } = await ctx.params;
  const roleId = parseRoleId(id);
  if (!roleId) return jsonError("유효하지 않은 권한 ID입니다.", 400);

  try {
    const { data: usersWithRole, error: checkError } = await supabaseAdmin
      .from("admin_roles")
      .select("user_id")
      .eq("role_id", roleId)
      .limit(1);

    if (checkError) {
      console.error("Error checking role usage:", checkError);
      return jsonError("권한 사용 여부 확인에 실패했습니다.", 500);
    }

    if (usersWithRole && usersWithRole.length > 0) {
      return jsonError("이 권한을 사용하는 사용자가 있어 삭제할 수 없습니다.", 400);
    }

    const { error } = await supabaseAdmin.from("roles").delete().eq("id", roleId);

    if (error) {
      if ((error as any).code === "PGRST116") {
        return jsonError("권한을 찾을 수 없습니다.", 404);
      }
      console.error("Error deleting role:", error);
      return jsonError("권한 삭제에 실패했습니다.", 500);
    }

    return jsonOk({ message: "권한이 삭제되었습니다." }, 200);
  } catch (error) {
    console.error("Error in roles API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
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

