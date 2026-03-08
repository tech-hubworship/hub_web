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
const PAGE_SIZE = 1000;

async function fetchAll<T = any>(
  fetchPage: (offset: number, limit: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await fetchPage(offset, PAGE_SIZE);
    if (error) throw error;
    const page = data || [];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

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

    // 1. OD 명단 — 페이지네이션으로 전체 조회 (Supabase 1000행 제한 회피)
    const roster = await fetchAll<any>(async (offset, limit) => {
      return supabaseAdmin
        .from("attendance_od_targets")
        .select("id, user_id, name, is_group_leader, is_cell_leader")
        .eq("category", CATEGORY_OD)
        .order("name")
        .range(offset, offset + limit - 1);
    });

    if (roster.length === 0) {
      return Response.json(
        { weekDates: [], rows: [], quarterlyTotals: [], lateCriteria: { start_hour: 10, start_minute: 0 } },
        { status: 200 }
      );
    }

    const userIds = roster.map((r: any) => r.user_id);

    // 프로필 — 페이지네이션으로 전체 조회
    const profiles = await fetchAll<any>(async (offset, limit) => {
      return supabaseAdmin
        .from("profiles")
        .select(
          "user_id, name, group_id, cell_id, hub_groups:group_id(id, name), hub_cells:cell_id(id, name)"
        )
        .in("user_id", userIds)
        .range(offset, offset + limit - 1);
    });

    const profileByUser = new Map(
      profiles.map((p: any) => [
        p.user_id,
        {
          name: p.name,
          group_name: p.hub_groups?.name ?? null,
          cell_name: p.hub_cells?.name ?? null,
        },
      ])
    );

    // 2. 기간 내 주차 목록: weekly_attendance week_date — 페이지네이션
    const distinctWeeks = await fetchAll<any>(async (offset, limit) => {
      return supabaseAdmin
        .from("weekly_attendance")
        .select("week_date")
        .eq("category", CATEGORY_OD)
        .gte("week_date", startStr)
        .lte("week_date", endStr)
        .range(offset, offset + limit - 1);
    });

    const weekDates = Array.from(
      new Set(distinctWeeks.map((r: any) => r.week_date))
    ).sort();

    // 3. 기간 내 전체 출석 기록 — 페이지네이션으로 전체 조회
    const attendanceRows = await fetchAll<any>(async (offset, limit) => {
      return supabaseAdmin
        .from("weekly_attendance")
        .select("user_id, week_date, attended_at, late_fee, is_excused, status, is_report_required, late_fee_excused, report_excused, note, updated_by")
        .eq("category", CATEGORY_OD)
        .in("user_id", userIds)
        .gte("week_date", startStr)
        .lte("week_date", endStr)
        .range(offset, offset + limit - 1);
    });

    type CellData = {
      fee: number | null;
      status: string | null;
      attended_at: string | null;
      is_report_required: boolean;
      late_fee_excused: boolean;
      report_excused: boolean;
      note: string | null;
      updated_by: string | null;
    };
    const dataByUserWeek = new Map<string, CellData>();
    for (const row of attendanceRows) {
      const r = row as any;
      const key = `${r.user_id}:${r.week_date}`;
      dataByUserWeek.set(key, {
        fee: r.late_fee ?? 0,
        status: r.status ?? null,
        attended_at: r.attended_at ?? null,
        is_report_required: !!r.is_report_required,
        late_fee_excused: !!r.late_fee_excused,
        report_excused: !!r.report_excused,
        note: r.note ?? null,
        updated_by: r.updated_by ?? null,
      });
    }

    // 4. 행 데이터 (그룹 → 다락방 → 이름 정렬), 주차별 셀에 fee + status + 예외 정보 + 출석 시각
    const rows = roster.map((r: any) => {
      const profile = profileByUser.get(r.user_id) || {};
      const weeklyFees: Record<string, number | null> = {};
      const weeklyData: Record<string, CellData> = {};
      const weeklyAttendedAt: Record<string, string | null> = {};
      for (const w of weekDates) {
        const key = `${r.user_id}:${w}`;
        const cell = dataByUserWeek.get(key);
        if (cell) {
          weeklyData[w] = cell;
          weeklyFees[w] = cell.fee;
          weeklyAttendedAt[w] = cell.attended_at;
        } else {
          weeklyFees[w] = null;
          weeklyAttendedAt[w] = null;
        }
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
        weeklyData,
        weeklyAttendedAt,
      };
    });

    // 그룹 → 그룹장 최상단 → 다락방 → 다락방장 최상단 → 이름
    rows.sort((a: any, b: any) => {
      const g = (a.group_name || "").localeCompare(b.group_name || "");
      if (g !== 0) return g;
      if (a.is_group_leader !== b.is_group_leader) return a.is_group_leader ? -1 : 1; // 그룹장 먼저
      const c = (a.cell_name || "").localeCompare(b.cell_name || "");
      if (c !== 0) return c;
      if (a.is_cell_leader !== b.is_cell_leader) return a.is_cell_leader ? -1 : 1; // 다락방장 먼저
      return (a.name || "").localeCompare(b.name || "");
    });

    // 5. 분기별 지각비 합계 (기간 내 실제 데이터, 예외 제외)
    const qMap = new Map<string, number>();
    for (const row of attendanceRows) {
      const r = row as any;
      if (r.late_fee_excused) continue; // 지각비 예외 시 합계 제외
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
