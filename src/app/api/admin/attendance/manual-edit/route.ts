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
  if (note !== undefined) updatePayload.note = note == null ? null : String(note).trim();
  if (attended_at !== undefined) updatePayload.attended_at = attended_at ? new Date(attended_at).toISOString() : null;
  if (status !== undefined) updatePayload.status = status == null || status === "" ? "present" : String(status);
  if (typeof late_fee === "number" && !Number.isNaN(late_fee)) updatePayload.late_fee = Math.max(0, late_fee);
  if (typeof is_report_required === "boolean") updatePayload.is_report_required = is_report_required;
  if (typeof is_excused === "boolean") updatePayload.is_excused = is_excused;

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
      status: (updatePayload.status as string) ?? "present",
      late_fee: (updatePayload.late_fee as number) ?? 0,
      is_report_required: (updatePayload.is_report_required as boolean) ?? false,
      is_excused: (updatePayload.is_excused as boolean) ?? false,
      note: updatePayload.note ?? null,
      attended_at: updatePayload.attended_at ?? new Date().toISOString(),
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
