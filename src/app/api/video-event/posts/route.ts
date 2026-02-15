import { supabaseAdmin } from "@src/lib/supabase";
import { unstable_cache } from "next/cache";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

export const runtime = "nodejs";

/**
 * GET /api/video-event/posts?date=YYYYMMDD
 */
const getCachedPost = unstable_cache(
  async (postDate: string) => {
    const { data, error } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_POSTS)
      .select("*")
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .eq("post_dt", postDate)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },
  ["video-event-post", VIDEO_EVENT.EVENT_SLUG],
  { tags: [VIDEO_EVENT.CACHE_TAG_POSTS], revalidate: 3600 }
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    if (!date || date.length !== 8) {
      return Response.json(
        { error: "올바른 날짜 형식이 아닙니다. (YYYYMMDD)" },
        { status: 400 }
      );
    }
    const data = await getCachedPost(date);
    const headers = {
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=7200, must-revalidate",
    };
    if (data === null) {
      return Response.json({ post: null }, { status: 200, headers });
    }
    return Response.json({ post: data }, { status: 200, headers });
  } catch (error) {
    console.error("게시물 조회 오류:", error);
    return Response.json(
      { error: "게시물을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
