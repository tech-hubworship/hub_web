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
  // note 추가
  const { userId, weekDate, status, note, category = "OD" } = body;

  if (!userId || !weekDate || !status) {
    return jsonError("필수 정보가 누락되었습니다.", 400);
  }

  try {
    let updateData: any = { status };

    // note가 있으면 업데이트 데이터에 포함
    if (typeof note === "string") {
      updateData.note = note;
    }

    // 상태에 따른 지각비 자동 설정
    if (status === "excused" || status === "present") {
      updateData.late_fee = 0;
      updateData.is_report_required = false;
    } else if (status === "unexcused_absence") {
      updateData.late_fee = 5000;
      updateData.is_report_required = true;
    } else if (status === "late") {
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
      // 업데이트
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 신규 생성 (미출석자 처리)
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

    return jsonOk({ message: "저장되었습니다.", result }, 200);

  } catch (error) {
    console.error("Update Status Error:", error);
    return jsonError(`서버 오류: ${(error as any)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}