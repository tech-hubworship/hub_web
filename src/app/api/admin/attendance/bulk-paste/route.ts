import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";
const MAX_ROWS = 99999;

type ParsedRow = {
  status: "present" | "late" | "unexcused_absence" | "excused";
  late_fee: number;
  is_report_required: boolean;
  is_excused: boolean;
  late_fee_excused: boolean;
  report_excused: boolean;
  note?: string | null;
};

function parseValue(val: string): ParsedRow | null {
  const v = val.trim();
  if (v === "0") {
    return {
      status: "present",
      late_fee: 0,
      is_report_required: false,
      is_excused: false,
      late_fee_excused: false,
      report_excused: false,
    };
  }
  if (v === "1")
    return { status: "late", late_fee: 1000, is_report_required: false, is_excused: false, late_fee_excused: false, report_excused: false };
  if (v === "2")
    return { status: "late", late_fee: 2000, is_report_required: false, is_excused: false, late_fee_excused: false, report_excused: false };
  if (v === "3")
    return { status: "late", late_fee: 3000, is_report_required: false, is_excused: false, late_fee_excused: false, report_excused: false };
  if (v === "4")
    return { status: "late", late_fee: 4000, is_report_required: true, is_excused: false, late_fee_excused: false, report_excused: false };
  if (v === "5")
    return { status: "unexcused_absence", late_fee: 5000, is_report_required: true, is_excused: false, late_fee_excused: false, report_excused: false };
  if (v === "예외" || v.toLowerCase() === "예외")
    return { status: "excused", late_fee: 0, is_report_required: false, is_excused: true, late_fee_excused: true, report_excused: true };
  if (v !== "") {
    return {
      status: "excused",
      late_fee: 0,
      is_report_required: false,
      is_excused: true,
      late_fee_excused: true,
      report_excused: true,
      note: v,
    };
  }
  return null;
}

type ParsedLine = { cellOrGroup: string; name: string; value: ParsedRow };

