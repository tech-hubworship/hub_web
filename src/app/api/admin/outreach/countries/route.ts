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

/** 어드민: 전체 국가 목록 (비활성 포함) */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const { data, error } = await supabaseAdmin
    .from("outreach_countries")
    .select("id, name_ko, name_en, iso_code, lat, lng, is_active, created_at")
    .order("name_ko");

  if (error) return jsonError("국가 목록 조회 실패", 500);
  return jsonOk({ countries: data ?? [] });
}

/** 어드민: 국가 등록 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const body = await req.json().catch(() => null);
  const { name_ko, name_en, iso_code, lat, lng } = body ?? {};

  if (!name_ko || !name_en || !iso_code || lat == null || lng == null) {
    return jsonError("name_ko, name_en, iso_code, lat, lng 는 필수입니다.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_countries")
    .insert({ name_ko, name_en, iso_code: iso_code.toUpperCase(), lat, lng })
    .select("id, name_ko, name_en, iso_code, lat, lng, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") return jsonError("이미 등록된 iso_code입니다.", 409);
    return jsonError("국가 등록 실패", 500);
  }

  return jsonOk({ country: data }, 201);
}
