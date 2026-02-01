import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { methodNotAllowed } from "@src/lib/api/response";
import { calculateLateFee } from "@src/lib/attendance/late-fee";

dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TZ_KR = "Asia/Seoul";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const token = body?.token;
  const category = body?.category;
  const now = dayjs().tz(TZ_KR);

  try {
    const { data: validToken, error: tokenError } = await supabaseAdmin
      .from("qr_tokens")
      .select("*")
      .eq("token", token)
      .gt("expires_at", now.toISOString())
      .single();

    if (tokenError || !validToken) {
      return Response.json({ error: "유효하지 않거나 만료된 QR 코드입니다." }, { status: 400 });
    }

    if (category === "OD") {
      const { data: userRoles } = await supabaseAdmin
        .from("admin_roles")
        .select("roles(name)")
        .eq("user_id", session.user.id);

      const hasLeadership = (userRoles as any[])?.some((r: any) =>
        ["리더십", "MC", "목회자", "그룹장", "다락방장"].includes(r.roles?.name)
      );

      if (!hasLeadership) {
        const { data: odTarget } = await supabaseAdmin
          .from("attendance_od_targets")
          .select("id")
          .eq("category", "OD")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!odTarget) {
          return Response.json(
            { error: "OD 출석 대상이 아닙니다. 관리자에게 문의하세요.", code: "NOT_OD_TARGET" },
            { status: 403 }
          );
        }
      }
    }

    const baseDate = now.format("YYYY-MM-DD");
    const { status, lateFee, isReportRequired } = calculateLateFee(now, baseDate);

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("weekly_attendance")
      .insert({
        user_id: session.user.id,
        category,
        status,
        late_fee: lateFee,
        is_report_required: isReportRequired ?? false,
        week_date: baseDate,
        attended_at: now.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if ((insertError as any).code === "23505") {
        const { data: existingData } = await supabaseAdmin
          .from("weekly_attendance")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("category", category)
          .eq("week_date", baseDate)
          .single();

        return Response.json(
          { message: "이미 출석이 완료되었습니다.", alreadyChecked: true, result: existingData },
          { status: 200 }
        );
      }
      return Response.json({ error: "출석 저장 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json({ message: "출석이 완료되었습니다.", result: insertedData }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "서버 내부 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

