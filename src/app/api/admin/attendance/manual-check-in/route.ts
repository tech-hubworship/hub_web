import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { methodNotAllowed } from "@src/lib/api/response";
import { calculateLateFeeWithThreshold, buildLateThresholdForDate } from "@src/lib/attendance/late-fee";

dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const { userId, weekDate, category = "OD", attendedAt } = body ?? {};

    if (!userId || !weekDate) {
      return Response.json({ error: "userId, weekDate가 필요합니다." }, { status: 400 });
    }

    const checkInTime = attendedAt
      ? dayjs(attendedAt).tz("Asia/Seoul")
      : dayjs().tz("Asia/Seoul");

    const baseDate = typeof weekDate === "string" ? weekDate.split("T")[0] : dayjs(weekDate).format("YYYY-MM-DD");

    const { data: recentToken } = await supabaseAdmin
      .from("qr_tokens")
      .select("late_at")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lateAtSource = (recentToken as any)?.late_at
      ? dayjs((recentToken as any).late_at).tz("Asia/Seoul")
      : checkInTime.clone().startOf("day").add(10, "hour");
    const lateThreshold = buildLateThresholdForDate(baseDate, lateAtSource);

    const { status, lateFee, isReportRequired } = calculateLateFeeWithThreshold(checkInTime, lateThreshold);

    const { data: inserted, error } = await supabaseAdmin
      .from("weekly_attendance")
      .insert({
        user_id: userId,
        category,
        status,
        late_fee: lateFee,
        is_report_required: isReportRequired,
        week_date: baseDate,
        attended_at: checkInTime.toISOString(),
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        const { data: existing } = await supabaseAdmin
          .from("weekly_attendance")
          .select("id, is_excused")
          .eq("user_id", userId)
          .eq("week_date", baseDate)
          .eq("category", category)
          .single();
        // 기존에 지각비/보고서 예외가 적용된 경우: 출석 시각·상태만 갱신하고 예외 유지
        if (existing?.id && (existing as any).is_excused) {
          const { data: updated, error: updateErr } = await supabaseAdmin
            .from("weekly_attendance")
            .update({
              status,
              attended_at: checkInTime.toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();
          if (!updateErr) {
            return Response.json({
              message: "출석이 반영되었습니다. (상태·시각만 갱신, 예외 처리 유지)",
              result: updated,
            }, { status: 200 });
          }
        }
        const { data: existingFull } = await supabaseAdmin
          .from("weekly_attendance")
          .select("*")
          .eq("user_id", userId)
          .eq("week_date", baseDate)
          .eq("category", category)
          .single();
        return Response.json({
          message: "이미 출석 처리되어 있습니다.",
          result: existingFull,
        }, { status: 200 });
      }
      console.error(error);
      return Response.json({ error: "저장 실패" }, { status: 500 });
    }

    return Response.json({ message: "출석 처리되었습니다.", result: inserted }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
