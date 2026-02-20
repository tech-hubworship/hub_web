import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { methodNotAllowed } from "@src/lib/api/response";

dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return Response.json({ error: "start, end (YYYY-MM-DD) 쿼리가 필요합니다." }, { status: 400 });
  }

  try {
    const startDate = dayjs(start).startOf("day");
    const endDate = dayjs(end).endOf("day");
    if (!startDate.isValid() || !endDate.isValid() || startDate.isAfter(endDate)) {
      return Response.json({ error: "유효한 start, end 날짜를 입력해 주세요." }, { status: 400 });
    }

    const startStr = startDate.format("YYYY-MM-DD");
    const endStr = endDate.format("YYYY-MM-DD");

    // 1. OD 명단 + 프로필(그룹/다락방)
    const { data: roster, error: rosterError } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("id, user_id, name, is_group_leader, is_cell_leader")
      .eq("category", CATEGORY_OD)
      .order("name");

    if (rosterError) throw rosterError;
    if (!roster || roster.length === 0) {
      return Response.json(
        { weekDates: [], rows: [], quarterlyTotals: [], lateCriteria: { start_hour: 10, start_minute: 0 } },
        { status: 200 }
      );
    }

    const userIds = roster.map((r: any) => r.user_id);

    const { data: profiles, error: profError } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, name, group_id, cell_id, hub_groups:group_id(id, name), hub_cells:cell_id(id, name)"
      )
      .in("user_id", userIds);

    if (profError) throw profError;

    const profileByUser = new Map(
      (profiles || []).map((p: any) => [
        p.user_id,
        {
          name: p.name,
          group_name: p.hub_groups?.name ?? null,
          cell_name: p.hub_cells?.name ?? null,
        },
      ])
    );

    // 2. 기간 내 주차 목록: weekly_attendance에 존재하는 week_date만 (OD 카테고리)
    const { data: distinctWeeks, error: weeksError } = await supabaseAdmin
      .from("weekly_attendance")
      .select("week_date")
      .eq("category", CATEGORY_OD)
      .gte("week_date", startStr)
      .lte("week_date", endStr);

    if (weeksError) throw weeksError;

    const weekDates = Array.from(
      new Set((distinctWeeks || []).map((r: any) => r.week_date))
    ).sort();

    // 3. 기간 내 전체 출석 기록 (user_id, week_date → late_fee, is_excused)
    const { data: attendanceRows, error: attError } = await supabaseAdmin
      .from("weekly_attendance")
      .select("user_id, week_date, late_fee, is_excused, status")
      .eq("category", CATEGORY_OD)
      .in("user_id", userIds)
      .gte("week_date", startStr)
      .lte("week_date", endStr);

    if (attError) throw attError;

    const feeByUserWeek = new Map<string, number | null>();
    for (const row of attendanceRows || []) {
      const key = `${row.user_id}:${row.week_date}`;
      // 예외 처리된 경우 프론트에서 '-' 표시할 수 있도록 null
      if ((row as any).is_excused) {
        feeByUserWeek.set(key, null);
      } else {
        feeByUserWeek.set(key, (row as any).late_fee ?? 0);
      }
    }

    // 4. 행 데이터 (그룹 → 다락방 → 이름 정렬)
    const rows = roster.map((r: any) => {
      const profile = profileByUser.get(r.user_id) || {};
      const weeklyFees: Record<string, number | null> = {};
      for (const w of weekDates) {
        const key = `${r.user_id}:${w}`;
        weeklyFees[w] = feeByUserWeek.has(key) ? feeByUserWeek.get(key)! : null;
      }
      return {
        id: r.id,
        user_id: r.user_id,
        name: (profile as any).name || r.name || "-",
        group_name: (profile as any).group_name ?? "-",
        cell_name: (profile as any).cell_name ?? "-",
        is_group_leader: !!r.is_group_leader,
        is_cell_leader: !!r.is_cell_leader,
        weeklyFees,
      };
    });

    rows.sort((a: any, b: any) => {
      const g = (a.group_name || "").localeCompare(b.group_name || "");
      if (g !== 0) return g;
      const c = (a.cell_name || "").localeCompare(b.cell_name || "");
      if (c !== 0) return c;
      return (a.name || "").localeCompare(b.name || "");
    });

    // 5. 분기별 지각비 합계 (기간 내 실제 데이터 있는 분기만)
    const qMap = new Map<string, number>();
    for (const row of attendanceRows || []) {
      const r = row as any;
      if (r.is_excused) continue;
      const d = dayjs(r.week_date);
      const qNum = Math.ceil((d.month() + 1) / 3);
      const q = `${d.year()} ${qNum}분기`;
      qMap.set(q, (qMap.get(q) || 0) + (r.late_fee ?? 0));
    }
    const quarterlyTotals = Array.from(qMap.entries())
      .map(([quarter, total]) => ({ quarter, total }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    // 6. 지각 기준 시각 (선택)
    const { data: recentToken } = await supabaseAdmin
      .from("qr_tokens")
      .select("late_at")
      .eq("category", CATEGORY_OD)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lateAt = (recentToken as any)?.late_at
      ? dayjs((recentToken as any).late_at).tz("Asia/Seoul")
      : dayjs().tz("Asia/Seoul").startOf("day").add(10, "hour");

    return Response.json(
      {
        weekDates,
        rows,
        quarterlyTotals,
        lateCriteria: { start_hour: lateAt.hour(), start_minute: lateAt.minute() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
