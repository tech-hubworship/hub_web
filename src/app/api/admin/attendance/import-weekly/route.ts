import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";

type ImportRow = {
  name: string;
  group_name?: string | null;
  cell_name?: string | null;
  week_date: string;
  late_fee: number;
};

function statusFromLateFee(lateFee: number): string {
  if (lateFee === 0) return "present";
  if (lateFee === 5000) return "unexcused_absence";
  return "late";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: { rows?: ImportRow[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON body가 필요합니다." }, { status: 400 });
  }

  const rows = Array.isArray(body?.rows) ? body.rows : [];
  if (rows.length === 0) {
    return Response.json({ error: "rows 배열이 비어 있거나 없습니다." }, { status: 400 });
  }

  const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";

  try {
    // OD 명단 + 프로필(그룹/다락방 이름) 조회
    const { data: roster, error: rosterError } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("user_id, name")
      .eq("category", CATEGORY_OD);

    if (rosterError) throw rosterError;
    if (!roster?.length) {
      return Response.json({ error: "OD 명단이 비어 있습니다." }, { status: 400 });
    }

    const userIds = roster.map((r: any) => r.user_id);
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, name, group_id, cell_id, hub_groups:group_id(name), hub_cells:cell_id(name)"
      )
      .in("user_id", userIds);

    if (profError) throw profError;

    // (name, group_name?, cell_name?) -> user_id 후보 목록
    const nameToUsers = new Map<string, { user_id: string; group_name: string | null; cell_name: string | null }[]>();
    for (const p of profiles || []) {
      const name = (p as any).name?.trim() || (roster.find((r: any) => r.user_id === p.user_id) as any)?.name || "";
      const group_name = (p as any).hub_groups?.name ?? null;
      const cell_name = (p as any).hub_cells?.name ?? null;
      const key = name;
      if (!nameToUsers.has(key)) nameToUsers.set(key, []);
      nameToUsers.get(key)!.push({ user_id: (p as any).user_id, group_name, cell_name });
    }

    const notFound: string[] = [];
    const toUpsert: { user_id: string; week_date: string; late_fee: number; status: string }[] = [];

    for (const row of rows) {
      const name = String(row.name ?? "").trim();
      const week_date = String(row.week_date ?? "").split("T")[0];
      const late_fee = Math.min(5000, Math.max(0, Number(row.late_fee) || 0));

      if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(week_date)) continue;

      const candidates = nameToUsers.get(name);
      if (!candidates?.length) {
        notFound.push(name);
        continue;
      }

      let user_id: string | null = null;
      const gn = row.group_name != null ? String(row.group_name).trim() : null;
      const cn = row.cell_name != null ? String(row.cell_name).trim() : null;

      if (gn || cn) {
        const match = candidates.find(
          (c) =>
            (gn == null || c.group_name === gn) &&
            (cn == null || c.cell_name === cn)
        );
        user_id = match?.user_id ?? null;
      }
      if (!user_id) user_id = candidates[0].user_id;

      toUpsert.push({
        user_id,
        week_date,
        late_fee,
        status: statusFromLateFee(late_fee),
      });
    }

    let inserted = 0;
    let updated = 0;

    for (const u of toUpsert) {
      const { data: existing } = await supabaseAdmin
        .from("weekly_attendance")
        .select("id, late_fee")
        .eq("user_id", u.user_id)
        .eq("week_date", u.week_date)
        .eq("category", CATEGORY_OD)
        .maybeSingle();

      if (existing?.id) {
        const { error: upErr } = await supabaseAdmin
          .from("weekly_attendance")
          .update({
            late_fee: u.late_fee,
            status: u.status,
            updated_by: adminName,
          })
          .eq("id", existing.id);
        if (upErr) throw upErr;
        updated += 1;
      } else {
        const { error: inErr } = await supabaseAdmin.from("weekly_attendance").insert({
          user_id: u.user_id,
          week_date: u.week_date,
          category: CATEGORY_OD,
          status: u.status,
          late_fee: u.late_fee,
          is_report_required: false,
          is_excused: false,
          attended_at: new Date().toISOString(),
          updated_by: adminName,
        });
        if (inErr) throw inErr;
        inserted += 1;
      }
    }

    return Response.json({
      message: "이관 완료",
      inserted,
      updated,
      skipped: rows.length - toUpsert.length,
      notFound: notFound.length ? Array.from(new Set(notFound)).slice(0, 20) : undefined,
    });
  } catch (e) {
    console.error("import-weekly error:", e);
    return Response.json(
      { error: `이관 실패: ${(e as Error)?.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
