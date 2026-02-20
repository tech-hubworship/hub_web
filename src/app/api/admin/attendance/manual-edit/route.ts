import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const {
    userId,
    weekDate,
    category = CATEGORY_OD,
    attended_at,
    status,
    note,
    late_fee,
    is_report_required,
    is_excused,
  } = body;

  if (!userId || !weekDate) {
    return jsonError("userId, weekDate가 필요합니다.", 400);
  }

  const baseDate = typeof weekDate === "string" ? weekDate.split("T")[0] : weekDate;
  const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";

  const updatePayload: Record<string, unknown> = {
    updated_by: adminName,
  };
  if (note !== undefined) updatePayload.note = note == null || note === "" ? null : String(note).trim();
  if (attended_at !== undefined) updatePayload.attended_at = attended_at == null || attended_at === "" ? null : new Date(attended_at).toISOString();
  if (status !== undefined) updatePayload.status = status == null || status === "" ? null : String(status);
  if (late_fee !== undefined) {
    if (late_fee == null || late_fee === "") updatePayload.late_fee = null;
    else if (typeof late_fee === "number" && !Number.isNaN(late_fee)) updatePayload.late_fee = Math.max(0, late_fee);
    else if (typeof late_fee === "string") {
      const n = parseInt(late_fee, 10);
      updatePayload.late_fee = (late_fee as string).trim() === "" ? null : (Number.isNaN(n) ? 0 : Math.max(0, n));
    }
  }
  if (is_report_required !== undefined) updatePayload.is_report_required = is_report_required === null ? null : !!is_report_required;
  if (is_excused !== undefined) updatePayload.is_excused = is_excused === null ? null : !!is_excused;

  try {
    const { data: existing } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id")
      .eq("user_id", userId)
      .eq("week_date", baseDate)
      .eq("category", category)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .update(updatePayload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return jsonOk({ message: "출석 정보가 수정되었습니다.", result: data }, 200);
    }

    const insertPayload = {
      user_id: userId,
      week_date: baseDate,
      category,
      status: updatePayload.status != null ? (updatePayload.status as string) : "present",
      late_fee: updatePayload.late_fee != null ? (updatePayload.late_fee as number) : 0,
      is_report_required: updatePayload.is_report_required != null ? (updatePayload.is_report_required as boolean) : false,
      is_excused: updatePayload.is_excused != null ? (updatePayload.is_excused as boolean) : false,
      note: updatePayload.note ?? null,
      attended_at: updatePayload.attended_at !== undefined ? updatePayload.attended_at : null,
      updated_by: updatePayload.updated_by,
    };
    const { data, error } = await supabaseAdmin
      .from("weekly_attendance")
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw error;
    return jsonOk({ message: "출석이 등록되었습니다.", result: data }, 200);
  } catch (e) {
    console.error("Manual edit error:", e);
    return jsonError(`서버 오류: ${(e as Error)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
