import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk } from "@src/lib/api/response";

export const runtime = "nodejs";

// 국가·시즌은 거의 변하지 않음 → CDN 5분 캐시 + 10분 stale-while-revalidate.
// (404/500 등 에러 응답에는 헤더를 붙이지 않아 캐시되지 않음)
const CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=600";

/** 공개: 국가 상세 + 시즌 목록 (최신순) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: country, error: cErr } = await supabaseAdmin
    .from("outreach_countries")
    .select("id, name_ko, name_en, iso_code, lat, lng")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (cErr || !country) return jsonError("국가를 찾을 수 없습니다.", 404);

  const { data: seasons, error: sErr } = await supabaseAdmin
    .from("outreach_seasons")
    .select(
      `
      id, year, period, start_date, end_date,
      region_en, region_ko, key_phrase, mission_field, theme_verse, ministry_content,
      leader_pastor, members, prayer_topics, team_prayer_topics,
      hero_image_url, gallery_urls, prayer_card_urls, description
    `
    )
    .eq("country_id", id)
    .eq("is_active", true)
    .order("year", { ascending: false })
    .order("period", { ascending: true }); // summer < winter (알파벳 오름차순 → 여름이 위)

  if (sErr) return jsonError("시즌 조회 실패", 500);

  return jsonOk({ country, seasons: seasons ?? [] }, 200, { "Cache-Control": CACHE });
}
