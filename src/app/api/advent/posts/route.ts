import { supabaseAdmin } from "@src/lib/supabase";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

/**
 * GET API: 게시물 조회
 * GET /api/advent/posts?date=YYYYMMDD
 */

const getCachedPost = unstable_cache(
  async (postDate: string) => {
    const { data, error } = await supabaseAdmin
      .from("advent_posts")
      .select("*")
      .eq("post_dt", postDate)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  },
  ["advent-post"],
  {
    tags: ["advent-posts"],
    revalidate: 3600,
  }
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

    // Edge/CDN 캐싱용 헤더 (기존 pages 동작 유지)
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

