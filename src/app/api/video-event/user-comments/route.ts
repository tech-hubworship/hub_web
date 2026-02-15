import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    let userId: string =
      (session.user as any).id || session.user.email || "anonymous";
    if (userId.length > 100) userId = userId.substring(0, 100);

    const url = new URL(req.url);
    const post_dt = url.searchParams.get("post_dt");
    const checkOnly = url.searchParams.get("checkOnly");
    const pageStr = url.searchParams.get("page") ?? "1";
    const limitStr = url.searchParams.get("limit") ?? "10";

    if (checkOnly === "true" && post_dt) {
      const { data: existingComments, error: checkError } = await supabaseAdmin
        .from(VIDEO_EVENT.TABLE_COMMENTS)
        .select("comment_id")
        .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
        .eq("reg_id", userId)
        .eq("post_dt", post_dt)
        .limit(1);
      if (checkError) {
        console.error("묵상 확인 오류:", checkError);
        return Response.json({ error: "묵상 확인에 실패했습니다." }, { status: 500 });
      }
      return Response.json(
        { hasMeditation: !!(existingComments && existingComments.length > 0) },
        { status: 200 }
      );
    }

    const pageNum = parseInt(pageStr, 10);
    const limitNum = parseInt(limitStr, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { count, error: countError } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .select("*", { count: "exact", head: true })
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .eq("reg_id", userId);
    if (countError) console.error("사용자 묵상 개수 조회 오류:", countError);

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .select("*")
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .eq("reg_id", userId)
      .order("post_dt", { ascending: false })
      .order("reg_dt", { ascending: false })
      .range(from, to);

    if (commentsError) {
      console.error("사용자 묵상 조회 오류:", commentsError);
      return Response.json({ error: "묵상을 불러오는데 실패했습니다." }, { status: 500 });
    }
    if (!comments || comments.length === 0) {
      return Response.json({ comments: [] }, { status: 200 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        "name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)"
      )
      .eq("user_id", userId)
      .single();

    const maskName = (name: string): string => {
      if (!name || name.length < 2) return name || "익명";
      if (name.length === 2) return name[0] + "0";
      return name[0] + "0" + name[name.length - 1];
    };
    const excludeGroupIds = [7, 99];
    const excludeCellIds = [26, 99];
    let maskedName = "익명";
    let affiliation = "";
    if (profile) {
      const p = profile as any;
      const community = p.community || "";
      const groupName = excludeGroupIds.includes(p.group_id)
        ? ""
        : (p.hub_groups?.name || "");
      const cellName = excludeCellIds.includes(p.cell_id)
        ? ""
        : (p.hub_cells?.name || "");
      maskedName = maskName(p.name);
      affiliation = [community, groupName, cellName].filter(Boolean).join("/");
    }

    const commentsWithNames = (comments as any[]).map((comment) => ({
      ...comment,
      user_name: maskedName,
      user_affiliation: affiliation,
    }));

    return Response.json({
      comments: commentsWithNames,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      hasMore: (count || 0) > to + 1,
    });
  } catch (error) {
    console.error("사용자 묵상 조회 오류:", error);
    return Response.json({ error: "묵상을 불러오는데 실패했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ error: "허용되지 않는 메서드입니다." }, { status: 405 });
}
