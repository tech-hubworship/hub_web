import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk } from "@src/lib/api/response";

export const runtime = "nodejs";

// 국가·시즌은 거의 변하지 않음(시즌 등록/사진 업로드 시에만 갱신).
// CDN에서 5분 캐시 + 10분 stale-while-revalidate → Supabase 직격 호출을 대폭 줄임.
const CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=600";

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

  return jsonOk({ countries }, 200, { "Cache-Control": CACHE });
}
