import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

/** GET: 관리자용 묵상(댓글) 목록. date(YYYYMMDD), page, limit, search(이름/내용) */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date")?.replace(/-/g, "") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(10, parseInt(url.searchParams.get("limit") || "20", 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const countQuery = supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .select("*", { count: "exact", head: true })
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG);
    const { count: countVal } =
      date.length === 8
        ? await countQuery.eq("post_dt", date)
        : await countQuery;
    const count = countVal ?? 0;

    const listQuery = supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .select("*")
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .order("reg_dt", { ascending: false })
      .range(from, to);
    const { data: rows, error } =
      date.length === 8 ? await listQuery.eq("post_dt", date) : await listQuery;

    if (error) {
      console.error("admin video-event comments list error:", error);
      return Response.json({ error: "목록 조회에 실패했습니다." }, { status: 500 });
    }

    const userIds = Array.from(new Set((rows || []).map((c: any) => c.reg_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)")
      .in("user_id", userIds);

    const profileMap = new Map();
    profiles?.forEach((p: any) => {
      const groupName = p.hub_groups?.name || "";
      const cellName = p.hub_cells?.name || "";
      profileMap.set(p.user_id, {
        name: p.name || "익명",
        affiliation: [p.community, groupName, cellName].filter(Boolean).join(" / "),
      });
    });

    const list = (rows || []).map((c: any) => ({
      comment_id: c.comment_id,
      post_dt: c.post_dt,
      reg_id: c.reg_id,
      content: c.content,
      reg_dt: c.reg_dt,
      user_name: profileMap.get(c.reg_id)?.name || "익명",
      user_affiliation: profileMap.get(c.reg_id)?.affiliation || "",
    }));

    return Response.json({
      list,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "목록 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
