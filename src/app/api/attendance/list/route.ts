import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const category = url.searchParams.get("category");
  const group_id = url.searchParams.get("group_id");
  const cell_id = url.searchParams.get("cell_id");
  const page = url.searchParams.get("page") ?? "1";
  const limit = url.searchParams.get("limit") ?? "20";
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = supabaseAdmin
      .from("weekly_attendance")
      .select(
        `
        *,
        profiles!inner (
          name,
          group_id,
          cell_id,
          groups:group_id(name),
          cells:cell_id(name)
        )
      `,
        { count: "exact" }
      );

    if (date) query = query.eq("week_date", date);
    if (category) query = query.eq("category", category);
    if (group_id) query = query.eq("profiles.group_id", group_id);
    if (cell_id) query = query.eq("profiles.cell_id", cell_id);

    query = query.order("attended_at", { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    let totalMembersQuery = supabaseAdmin
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("community", "허브")
      .eq("status", "활성");

    if (group_id) totalMembersQuery = totalMembersQuery.eq("group_id", group_id);
    if (cell_id) totalMembersQuery = totalMembersQuery.eq("cell_id", cell_id);

    const { count: totalCount } = await totalMembersQuery;
    const attendedCount = count || 0;

    return Response.json(
      {
        data,
        stats: {
          total_members: totalCount || 0,
          attended_count: attendedCount,
          attendance_rate: totalCount ? Math.round((attendedCount / totalCount) * 100) : 0,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(((count as any) || 0) / Number(limit)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

