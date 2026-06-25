import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) return null;
  return session;
}

/** 어드민: 시즌 등록 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const body = await req.json().catch(() => null);
  const {
    country_id, year, period,
    start_date, end_date,
    leader_pastor, members,
    prayer_topics,
    hero_image_url, gallery_urls, prayer_card_urls,
    description,
  } = body ?? {};

  if (!country_id || !year || !period) {
    return jsonError("country_id, year, period 는 필수입니다.", 400);
  }
  if (!["summer", "winter"].includes(period)) {
    return jsonError("period 는 summer 또는 winter 이어야 합니다.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_seasons")
    .insert({
      country_id,
      year,
      period,
      start_date:       start_date       || null,
      end_date:         end_date         || null,
      leader_pastor:    leader_pastor    || null,
      members:          Array.isArray(members) ? members.filter(Boolean) : [],
      prayer_topics:    prayer_topics    || null,
      hero_image_url:   hero_image_url   || null,
      gallery_urls:     Array.isArray(gallery_urls)      ? gallery_urls      : [],
      prayer_card_urls: Array.isArray(prayer_card_urls)  ? prayer_card_urls  : [],
      description:      description      || null,
    })
    .select("*")
    .single();

  if (error) return jsonError("시즌 등록 실패", 500);
  return jsonOk({ season: data }, 201);
}
