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
    const path = url.searchParams.get("path");

    // 경로로 메뉴 조회
    if (path) {
      const { data: menu, error } = await supabaseAdmin
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
        .eq("path", path)
        .eq("is_active", true)
        .single();

      if (error || !menu) {
        return jsonError("메뉴를 찾을 수 없습니다.", 404);
      }

      return jsonOk({
        ...menu,
        roles:
          (menu as any).admin_menu_roles
            ?.map((mr: any) => mr.roles?.name)
            .filter(Boolean) || [],
        admin_menu_roles: undefined,
      });
    }

    // 메뉴 목록 조회
    const { data: menus, error } = await supabaseAdmin
      .from("admin_menus")
      .select(
        `
        *,
        parent:parent_id(menu_id, title),
        admin_menu_roles(
          role_id,
          roles(id, name)
        )
      `
      )
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching menus:", error);
      return jsonError("메뉴 목록을 가져오는 데 실패했습니다.", 500);
    }

    const formattedMenus = (menus || []).map((menu: any) => ({
      ...menu,
      roles: menu.admin_menu_roles?.map((mr: any) => mr.roles?.name).filter(Boolean) || [],
      admin_menu_roles: undefined,
    }));

    return jsonOk(formattedMenus, 200);
  } catch (error) {
    console.error("Error in menus API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  try {
    const userRoles = ((session.user as any)?.roles || []) as string[];
    const hasMC = userRoles.includes("MC");
    const hasMaster = userRoles.includes("마스터");

    if (!hasMC && !hasMaster) {
      return jsonError("MC 권한 또는 마스터 권한이 필요합니다.", 403);
    }

    const body = await req.json().catch(() => ({}));
    const { menu_id, title, icon, path, parent_id, order_index, description, roles } =
      body as Record<string, any>;

    if (!menu_id || !title || !path) {
      return jsonError("필수 필드가 누락되었습니다.", 400);
    }

    const { data: newMenu, error: insertError } = await supabaseAdmin
      .from("admin_menus")
      .insert({
        menu_id,
        title,
        icon,
        path,
        parent_id,
        order_index: order_index || 0,
        description,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating menu:", insertError);
      return jsonError("메뉴 생성에 실패했습니다.", 500);
    }

    // 역할 연결
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const { data: roleData } = await supabaseAdmin
        .from("roles")
        .select("id, name")
        .in("name", roles);

      if (roleData && roleData.length > 0) {
        const menuRoles = roleData.map((role: any) => ({
          menu_id: (newMenu as any).id,
          role_id: role.id,
        }));

        await supabaseAdmin.from("admin_menu_roles").insert(menuRoles);
      }
    }

    return jsonOk(newMenu as any, 201);
  } catch (error) {
    console.error("Error in menus API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET", "POST"]);
}

