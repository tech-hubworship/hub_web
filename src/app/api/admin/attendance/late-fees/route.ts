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
  const userId = url.searchParams.get("userId");

  try {
    if (userId) {
      // 사용자별 지각비 로그 + 정산 로그 조회
      const { data: logs, error } = await supabaseAdmin
        .from("weekly_attendance")
        .select("id, week_date, status, is_excused, late_fee, is_report_required, attended_at, note, updated_by")
        .eq("user_id", userId)
        .eq("category", CATEGORY_OD)
        .gt("late_fee", 0)
        .order("week_date", { ascending: false });

      if (error) throw error;

      const { data: settlements, error: setError } = await supabaseAdmin
        .from("late_fee_settlements")
        .select("id, amount, note, settled_by, settled_at")
        .eq("user_id", userId)
        .eq("category", CATEGORY_OD)
        .order("settled_at", { ascending: false });

      if (setError) throw setError;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name")
        .eq("user_id", userId)
        .single();

      const totalLateFee = (logs || []).reduce((sum, r) => sum + (r.late_fee || 0), 0);
      const totalSettled = (settlements || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      return Response.json(
        {
          userId,
          name: (profile as any)?.name || "-",
          logs: logs || [],
          settlements: settlements || [],
          totalLateFee,
          totalSettled,
          remaining: Math.max(0, totalLateFee - totalSettled),
        },
        { status: 200 }
      );
    }

    // OD 명단 전체 + 총 지각비 합계
    const { data: roster, error: rosterError } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("user_id, name")
      .eq("category", CATEGORY_OD)
      .order("name");

    if (rosterError) throw rosterError;
    if (!roster || roster.length === 0) {
      return Response.json({ data: [], stats: { totalMembers: 0, totalLateFee: 0 } }, { status: 200 });
    }

    const userIds = roster.map((r: any) => r.user_id);

    const { data: attendanceRows, error: attError } = await supabaseAdmin
      .from("weekly_attendance")
      .select("user_id, late_fee")
      .eq("category", CATEGORY_OD)
      .in("user_id", userIds)
      .gt("late_fee", 0);

    if (attError) throw attError;

    const totalByUser = new Map<string, number>();
    (attendanceRows || []).forEach((r: any) => {
      const sum = totalByUser.get(r.user_id) || 0;
      totalByUser.set(r.user_id, sum + (r.late_fee || 0));
    });

    const userIdsWithLateFee = Array.from(totalByUser.keys());
    const settledByUser = new Map<string, number>();
    if (userIdsWithLateFee.length > 0) {
      const { data: settlements } = await supabaseAdmin
        .from("late_fee_settlements")
        .select("user_id, amount")
        .eq("category", CATEGORY_OD)
        .in("user_id", userIdsWithLateFee);
      (settlements || []).forEach((s: any) => {
        settledByUser.set(s.user_id, (settledByUser.get(s.user_id) || 0) + (s.amount || 0));
      });
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, group_id, cell_id, hub_groups:group_id(name), hub_cells:cell_id(name)")
      .in("user_id", userIds);

    type ProfileInfo = { name?: string; group_name: string; cell_name: string };
    const profileMap = new Map<string, ProfileInfo>(
      (profiles || []).map((p: any) => [
        p.user_id,
        {
          name: p.name,
          group_name: p.hub_groups?.name || "-",
          cell_name: p.hub_cells?.name || "-",
        },
      ])
    );

    const data = roster.map((r: any) => {
      const profile = profileMap.get(r.user_id) || { group_name: "-", cell_name: "-" };
      const totalLateFee = totalByUser.get(r.user_id) || 0;
      const totalSettled = settledByUser.get(r.user_id) || 0;
      const remaining = Math.max(0, totalLateFee - totalSettled);
      return {
        user_id: r.user_id,
        name: profile.name || r.name || "-",
        group_name: profile.group_name,
        cell_name: profile.cell_name,
        total_late_fee: totalLateFee,
        total_settled: totalSettled,
        remaining,
      };
    });

    const totalLateFeeAll = data.reduce((sum, d) => sum + d.total_late_fee, 0);

    return Response.json(
      {
        data: data.filter((d) => d.total_late_fee > 0),
        stats: {
          totalMembers: roster.length,
          membersWithLateFee: data.filter((d) => d.total_late_fee > 0).length,
          totalLateFee: totalLateFeeAll,
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
