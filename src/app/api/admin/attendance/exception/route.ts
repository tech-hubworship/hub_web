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

    // 예외처리 시 지각비/보고서 예외 반영. 결석(인정) 선택 시 status를 excused_absence로 설정.
    // excuseReport와 excused_absence를 동시에 선택한 경우: 결석 처리 + 보고서 예외 모두 반영.
    const isExcusedAbsence = exceptionStatus === "excused_absence";
    const updateData: Record<string, any> = {
      note: note.trim(),
      updated_by: adminName,
    };
    if (excuseLateFee) {
      updateData.late_fee = 0;
      updateData.late_fee_excused = true;
      updateData.is_excused = true;
    }
    if (excuseReport) {
      updateData.is_report_required = false;
      updateData.report_excused = true;
      updateData.is_excused = true;
    }
    if (isExcusedAbsence) {
      updateData.status = "excused_absence";
      updateData.is_excused = true;
      // excuseReport와 동시 선택 시: 보고서 예외처리 우선 적용 (is_report_required = false 유지)
      if (!excuseReport) {
        updateData.is_report_required = true;
        updateData.report_excused = false;
      }
    }

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
      // 기존 기록 없을 때: 새 행 생성. 예외처리이므로 출석 시간은 null.
      const insertPayload: Record<string, any> = {
        user_id: userId,
        week_date: baseDate,
        category,
        attended_at: null,
        status: isExcusedAbsence ? "excused_absence" : "present",
        note: note.trim(),
        updated_by: adminName,
        is_excused: !!(excuseLateFee || excuseReport || isExcusedAbsence),
        late_fee: 0,
        // excuseReport와 isExcusedAbsence 동시: 보고서 예외 우선 적용
        is_report_required: isExcusedAbsence && !excuseReport ? true : false,
        late_fee_excused: !!excuseLateFee,
        report_excused: !!excuseReport,
      };
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
