import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = url.searchParams.get("page") ?? "1";
    const limit = url.searchParams.get("limit") ?? "20";
    const status = url.searchParams.get("status");
    const statuses = url.searchParams.get("statuses");
    const community = url.searchParams.get("community");
    const search = url.searchParams.get("search");
    const pastor_id = url.searchParams.get("pastor_id");

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let countQuery = supabaseAdmin
      .from("bible_card_applications")
      .select("id", { count: "exact", head: true });

    if (statuses && statuses.trim() !== "") {
      const statusArray = statuses
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      if (statusArray.length > 0) countQuery = countQuery.in("status", statusArray);
    } else if (status && status.trim() !== "") {
      countQuery = countQuery.eq("status", status.trim());
    }

    if (community) countQuery = countQuery.eq("community", community);
    if (pastor_id) countQuery = countQuery.eq("assigned_pastor_id", pastor_id);
    if (search) countQuery = countQuery.ilike("name", `%${search}%`);

    const { count } = await countQuery;

    let query = supabaseAdmin
      .from("bible_card_applications")
      .select(
        `
        *,
        hub_groups:group_id(id, name, pastor_id),
        hub_cells:cell_id(id, name),
        pastor:assigned_pastor_id(user_id, name, email),
        user_profile:user_id(birth_date, gender)
      `
      );

    if (statuses && statuses.trim() !== "") {
      const statusArray = statuses
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      if (statusArray.length > 0) query = query.in("status", statusArray);
    } else if (status && status.trim() !== "") {
      query = query.eq("status", status.trim());
    }
    if (community) query = query.eq("community", community);
    if (pastor_id) query = query.eq("assigned_pastor_id", pastor_id);
    if (search) query = query.ilike("name", `%${search}%`);

    query = query.order("created_at", { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching applications:", error);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const applications = (data || []).map((app: any) => ({
      ...app,
      group_name: app.hub_groups?.name,
      group_pastor_id: app.hub_groups?.pastor_id,
      cell_name: app.hub_cells?.name,
      pastor_name: app.pastor?.name,
      pastor_email: app.pastor?.email,
      birth_date: app.user_profile?.birth_date,
      gender: app.user_profile?.gender,
      hub_groups: undefined,
      hub_cells: undefined,
      pastor: undefined,
      user_profile: undefined,
    }));

    return Response.json(
      {
        data: applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil(((count as any) || 0) / limitNum),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in applications API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

