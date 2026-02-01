import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  if (!date) {
    return Response.json({ error: "date가 필요합니다." }, { status: 400 });
  }

  try {
    // 1. OD 명단 전체 (attendance_od_targets)
    const { data: roster, error: rosterError } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("id, user_id, name")
      .eq("category", CATEGORY_OD)
      .order("name");

    if (rosterError) throw rosterError;

    if (!roster || roster.length === 0) {
      return Response.json(
        {
          data: [],
          stats: { total_members: 0, attended_count: 0, attendance_rate: 0 },
          pagination: { page: 1, limit: 0, total: 0, totalPages: 0 },
        },
        { status: 200 }
      );
    }

    const userIds = roster.map((r: any) => r.user_id);

    // 2. 해당 날짜 OD 출석 기록
    const { data: attendanceRows, error: attError } = await supabaseAdmin
      .from("weekly_attendance")
      .select("user_id, attended_at, status, late_fee, is_report_required")
      .eq("week_date", date)
      .eq("category", CATEGORY_OD)
      .in("user_id", userIds);

    if (attError) throw attError;

    const attendanceByUser = new Map(
      (attendanceRows || []).map((a: any) => [a.user_id, a])
    );

    // 3. profiles에서 그룹/다락방 이름 조회
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        user_id,
        name,
        group_id,
        cell_id,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name)
      `
      )
      .in("user_id", userIds);

    if (profError) throw profError;

    const profileByUser = new Map(
      (profiles || []).map((p: any) => [
        p.user_id,
        {
          name: p.name,
          group_name: p.hub_groups?.name || null,
          cell_name: p.hub_cells?.name || null,
        },
      ])
    );

    // 4. OD 명단 순서대로 병합 (이름순)
    const data = roster.map((r: any) => {
      const profile = profileByUser.get(r.user_id) || {};
      const att = attendanceByUser.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        name: profile.name || r.name || "-",
        group_name: profile.group_name || "-",
        cell_name: profile.cell_name || "-",
        attended_at: att?.attended_at ?? null,
        status: att?.status ?? null,
        late_fee: att?.late_fee ?? 0,
        is_report_required: att?.is_report_required ?? false,
      };
    });

    const attendedCount = attendanceByUser.size;
    const totalMembers = roster.length;
    const attendanceRate = totalMembers ? Math.round((attendedCount / totalMembers) * 100) : 0;

    return Response.json(
      {
        data,
        stats: {
          total_members: totalMembers,
          attended_count: attendedCount,
          attendance_rate: attendanceRate,
        },
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
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
