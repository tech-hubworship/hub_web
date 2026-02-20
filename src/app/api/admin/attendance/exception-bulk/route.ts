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
  const { weekDate, userIds, excuseLateFee, excuseReport, note, status: exceptionStatus, category = CATEGORY_OD } = body;

  if (!weekDate || !Array.isArray(userIds) || userIds.length === 0) {
    return jsonError("weekDate, userIds(배열)가 필요합니다.", 400);
  }
  if (!note || typeof note !== "string" || note.trim() === "") {
    return jsonError("note(변경 사유)가 필요합니다.", 400);
  }
  if (!excuseLateFee && !excuseReport && exceptionStatus !== "excused_absence") {
    return jsonError("지각비 예외, OD 보고서 예외, 결석 상태 중 하나 이상을 선택해주세요.", 400);
  }

  const baseDate = typeof weekDate === "string" ? weekDate.split("T")[0] : weekDate;
  const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";

  try {
    const updateData: Record<string, any> = {
      note: note.trim(),
      updated_by: adminName,
    };
    if (excuseLateFee || excuseReport) updateData.is_excused = true;
    if (excuseLateFee) updateData.late_fee = 0;
    if (excuseReport) updateData.is_report_required = false;
    if (exceptionStatus === "excused_absence") updateData.status = "excused_absence";

    let processed = 0;
    let inserted = 0;

    for (const userId of userIds) {
      const { data: existing } = await supabaseAdmin
        .from("weekly_attendance")
        .select("id")
        .eq("user_id", userId)
        .eq("week_date", baseDate)
        .eq("category", category)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabaseAdmin
          .from("weekly_attendance")
          .update(updateData)
          .eq("id", existing.id);
        if (!error) processed += 1;
      } else {
        const insertRow: Record<string, any> = {
          user_id: userId,
          week_date: baseDate,
          category,
          status: exceptionStatus === "excused_absence" ? "excused_absence" : "present",
          late_fee: 0,
          is_report_required: false,
          note: note.trim(),
          attended_at: new Date().toISOString(),
          updated_by: adminName,
        };
        if (excuseLateFee || excuseReport) insertRow.is_excused = true;
        const { error } = await supabaseAdmin.from("weekly_attendance").insert(insertRow);
        if (!error) {
          processed += 1;
          inserted += 1;
        }
      }
    }

    return jsonOk({ message: `${processed}명 예외 처리되었습니다. (신규 ${inserted}건)`, processed, inserted }, 200);
  } catch (e) {
    console.error("Exception bulk error:", e);
    return jsonError(`서버 오류: ${(e as Error)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
