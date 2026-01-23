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
    const search = url.searchParams.get("search") ?? "";
    const page = url.searchParams.get("page") ?? "1";
    const limit = url.searchParams.get("limit") ?? "20";
    const community = url.searchParams.get("community");
    const group_id = url.searchParams.get("group_id");
    const cell_id = url.searchParams.get("cell_id");
    const status = url.searchParams.get("status");

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // 전체 개수 조회
    let countQuery = supabaseAdmin
      .from("profiles")
      .select("user_id", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (community) countQuery = countQuery.eq("community", community);
    if (group_id) countQuery = countQuery.eq("group_id", parseInt(group_id, 10));
    if (cell_id) countQuery = countQuery.eq("cell_id", parseInt(cell_id, 10));
    if (status) {
      if (status === "null") countQuery = countQuery.is("status", null);
      else countQuery = countQuery.eq("status", status);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("Error counting users:", countError);
      return jsonError("사용자 수를 가져오는 데 실패했습니다.", 500);
    }

    // 데이터 조회
    let query = supabaseAdmin
      .from("profiles")
      .select(
        `
        user_id,
        email,
        name,
        birth_date,
        community,
        group_id,
        cell_id,
        status,
        created_at,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name),
        admin_roles(roles(name))
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (community) query = query.eq("community", community);
    if (group_id) query = query.eq("group_id", parseInt(group_id, 10));
    if (cell_id) query = query.eq("cell_id", parseInt(cell_id, 10));
    if (status) {
      if (status === "null") query = query.is("status", null);
      else query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching users:", error);
      return jsonError("사용자 목록을 가져오는 데 실패했습니다.", 500);
    }

    const users = (data ?? []).map((user: any) => {
      const roles =
        user.admin_roles && Array.isArray(user.admin_roles)
          ? user.admin_roles
              .map((roleEntry: any) => roleEntry?.roles?.name)
              .filter(Boolean)
          : [];

      const group_name = user.hub_groups?.name || null;
      const cell_name = user.hub_cells?.name || null;
      const group = user.hub_groups || null;
      const cell = user.hub_cells || null;

      const { admin_roles, hub_groups, hub_cells, ...userWithoutRelations } = user;

      return {
        ...userWithoutRelations,
        group_name,
        cell_name,
        group,
        cell,
        roles,
      };
    });

    return jsonOk({
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in users API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

