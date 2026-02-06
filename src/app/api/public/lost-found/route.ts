import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 분실물 포스트 목록 (최신순, 공개) */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("lost_found_posts")
      .select("id, post_date, image_urls, memo, created_at")
      .order("post_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("public lost-found 조회 오류:", error);
      return NextResponse.json(
        { error: "분실물 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error("public lost-found API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
