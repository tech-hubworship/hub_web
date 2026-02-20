import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { calculateLateFeeWithThreshold, buildLateThresholdForDate } from "@src/lib/attendance/late-fee";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // 권한 체크
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const { userId, weekDate, status, note, category = "OD" } = body;

  if (!userId || !weekDate || !status) {
    return jsonError("필수 정보가 누락되었습니다.", 400);
  }

  const noteTrimmed = typeof note === "string" ? note.trim() : "";

  try {
    const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";
    const now = dayjs().tz("Asia/Seoul");
    const nowIso = now.toISOString();
    const baseDate = typeof weekDate === "string" ? weekDate.split("T")[0] : weekDate;

    // 기존 데이터 확인 (예외 처리 유지 여부 판단용)
    const { data: existing } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id, is_excused, late_fee, is_report_required, late_fee_excused, report_excused")
      .eq("user_id", userId)
      .eq("week_date", baseDate)
      .eq("category", category)
      .maybeSingle();

    // status: 출석 상태만 (present | late | unexcused_absence). 예외는 is_excused로 별도 관리
    let updateData: Record<string, any> = {
      updated_by: adminName,
      attended_at: nowIso,
    };
    if (noteTrimmed !== "") {
      updateData.note = noteTrimmed;
    }

    if (status === "excused") {
      updateData.is_excused = true;
      updateData.status = "present";
      updateData.late_fee = 0;
      updateData.is_report_required = false;
    } else {
      updateData.status = status;
      updateData.is_excused = false; // 출석/지각/결석으로 수동 변경 시 예외 해제
    }

    // 출석 버튼 클릭 시: 버튼 눌린 시각(현재)으로 지각 여부 자동 판단
    if (status === "present") {
      const { data: recentToken } = await supabaseAdmin
        .from("qr_tokens")
        .select("late_at")
        .eq("category", category)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lateAtSource = (recentToken as any)?.late_at
        ? dayjs((recentToken as any).late_at).tz("Asia/Seoul")
        : now.startOf("day").add(10, "hour");
      const lateThreshold = buildLateThresholdForDate(baseDate, lateAtSource);

      const { status: calcStatus, lateFee, isReportRequired } = calculateLateFeeWithThreshold(now, lateThreshold);
      updateData.status = calcStatus;
      // 기존에 지각비/보고서 예외가 적용된 경우: 예외 유지(지각비·보고서·예외 플래그 덮어쓰지 않음)
      if (existing?.id && (existing as any).is_excused) {
        updateData.is_excused = true;
        updateData.late_fee = (existing as any).late_fee ?? 0;
        updateData.is_report_required = (existing as any).is_report_required ?? false;
        updateData.late_fee_excused = (existing as any).late_fee_excused ?? false;
        updateData.report_excused = (existing as any).report_excused ?? false;
      } else {
        updateData.late_fee = lateFee;
        updateData.is_report_required = isReportRequired;
      }
    } else if (status === "unexcused_absence") {
      updateData.late_fee = 5000;
      updateData.is_report_required = true;
      updateData.late_fee_excused = false;
      updateData.report_excused = false;
    }

    let result;

    if (existing) {
      // [UPDATE] 기존 기록이 있다면 시간과 상태를 덮어씁니다.
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // [INSERT] 미출석자라면 새로 만듭니다.
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .insert({
          user_id: userId,
          week_date: weekDate,
          category,
          ...updateData, // 여기에 attended_at이 포함되어 있음
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return jsonOk({ message: "상태가 변경되었습니다.", result }, 200);

  } catch (error) {
    console.error("Update Status Error:", error);
    return jsonError(`서버 오류: ${(error as any)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}