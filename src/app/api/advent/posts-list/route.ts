import { supabaseAdmin } from "@src/lib/supabase";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

/**
 * GET API: 게시물 목록 조회
 * GET /api/advent/posts-list?limit=10
 */

const getCachedPostsList = unstable_cache(
  async (limit: number) => {
    const { data, error } = await supabaseAdmin
      .from("advent_posts")
      .select("post_dt, title, thumbnail_url, video_url")
      .order("post_dt", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
  ["advent-posts-list"],
  {
    tags: ["advent-posts-list"],
    revalidate: 3600,
  }
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitStr = url.searchParams.get("limit") ?? "10";
    const limitNum = parseInt(limitStr, 10);

    const data = await getCachedPostsList(limitNum);

    const headers = {
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=7200, must-revalidate",
    };

    return Response.json({ posts: data }, { status: 200, headers });
  } catch (error) {
    console.error("게시물 목록 조회 오류:", error);
    return Response.json(
      { error: "게시물 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

