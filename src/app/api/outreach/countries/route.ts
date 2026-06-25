import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 공개: 방문 국가 목록 (지도 핀용) */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("outreach_countries")
    .select(
      `
      id, name_ko, name_en, iso_code, lat, lng,
      outreach_seasons!inner(id)
    `
    )
    .eq("is_active", true)
    .eq("outreach_seasons.is_active", true)
    .order("name_ko");

  if (error) return jsonError("국가 목록 조회 실패", 500);

  // 시즌 수 집계
  const countries = (data ?? []).map((c: any) => ({
    id: c.id,
    name_ko: c.name_ko,
    name_en: c.name_en,
    iso_code: c.iso_code,
    lat: c.lat,
    lng: c.lng,
    season_count: c.outreach_seasons?.length ?? 0,
  }));

  return jsonOk({ countries });
}
