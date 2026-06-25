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

/** 어드민: 시즌 수정 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const fields = [
    "year", "period", "start_date", "end_date",
    "leader_pastor", "members", "prayer_topics",
    "hero_image_url", "gallery_urls", "prayer_card_urls",
    "description", "is_active",
  ] as const;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of fields) {
    if (body?.[f] !== undefined) update[f] = body[f];
  }

  if (update.period && !["summer", "winter"].includes(update.period as string)) {
    return jsonError("period 는 summer 또는 winter 이어야 합니다.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_seasons")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError("시즌 수정 실패", 500);
  return jsonOk({ season: data });
}

/** 어드민: 시즌 삭제 (soft delete) */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 403);

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from("outreach_seasons")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return jsonError("시즌 삭제 실패", 500);
  return jsonOk({ message: "삭제되었습니다." });
}