function parsePasteText(text: string): ParsedLine[] {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.length > 0);
  const result: ParsedLine[] = [];
  let lastCellOrGroup = "";
  for (const line of lines) {
    const parts = line.split(/\t/).map((s) => s.trim());
    let cellOrGroup = "";
    let name = "";
    let valueStr = "";
    if (parts.length >= 3) {
      cellOrGroup = parts[0] || lastCellOrGroup;
      name = parts[1];
      valueStr = parts[2];
    } else if (parts.length === 2) {
      name = parts[0];
      valueStr = parts[1];
      cellOrGroup = lastCellOrGroup;
    } else continue;
    if (!name) continue;
    if (cellOrGroup) lastCellOrGroup = cellOrGroup;
    const value = parseValue(valueStr);
    if (!value) continue;
    result.push({ cellOrGroup, name, value });
  }
  return result;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const weekDate = body?.weekDate ? String(body.weekDate).split("T")[0] : "";
  const text = typeof body?.text === "string" ? body.text : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekDate)) {
    return jsonError("weekDate(YYYY-MM-DD)가 필요합니다.", 400);
  }
  if (!text.trim()) {
    return jsonError("붙여넣을 텍스트가 비어 있습니다.", 400);
  }

  const rows = parsePasteText(text);
  if (rows.length === 0) {
    return jsonError("유효한 행이 없습니다. 형식: 다락방/역할\\t이름\\t값 (탭 구분). 값: 0=정상, 1~5=지각/무단결석, 예외 또는 사유텍스트=결석(인정)+예외사유", 400);
  }

  const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";

  // 해당 날짜(토요일) 기준: 0=10:30, 1=10:41, 2=10:51, 3=11:01, 4=11:11
  function attendedAtForValue(weekDateStr: string, lateFee: number): string | null {
    const times: Record<number, string> = {
      0: "10:30",
      1000: "10:41",
      2000: "10:51",
      3000: "11:01",
      4000: "11:11",
    };
    const t = times[lateFee];
    if (t == null) return null;
    return dayjs.tz(`${weekDateStr} ${t}`, "Asia/Seoul").toISOString();
  }

  try {
    const { data: roster, error: rosterError } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("user_id, name")
      .eq("category", CATEGORY_OD)
      .range(0, MAX_ROWS);

    if (rosterError) throw rosterError;
    if (!roster?.length) {
      return jsonError("OD 명단이 비어 있습니다.", 400);
    }

    const userIds = roster.map((r: any) => r.user_id);
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, group_id, cell_id, hub_groups:group_id(name), hub_cells:cell_id(name)")
      .in("user_id", userIds)
      .range(0, MAX_ROWS);

    if (profError) throw profError;

    type UserInfo = { user_id: string; cell_name: string | null; group_name: string | null };
    const nameToUsers = new Map<string, UserInfo[]>();
    const nameCellToUser = new Map<string, string>();
    const nameGroupToUser = new Map<string, string>();
    for (const p of profiles || []) {
      const name = (p as any).name?.trim() || (roster.find((r: any) => r.user_id === p.user_id) as any)?.name || "";
      const cell_name = (p as any).hub_cells?.name ?? null;
      const group_name = (p as any).hub_groups?.name ?? null;
      const user_id = (p as any).user_id;
      if (!nameToUsers.has(name)) nameToUsers.set(name, []);
      nameToUsers.get(name)!.push({ user_id, cell_name, group_name });
      if (name && cell_name) nameCellToUser.set(`${name}|${cell_name}`, user_id);
      if (name && group_name) nameGroupToUser.set(`${name}|${group_name}`, user_id);
    }

    const notFound: string[] = [];
    const toUpsert: { user_id: string; row: ParsedRow }[] = [];

    for (const { cellOrGroup, name, value } of rows) {
      let user_id: string | null = null;
      if (cellOrGroup) {
        user_id = nameCellToUser.get(`${name}|${cellOrGroup}`) ?? nameGroupToUser.get(`${name}|${cellOrGroup}`) ?? null;
      }
      if (!user_id) {
        const candidates = nameToUsers.get(name);
        if (candidates?.length) user_id = candidates[0].user_id;
      }
      if (!user_id) {
        notFound.push(cellOrGroup ? `${cellOrGroup}\t${name}` : name);
        continue;
      }
      toUpsert.push({ user_id, row: value });
    }

    let inserted = 0;
    let updated = 0;

    for (const { user_id, row } of toUpsert) {
      const { data: existing } = await supabaseAdmin
        .from("weekly_attendance")
        .select("id")
        .eq("user_id", user_id)
        .eq("week_date", weekDate)
        .eq("category", CATEGORY_OD)
        .maybeSingle();

      const attendedAt =
        row.status === "excused" || row.status === "unexcused_absence"
          ? null
          : attendedAtForValue(weekDate, row.late_fee);

      if (row.status === "excused") {
        const payload = {
          status: "excused_absence",
          late_fee: 0,
          is_report_required: false,
          is_excused: true,
          late_fee_excused: true,
          report_excused: true,
          attended_at: null,
          note: row.note != null && row.note !== "" ? row.note : null,
          updated_by: adminName,
        };
        if (existing?.id) {
          const { error } = await supabaseAdmin
            .from("weekly_attendance")
            .update(payload)
            .eq("id", existing.id);
          if (error) throw error;
          updated += 1;
        } else {
          const { error } = await supabaseAdmin.from("weekly_attendance").insert({
            user_id,
            week_date: weekDate,
            category: CATEGORY_OD,
            ...payload,
          });
          if (error) throw error;
          inserted += 1;
        }
      } else {
        const status =
          row.status === "unexcused_absence"
            ? "unexcused_absence"
            : row.status === "present"
              ? "present"
              : "late";
        const payload = {
          status,
          late_fee: row.late_fee,
          is_report_required: row.is_report_required,
          is_excused: false,
          late_fee_excused: false,
          report_excused: false,
          attended_at: attendedAt,
          updated_by: adminName,
        };
        if (existing?.id) {
          const { error } = await supabaseAdmin
            .from("weekly_attendance")
            .update(payload)
            .eq("id", existing.id);
          if (error) throw error;
          updated += 1;
        } else {
          const { error } = await supabaseAdmin.from("weekly_attendance").insert({
            user_id,
            week_date: weekDate,
            category: CATEGORY_OD,
            ...payload,
          });
          if (error) throw error;
          inserted += 1;
        }
      }
    }

    return jsonOk(
      {
        message: "저장되었습니다.",
        inserted,
        updated,
        total: inserted + updated,
        notFound: notFound.length ? Array.from(new Set(notFound)).slice(0, 50) : undefined,
      },
      200
    );
  } catch (e) {
    console.error("bulk-paste error:", e);
    return jsonError(`저장 실패: ${(e as Error)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
