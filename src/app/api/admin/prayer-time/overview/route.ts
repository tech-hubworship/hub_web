import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanDateFormatted } from "@src/lib/utils/date";
import { jsonError, jsonOk } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

/** 한국 시간(KST) 기준 날짜 문자열로 해당 일 00:00 ~ 다음날 00:00 ISO 구간 반환 */
function getKstDayRange(dateStr: string) {
  const start = `${dateStr}T00:00:00.000+09:00`;
  const next = new Date(`${dateStr}T00:00:00+09:00`);
  next.setDate(next.getDate() + 1);
  const endStr = next.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const end = `${endStr}T00:00:00.000+09:00`;
  return { start, end };
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * 관리자용 기도 시간 개요 API
 * GET /api/admin/prayer-time/overview
 * Query: start_date, end_date (YYYY-MM-DD), page (1-based), page_size (기본 20)
 */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  try {
    const url = new URL(req.url);
    const kstToday = getKoreanDateFormatted();
    let startDate = url.searchParams.get("start_date") ?? "";
    let endDate = url.searchParams.get("end_date") ?? "";
    if (!startDate || !endDate) {
      const t = new Date();
      t.setDate(t.getDate() - 6);
      startDate = t.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
      endDate = kstToday;
    }
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(url.searchParams.get("page_size") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );

    await supabaseAdmin.rpc("delete_stale_prayer_sessions");

    const todayRange = getKstDayRange(kstToday);
    const rangeStart = `${startDate}T00:00:00.000+09:00`;
    const rangeEnd = `${endDate}T23:59:59.999+09:00`;

    // 1) 현재 기도 중인 세션 + 이름 + 그룹/다락방
    const { data: activeSessions } = await supabaseAdmin
      .from("prayer_sessions")
      .select("user_id, start_time")
      .order("start_time", { ascending: false });

    const activeUserIds = (activeSessions ?? []).map((s: any) => s.user_id);
    type ProfileRow = { user_id: string; name: string | null; hub_groups: { name: string } | null; hub_cells: { name: string } | null };
    let activeProfilesMap = new Map<string, { name: string; group_name: string; cell_name: string }>();
    if (activeUserIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name, hub_groups:group_id(name), hub_cells:cell_id(name)")
        .in("user_id", activeUserIds);
      (profiles as ProfileRow[] | null)?.forEach((p: ProfileRow) => {
        activeProfilesMap.set(p.user_id, {
          name: p.name ?? "알 수 없음",
          group_name: p.hub_groups?.name ?? "-",
          cell_name: p.hub_cells?.name ?? "-",
        });
      });
    }

    const now = new Date();
    const active_users = (activeSessions ?? []).map((s: any) => {
      const start = new Date(s.start_time);
      const duration_seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      const info = activeProfilesMap.get(s.user_id);
      return {
        user_id: s.user_id,
        name: info?.name ?? "알 수 없음",
        group_name: info?.group_name ?? "-",
        cell_name: info?.cell_name ?? "-",
        start_time: s.start_time,
        duration_seconds,
      };
    });

    // 2) 공동체 전체 누적 기도 시간
    const { data: allPrayers } = await supabaseAdmin
      .from("prayer_times")
      .select("duration_seconds")
      .not("duration_seconds", "is", null);
    const community_total_seconds =
      allPrayers?.reduce((sum: number, p: any) => sum + (p.duration_seconds || 0), 0) ?? 0;

    // 3) 오늘(KST) 사용자별 기도 시간 + 그룹/다락방
    const { data: todayPrayers } = await supabaseAdmin
      .from("prayer_times")
      .select("user_id, duration_seconds")
      .gte("start_time", todayRange.start)
      .lt("start_time", todayRange.end)
      .not("duration_seconds", "is", null);

    const todayUserMap = new Map<string, number>();
    todayPrayers?.forEach((p: any) => {
      const uid = p.user_id;
      todayUserMap.set(uid, (todayUserMap.get(uid) ?? 0) + (p.duration_seconds ?? 0));
    });
    const todayUserIds = Array.from(todayUserMap.keys());
    let todayProfilesMap = new Map<string, { name: string; group_name: string; cell_name: string }>();
    if (todayUserIds.length > 0) {
      const { data: todayProfiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name, hub_groups:group_id(name), hub_cells:cell_id(name)")
        .in("user_id", todayUserIds);
      (todayProfiles as ProfileRow[] | null)?.forEach((p: ProfileRow) => {
        todayProfilesMap.set(p.user_id, {
          name: p.name ?? "알 수 없음",
          group_name: p.hub_groups?.name ?? "-",
          cell_name: p.hub_cells?.name ?? "-",
        });
      });
    }
    const today_user_stats = Array.from(todayUserMap.entries())
      .map(([user_id, total_seconds]) => {
        const info = todayProfilesMap.get(user_id);
        return {
          user_id,
          name: info?.name ?? "알 수 없음",
          group_name: info?.group_name ?? "-",
          cell_name: info?.cell_name ?? "-",
          total_seconds,
        };
      })
      .sort((a, b) => b.total_seconds - a.total_seconds);

    // 4) 기간 내 기록 목록 (페이징)
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("prayer_times")
      .select("id", { count: "exact", head: true })
      .gte("start_time", rangeStart)
      .lte("start_time", rangeEnd)
      .not("duration_seconds", "is", null);

    if (countError) {
      console.error("Prayer times count error:", countError);
    }
    const total_records = typeof totalCount === "number" ? totalCount : 0;

    const { data: records } = await supabaseAdmin
      .from("prayer_times")
      .select("id, user_id, start_time, end_time, duration_seconds")
      .gte("start_time", rangeStart)
      .lte("start_time", rangeEnd)
      .not("duration_seconds", "is", null)
      .order("start_time", { ascending: false })
      .range(from, to);

    const recordUserIds = Array.from(new Set((records ?? []).map((r: any) => r.user_id)));
    let recordProfilesMap = new Map<string, { name: string; group_name: string; cell_name: string }>();
    if (recordUserIds.length > 0) {
      const { data: recordProfiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name, hub_groups:group_id(name), hub_cells:cell_id(name)")
        .in("user_id", recordUserIds);
      (recordProfiles as ProfileRow[] | null)?.forEach((p: ProfileRow) => {
        recordProfilesMap.set(p.user_id, {
          name: p.name ?? "알 수 없음",
          group_name: p.hub_groups?.name ?? "-",
          cell_name: p.hub_cells?.name ?? "-",
        });
      });
    }
    const recent_records = (records ?? []).map((r: any) => {
      const info = recordProfilesMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        name: info?.name ?? "알 수 없음",
        group_name: info?.group_name ?? "-",
        cell_name: info?.cell_name ?? "-",
        start_time: r.start_time,
        end_time: r.end_time,
        duration_seconds: r.duration_seconds,
      };
    });

    return jsonOk(
      {
        success: true,
        data: {
          date: kstToday,
          start_date: startDate,
          end_date: endDate,
          active_users,
          community_total_seconds,
          today_user_stats,
          recent_records,
          pagination: {
            page,
            page_size: pageSize,
            total_count: total_records,
            total_pages: Math.ceil(total_records / pageSize) || 1,
          },
        },
      },
      200
    );
  } catch (err) {
    console.error("Admin prayer-time overview error:", err);
    return jsonError("조회에 실패했습니다.", 500);
  }
}
