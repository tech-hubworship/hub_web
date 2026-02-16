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
  const { userId, weekDate, excuseLateFee, excuseReport, note, category = "OD" } = body;

  if (!userId || !weekDate || !note || typeof note !== "string" || note.trim() === "") {
    return jsonError("userId, weekDate, note가 필요합니다.", 400);
  }

  if (!excuseLateFee && !excuseReport) {
    return jsonError("지각비 예외처리 또는 OD 보고서 예외처리 중 하나 이상을 선택해주세요.", 400);
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
      status: "excused",
      note: note.trim(),
      updated_by: adminName,
    };
    if (!existing?.id) {
      updateData.attended_at = new Date().toISOString();
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
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .insert({
          user_id: userId,
          week_date: baseDate,
          category,
          ...updateData,
          late_fee: 0,
          is_report_required: false,
        })
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
