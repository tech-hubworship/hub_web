import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const { userId, weekDate, excuseLateFee, excuseReport, note, status: exceptionStatus, category = "OD" } = body;

  if (!userId || !weekDate || !note || typeof note !== "string" || note.trim() === "") {
    return jsonError("userId, weekDate, note가 필요합니다.", 400);
  }

  if (!excuseLateFee && !excuseReport && exceptionStatus !== "excused_absence") {
    return jsonError("지각비 예외, OD 보고서 예외, 결석 상태 중 하나 이상을 선택해주세요.", 400);
  }

  try {
    const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";
    const baseDate = typeof weekDate === "string" ? weekDate.split("T")[0] : weekDate;

    const { data: existing } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id, status, late_fee, is_report_required")
      .eq("user_id", userId)
      .eq("week_date", baseDate)
      .eq("category", category)
      .maybeSingle();

    const updateData: Record<string, any> = {
      note: note.trim(),
      updated_by: adminName,
    };
    if (excuseLateFee || excuseReport) {
      updateData.is_excused = true;
    }
    if (exceptionStatus === "excused_absence") {
      updateData.status = "excused_absence";
    } else if (!existing?.id) {
      updateData.attended_at = new Date().toISOString();
      updateData.status = "present";
    }
    if (excuseLateFee) updateData.late_fee = 0;
    if (excuseReport) updateData.is_report_required = false;

    let result;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const insertPayload: Record<string, any> = {
        user_id: userId,
        week_date: baseDate,
        category,
        status: exceptionStatus === "excused_absence" ? "excused_absence" : "present",
        ...updateData,
        late_fee: 0,
        is_report_required: false,
      };
      if (excuseLateFee || excuseReport) insertPayload.is_excused = true;
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return jsonOk({ message: "예외 처리되었습니다.", result }, 200);
  } catch (error) {
    console.error("Exception API Error:", error);
    return jsonError(`서버 오류: ${(error as any)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
