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

/** 어드민: 국가 수정 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { name_ko, name_en, iso_code, lat, lng, is_active } = body ?? {};

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name_ko   !== undefined) update.name_ko   = name_ko;
  if (name_en   !== undefined) update.name_en   = name_en;
  if (iso_code  !== undefined) update.iso_code  = iso_code.toUpperCase();
  if (lat       !== undefined) update.lat        = lat;
  if (lng       !== undefined) update.lng        = lng;
  if (is_active !== undefined) update.is_active  = is_active;

  const { data, error } = await supabaseAdmin
    .from("outreach_countries")
    .update(update)
    .eq("id", id)
    .select("id, name_ko, name_en, iso_code, lat, lng, is_active")
    .single();

  if (error) return jsonError("국가 수정 실패", 500);
  return jsonOk({ country: data });
}

/** 어드민: 국가 삭제 (soft delete) */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from("outreach_countries")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return jsonError("국가 삭제 실패", 500);
  return jsonOk({ message: "삭제되었습니다." });
}
