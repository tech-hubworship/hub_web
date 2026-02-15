import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { unstable_cache, revalidateTag } from "next/cache";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

const getCachedComments = unstable_cache(
  async (postDate: string, pageNum: number, limitNum: number) => {
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    const { count, error: countError } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .select("*", { count: "exact", head: true })
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .eq("post_dt", postDate);
    if (countError) console.error("댓글 개수 조회 오류:", countError);

    const { data, error } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .select("*")
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .eq("post_dt", postDate)
      .order("reg_dt", { ascending: false })
      .range(from, to);
    if (error) throw error;

    const userIds = Array.from(new Set((data || []).map((c: any) => c.reg_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)"
      )
      .in("user_id", userIds);

    const maskName = (name: string): string => {
      if (!name || name.length < 2) return name || "익명";
      if (name.length === 2) return name[0] + "0";
      return name[0] + "0" + name[name.length - 1];
    };
    const excludeGroupIds = [7, 99];
    const excludeCellIds = [26, 99];
    const profileMap = new Map();
    profiles?.forEach((profile: any) => {
      const community = profile.community || "";
      const groupName = excludeGroupIds.includes(profile.group_id)
        ? ""
        : (profile.hub_groups?.name || "");
      const cellName = excludeCellIds.includes(profile.cell_id)
        ? ""
        : (profile.hub_cells?.name || "");
      const maskedName = maskName(profile.name);
      const parts = [community, groupName, cellName].filter(Boolean);
      profileMap.set(profile.user_id, {
        name: maskedName,
        affiliation: parts.join("/"),
      });
    });

    const commentsWithNames = (data || []).map((comment: any) => {
      const userInfo = profileMap.get(comment.reg_id);
      return {
        ...comment,
        user_name: userInfo?.name || "익명",
        user_affiliation: userInfo?.affiliation || "",
      };
    });

    return {
      comments: commentsWithNames,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      hasMore: (count || 0) > to + 1,
    };
  },
  ["video-event-comments", VIDEO_EVENT.EVENT_SLUG],
  { tags: [VIDEO_EVENT.CACHE_TAG_COMMENTS], revalidate: 3600 }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    if (!date || date.length !== 8) {
      return Response.json(
        { error: "올바른 날짜 형식이 아닙니다. (YYYYMMDD)" },
        { status: 400 }
      );
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await getCachedComments(date, pageNum, limitNum);
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=0, s-maxage=0, must-revalidate");
    return Response.json(result, { headers });
  } catch (error) {
    console.error("댓글 조회 오류:", error);
    return Response.json(
      { error: "댓글을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    const body = await request.json();
    const { post_dt, content } = body;
    if (!post_dt || !content) {
      return Response.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }
    if (typeof post_dt !== "string" || post_dt.length !== 8) {
      return Response.json(
        { error: "올바른 날짜 형식이 아닙니다. (YYYYMMDD)" },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return Response.json({ error: "댓글은 1000자 이하여야 합니다." }, { status: 400 });
    }
    let userId = session.user.id || session.user.email || "anonymous";
    if (userId.length > 100) userId = userId.substring(0, 100);
    const now = getKoreanTimestamp();

    const { data, error } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_COMMENTS)
      .insert({
        event_slug: VIDEO_EVENT.EVENT_SLUG,
        post_dt,
        content: content.trim(),
        reg_id: userId,
        reg_dt: now,
        mod_id: userId,
        mod_dt: now,
      })
      .select()
      .single();

    if (error) {
      console.error("댓글 작성 오류:", error);
      return Response.json({ error: "댓글 작성에 실패했습니다." }, { status: 500 });
    }
    try {
      revalidateTag(VIDEO_EVENT.CACHE_TAG_COMMENTS);
    } catch (cacheError) {
      console.warn("[캐시 무효화] revalidateTag 실패 (무시됨):", cacheError);
    }
    const headers = new Headers();
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return Response.json({ comment: data }, { status: 201, headers });
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    return Response.json({ error: "댓글 작성에 실패했습니다." }, { status: 500 });
  }
}
