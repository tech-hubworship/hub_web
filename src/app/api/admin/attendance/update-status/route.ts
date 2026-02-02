import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // 권한 체크: 관리자(Admin) 또는 MC
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const { userId, weekDate, status, category = "OD" } = body;

  if (!userId || !weekDate || !status) {
    return jsonError("필수 정보가 누락되었습니다.", 400);
  }

  try {
    // 1. 업데이트할 데이터 객체 생성
    // 주의: DB 스키마에 없는 컬럼(updated_at 등)을 넣으면 500 에러가 발생하므로 제거했습니다.
    let updateData: any = {
      status: status,
    };

    // 상태값에 따른 지각비 및 보고서 대상 여부 설정
    if (status === "excused" || status === "present") {
      // 사유 인정 또는 정상 출석 -> 벌금 0원
      updateData.late_fee = 0;
      updateData.is_report_required = false;
    } else if (status === "unexcused_absence") {
      // 무단 결석 -> 벌금 5000원, 보고서 대상
      updateData.late_fee = 5000;
      updateData.is_report_required = true;
    } else if (status === "late") {
      // 지각 (관리자 수동 처리 시 기본값) -> 벌금 3000원
      updateData.late_fee = 3000;
      updateData.is_report_required = false;
    }

    // 2. 기존 출석 데이터 존재 여부 확인
    const { data: existing } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id")
      .eq("user_id", userId)
      .eq("week_date", weekDate)
      .eq("category", category)
      .maybeSingle();

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
      const shouldSetTime = ["present", "late", "excused"].includes(status);

      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .insert({
          user_id: userId,
          week_date: weekDate,
          category,
          attended_at: shouldSetTime ? new Date().toISOString() : null,
          ...updateData,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return jsonOk({ message: "상태가 변경되었습니다.", result }, 200);

  } catch (error) {
    console.error("Update Status Error:", error);
    // 에러 메시지를 포함하여 반환 (디버깅 용이)
    return jsonError(`서버 오류 발생: ${(error as any)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}