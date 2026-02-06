import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 공개: 승인된 맛집 목록 (카테고리 필터) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("restaurant_places")
      .select("id, name, category, address, latitude, longitude, description, image_url, phone, opening_hours, is_featured, created_at")
      .eq("is_approved", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (category && category.trim())
      query = query.eq("category", category.trim());

    const { data, error } = await query;

    if (error) {
      console.error("public restaurant 조회 오류:", error);
      return NextResponse.json(
        { error: "맛집 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error("public restaurant API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
