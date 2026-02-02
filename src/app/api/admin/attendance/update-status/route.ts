import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

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

  // 사유 필수 체크
  if (!note || typeof note !== "string" || note.trim() === "") {
    return jsonError("변경 사유는 필수입니다.", 400);
  }

  try {
    const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";
    const now = new Date().toISOString(); // 현재 시간

    // ⭐️ [핵심] 상태뿐만 아니라 '출석 시간(attended_at)'도 함께 업데이트
    let updateData: any = {
      status: status,
      note: note,
      updated_by: adminName,
      attended_at: now, // 👈 이걸 추가해야 UI에서 '미출석'이 아닌 상태로 인식합니다.
    };

    // 상태에 따른 지각비 및 보고서 로직
    if (status === "excused" || status === "present") {
      updateData.late_fee = 0;
      updateData.is_report_required = false;
    } else if (status === "unexcused_absence") {
      updateData.late_fee = 5000;
      updateData.is_report_required = true;
    } else if (status === "late") {
      // 수동 지각 처리 시 기본값 (필요 시 수정 가능)
      updateData.late_fee = 3000;
      updateData.is_report_required = false;
    }

    // 기존 데이터 확인
    const { data: existing } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id")
      .eq("user_id", userId)
      .eq("week_date", weekDate)
      .eq("category", category)
      .maybeSingle();

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