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

const TZ_KR = "Asia/Seoul";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const token = body?.token;
  const category = body?.category;
  const now = dayjs().tz(TZ_KR);

  // 토큰 허용: 현재 유효하거나, 만료 후 2분 이내 (59초에 찍고 요청이 늦게 도착한 경우 대비)
  const GRACE_SECONDS = 120;

  try {
    const { data: validToken, error: tokenError } = await supabaseAdmin
      .from("qr_tokens")
      .select("id, token, category, late_at, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !validToken) {
      return Response.json({ error: "유효하지 않은 QR 코드입니다." }, { status: 400 });
    }

    const expiresAt = dayjs(validToken.expires_at).tz(TZ_KR);
    const graceCutoff = now.subtract(GRACE_SECONDS, "second");
    if (expiresAt.isBefore(graceCutoff)) {
      return Response.json({ error: "만료된 QR 코드입니다. 새 QR 코드를 스캔해 주세요." }, { status: 400 });
    }

    const baseDate = now.format("YYYY-MM-DD");
    const lateAtSource = validToken.late_at ? dayjs(validToken.late_at).tz(TZ_KR) : now.startOf("day").add(10, "hour");
    const lateThreshold = buildLateThresholdForDate(baseDate, lateAtSource);

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
          const { data: profileRow } = await supabaseAdmin
            .from("profiles")
            .select("name, email, community, group_id, cell_id, hub_groups:group_id(name), hub_cells:cell_id(name)")
            .eq("user_id", session.user.id)
            .maybeSingle();
          const p = profileRow as any;
          const profile = p
            ? {
                email: p.email ?? (session.user?.email ?? null),
                name: p.name ?? (session.user?.name ?? null),
                community: p.community ?? null,
                group: p.hub_groups?.name ?? null,
                cell: p.hub_cells?.name ?? null,
              }
            : {
                email: session.user?.email ?? null,
                name: session.user?.name ?? null,
                community: null,
                group: null,
                cell: null,
              };
          return Response.json(
            { error: "명단에 없습니다.", code: "NOT_OD_TARGET", profile },
            { status: 403 }
          );
        }
      }
    }

    const { status, lateFee, isReportRequired } = calculateLateFeeWithThreshold(now, lateThreshold);

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
        const { data: existingRow } = await supabaseAdmin
          .from("weekly_attendance")
          .select("id, is_excused, status")
          .eq("user_id", session.user.id)
          .eq("category", category)
          .eq("week_date", baseDate)
          .single();

        // 기존에 지각비/보고서 예외가 적용된 경우: 상태·출석 시각만 갱신, late_fee·is_report_required는 예외 값 유지
        if (existingRow?.id && (existingRow as any).is_excused) {
          const { data: updated, error: updateErr } = await supabaseAdmin
            .from("weekly_attendance")
            .update({
              status,
              attended_at: now.toISOString(),
            })
            .eq("id", existingRow.id)
            .select()
            .single();
          if (!updateErr) {
            return Response.json(
              { message: "출석이 완료되었습니다.", result: updated },
              { status: 200 }
            );
          }
        }

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

