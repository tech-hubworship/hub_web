import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 공개: 인기(추천) 맛집 목록 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurant_places")
      .select("id, name, category, address, latitude, longitude, description, image_url, phone, opening_hours, created_at")
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("public restaurant popular 조회 오류:", error);
      return NextResponse.json(
        { error: "인기 맛집 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error("public restaurant popular API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
