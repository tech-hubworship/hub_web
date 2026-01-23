import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMenuId(id: string) {
  const menuId = parseInt(id, 10);
  if (Number.isNaN(menuId)) return null;
  return menuId;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  const { id } = await ctx.params;
  const menuId = parseMenuId(id);
  if (!menuId) return jsonError("유효하지 않은 메뉴 ID입니다.", 400);

  try {
    const { data: menu, error: menuError } = await supabaseAdmin
      .from("admin_menus")
      .select(
        `
        *,
        admin_menu_roles(
          role_id,
          roles(id, name)
        )
      `
      )
      .eq("id", menuId)
      .single();

    if (menuError || !menu) return jsonError("메뉴를 찾을 수 없습니다.", 404);

    const menuRoles =
      (menu as any).admin_menu_roles
        ?.map((mr: any) => mr.roles?.name)
        .filter(Boolean) || [];

    const userRoles = (((session.user as any)?.roles || []) as string[]) ?? [];
    const hasMC = userRoles.includes("MC");
    const hasMasterRole = userRoles.includes("마스터");
    const hasMenuRole =
      menuRoles.length > 0 && menuRoles.some((role: string) => userRoles.includes(role));

    if (!hasMC && !hasMenuRole && !hasMasterRole) {
      return jsonError(
        "이 메뉴를 수정할 권한이 없습니다. MC 권한 또는 해당 메뉴에 설정된 권한이 필요합니다.",
        403
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, icon, path, parent_id, order_index, description, is_active, roles } =
      body as Record<string, any>;

    const { error: updateError } = await supabaseAdmin
      .from("admin_menus")
      .update({
        title,
        icon,
        path,
        parent_id,
        order_index,
        description,
        is_active,
      })
      .eq("id", menuId);

    if (updateError) {
      console.error("Error updating menu:", updateError);
      return jsonError("메뉴 수정에 실패했습니다.", 500);
    }

    if (roles !== undefined) {
      await supabaseAdmin.from("admin_menu_roles").delete().eq("menu_id", menuId);

      if (Array.isArray(roles) && roles.length > 0) {
        const { data: roleData } = await supabaseAdmin
          .from("roles")
          .select("id, name")
          .in("name", roles);

        if (roleData && roleData.length > 0) {
          const menuRoleRows = roleData.map((role: any) => ({
            menu_id: menuId,
            role_id: role.id,
          }));

          await supabaseAdmin.from("admin_menu_roles").insert(menuRoleRows);
        }
      }
    }

    return jsonOk({ message: "메뉴가 수정되었습니다." }, 200);
  } catch (error) {
    console.error("Error in menu API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  const { id } = await ctx.params;
  const menuId = parseMenuId(id);
  if (!menuId) return jsonError("유효하지 않은 메뉴 ID입니다.", 400);

  try {
    const { data: menu, error: menuError } = await supabaseAdmin
      .from("admin_menus")
      .select(
        `
        *,
        admin_menu_roles(
          role_id,
          roles(id, name)
        )
      `
      )
      .eq("id", menuId)
      .single();

    if (menuError || !menu) return jsonError("메뉴를 찾을 수 없습니다.", 404);

    const menuRoles =
      (menu as any).admin_menu_roles
        ?.map((mr: any) => mr.roles?.name)
        .filter(Boolean) || [];

    const userRoles = (((session.user as any)?.roles || []) as string[]) ?? [];
    const hasMC = userRoles.includes("MC");
    const hasMasterRole = userRoles.includes("마스터");
    const hasMenuRole =
      menuRoles.length > 0 && menuRoles.some((role: string) => userRoles.includes(role));

    if (!hasMC && !hasMenuRole && !hasMasterRole) {
      return jsonError(
        "이 메뉴를 수정할 권한이 없습니다. MC 권한 또는 해당 메뉴에 설정된 권한이 필요합니다.",
        403
      );
    }

    const { data: childMenus } = await supabaseAdmin
      .from("admin_menus")
      .select("id")
      .eq("parent_id", menuId);

    if (childMenus && childMenus.length > 0) {
      return jsonError("하위 메뉴가 있는 메뉴는 삭제할 수 없습니다.", 400);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("admin_menus")
      .delete()
      .eq("id", menuId);

    if (deleteError) {
      console.error("Error deleting menu:", deleteError);
      return jsonError("메뉴 삭제에 실패했습니다.", 500);
    }

    return jsonOk({ message: "메뉴가 삭제되었습니다." }, 200);
  } catch (error) {
    console.error("Error in menu API:", error);
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

