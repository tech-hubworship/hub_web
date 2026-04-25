import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";
const MAX_ROWS = 99999;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const manualId = url.searchParams.get("manualId"); // od_manual_late_fees id

  try {
    // ── 수동 항목 상세 조회 ──
    if (manualId) {
      const { data: item } = await supabaseAdmin
        .from("od_manual_late_fees")
        .select("*")
        .eq("id", manualId)
        .single();
      if (!item) return Response.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
      return Response.json({
        manualId,
        name: item.name,
        logs: [],
        settlements: [],
        totalLateFee: item.amount,
        totalSettled: item.settled,
        remaining: Math.max(0, item.amount - item.settled),
        isManual: true,
        note: item.note,
      });
    }

    // ── 기존 OD 명단 사용자 상세 조회 ──
    if (userId) {
      const { data: logs, error } = await supabaseAdmin
        .from("weekly_attendance")
        .select("id, week_date, status, is_excused, late_fee, is_report_required, attended_at, note, updated_by")
        .eq("user_id", userId)
        .eq("category", CATEGORY_OD)
        .gt("late_fee", 0)
        .order("week_date", { ascending: false })
        .range(0, MAX_ROWS);
      if (error) throw error;

      const { data: settlements, error: setError } = await supabaseAdmin
        .from("late_fee_settlements")
        .select("id, amount, note, settled_by, settled_at")
        .eq("user_id", userId)
        .eq("category", CATEGORY_OD)
        .order("settled_at", { ascending: false })
        .range(0, MAX_ROWS);
      if (setError) throw setError;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name")
        .eq("user_id", userId)
        .single();

      const totalLateFee = (logs || []).reduce((sum, r) => sum + (r.late_fee || 0), 0);
      const totalSettled = (settlements || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      return Response.json({
        userId,
        name: (profile as any)?.name || "-",
        logs: logs || [],
        settlements: settlements || [],
        totalLateFee,
        totalSettled,
        remaining: Math.max(0, totalLateFee - totalSettled),
      });
    }

    // ── 전체 목록 조회 (OD 명단 + 수동 항목 합산) ──

    // 1) OD 명단 기반
    const { data: roster } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("user_id, name")
      .eq("category", CATEGORY_OD)
      .order("name")
      .range(0, MAX_ROWS);

    const userIds = (roster || []).map((r: any) => r.user_id);

    const [attendanceRows, allSettlements, profiles] = await Promise.all([
      userIds.length > 0
        ? supabaseAdmin.from("weekly_attendance").select("user_id, late_fee")
            .eq("category", CATEGORY_OD).in("user_id", userIds).gt("late_fee", 0).range(0, MAX_ROWS)
        : { data: [] },
      userIds.length > 0
        ? supabaseAdmin.from("late_fee_settlements").select("user_id, amount")
            .eq("category", CATEGORY_OD).in("user_id", userIds).range(0, MAX_ROWS)
        : { data: [] },
      userIds.length > 0
        ? supabaseAdmin.from("profiles")
            .select("user_id, name, group_id, cell_id, hub_groups:group_id(name), hub_cells:cell_id(name)")
            .in("user_id", userIds).range(0, MAX_ROWS)
        : { data: [] },
    ]);

    const totalByUser = new Map<string, number>();
    ((attendanceRows as any).data || []).forEach((r: any) => {
      totalByUser.set(r.user_id, (totalByUser.get(r.user_id) || 0) + (r.late_fee || 0));
    });

    const settledByUser = new Map<string, number>();
    ((allSettlements as any).data || []).forEach((s: any) => {
      settledByUser.set(s.user_id, (settledByUser.get(s.user_id) || 0) + (s.amount || 0));
    });

    const profileMap = new Map<string, { name?: string; group_name: string; cell_name: string }>(
      ((profiles as any).data || []).map((p: any) => [
        p.user_id,
        { name: p.name, group_name: p.hub_groups?.name || "-", cell_name: p.hub_cells?.name || "-" },
      ])
    );

    const odData = (roster || [])
      .map((r: any) => {
        const profile = profileMap.get(r.user_id) || { group_name: "-", cell_name: "-" };
        const totalLateFee = totalByUser.get(r.user_id) || 0;
        const totalSettled = settledByUser.get(r.user_id) || 0;
        return {
          user_id: r.user_id,
          name: profile.name || r.name || "-",
          group_name: profile.group_name,
          cell_name: profile.cell_name,
          total_late_fee: totalLateFee,
          total_settled: totalSettled,
          remaining: Math.max(0, totalLateFee - totalSettled),
          isManual: false,
        };
      })
      .filter((d) => d.total_late_fee > 0);

    // 2) 수동 항목
    const { data: manualItems } = await supabaseAdmin
      .from("od_manual_late_fees")
      .select("*")
      .order("name");

    const manualData = (manualItems || []).map((m: any) => ({
      manual_id: m.id,
      name: m.name,
      group_name: m.group_name || "-",
      cell_name: m.cell_name || "-",
      total_late_fee: m.amount,
      total_settled: m.settled,
      remaining: Math.max(0, m.amount - m.settled),
      isManual: true,
      note: m.note,
    }));

    // 3) 합산
    const allData = [...odData, ...manualData].sort((a, b) => a.name.localeCompare(b.name, "ko"));

    const totalLateFeeAll = allData.reduce((s, d) => s + d.total_late_fee, 0);
    const totalSettledAll = allData.reduce((s, d) => s + d.total_settled, 0);

    return Response.json({
      data: allData,
      stats: {
        totalMembers: allData.length,
        membersWithLateFee: allData.length,
        totalLateFee: totalLateFeeAll,
        totalSettled: totalSettledAll,
        totalUnsettled: Math.max(0, totalLateFeeAll - totalSettledAll),
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}

/** POST: 수동 항목 추가 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { name, amount, group_name, cell_name, note } = body;
  if (!name || !amount) return Response.json({ error: "이름과 금액은 필수입니다." }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("od_manual_late_fees")
    .insert({ name, amount: Number(amount), group_name: group_name || null, cell_name: cell_name || null, note: note || null })
    .select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
}

/** PATCH: 수동 항목 정산 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { manual_id, settled } = body;
  if (!manual_id || settled == null) return Response.json({ error: "manual_id와 settled는 필수입니다." }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("od_manual_late_fees")
    .update({ settled: Number(settled), updated_at: new Date().toISOString() })
    .eq("id", manual_id)
    .select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

/** DELETE: 수동 항목 삭제 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const url = new URL(req.url);
  const manual_id = url.searchParams.get("manual_id");
  if (!manual_id) return Response.json({ error: "manual_id가 필요합니다." }, { status: 400 });

  const { error } = await supabaseAdmin.from("od_manual_late_fees").delete().eq("id", manual_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
