import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || [];
    if (!userRoles.includes("목회자")) {
      return Response.json({ error: "목회자 권한이 필요합니다." }, { status: 403 });
    }

    const pastorId = session.user.id;
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = url.searchParams.get("page") ?? "1";
    const limit = url.searchParams.get("limit") ?? "20";
    const search = url.searchParams.get("search") ?? "";

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const searchQuery = typeof search === "string" ? search.trim() : "";

    let countQuery = supabaseAdmin
      .from("bible_card_applications")
      .select("id", { count: "exact", head: true })
      .eq("assigned_pastor_id", pastorId);

    if (status) {
      if (status === "completed") {
        countQuery = countQuery.not("bible_verse", "is", null);
      } else if (status === "assigned") {
        countQuery = countQuery.eq("status", "assigned").is("bible_verse", null);
      } else {
        countQuery = countQuery.eq("status", status);
      }
    }

    if (searchQuery) {
      countQuery = countQuery.or(
        `name.ilike.%${searchQuery}%,bible_verse.ilike.%${searchQuery}%,bible_verse_reference.ilike.%${searchQuery}%`
      );
    }

    const { count } = await countQuery;

    let query = supabaseAdmin
      .from("bible_card_applications")
      .select(
        `
        *,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name),
        user_profile:user_id(birth_date, gender)
      `
      )
      .eq("assigned_pastor_id", pastorId)
      .order("assigned_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) {
      if (status === "completed") {
        query = query.not("bible_verse", "is", null);
      } else if (status === "assigned") {
        query = query.eq("status", "assigned").is("bible_verse", null);
      } else {
        query = query.eq("status", status);
      }
    }

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,bible_verse.ilike.%${searchQuery}%,bible_verse_reference.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching assigned applications:", error);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const applications = (data || []).map((app: any) => ({
      ...app,
      group_name: app.hub_groups?.name,
      cell_name: app.hub_cells?.name,
      birth_date: app.user_profile?.birth_date,
      gender: app.user_profile?.gender,
      hub_groups: undefined,
      hub_cells: undefined,
      user_profile: undefined,
    }));

    const { data: allAssigned } = await supabaseAdmin
      .from("bible_card_applications")
      .select("status, bible_verse")
      .eq("assigned_pastor_id", pastorId);

    const stats = {
      total: allAssigned?.length || 0,
      assigned:
        allAssigned?.filter((a: any) => a.status === "assigned" && a.bible_verse == null).length ||
        0,
      completed:
        allAssigned?.filter((a: any) => a.bible_verse != null && a.bible_verse.trim() !== "")
          .length || 0,
      delivered: allAssigned?.filter((a: any) => a.status === "delivered").length || 0,
    };

    return Response.json(
      {
        data: applications,
        stats,
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
    console.error("Error in assigned API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

