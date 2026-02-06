import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) return null;
  return session;
}

/** 관리자: 맛집 단건 조회 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return jsonError("잘못된 id입니다.", 400);

  const { data, error } = await supabaseAdmin
    .from("restaurant_places")
    .select("*")
    .eq("id", numId)
    .single();

  if (error || !data)
    return jsonError("맛집 정보를 찾을 수 없습니다.", 404);
  return jsonOk({ data }, 200);
}

/** 관리자: 맛집 수정 (승인/거부, 인기 지정 포함) */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return jsonError("잘못된 id입니다.", 400);

  try {
    const body = await req.json().catch(() => ({}));
    const {
      name,
      category,
      address,
      latitude,
      longitude,
      description,
      image_url,
      phone,
      opening_hours,
      is_approved,
      is_featured,
    } = body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = typeof name === "string" ? name.trim() : null;
    if (category !== undefined) updates.category = typeof category === "string" ? category.trim() : null;
    if (address !== undefined) updates.address = typeof address === "string" ? address.trim() : null;
    if (latitude !== undefined) updates.latitude = typeof latitude === "number" ? latitude : null;
    if (longitude !== undefined) updates.longitude = typeof longitude === "number" ? longitude : null;
    if (description !== undefined) updates.description = typeof description === "string" ? description.trim() : null;
    if (image_url !== undefined) updates.image_url = typeof image_url === "string" ? image_url.trim() : null;
    if (phone !== undefined) updates.phone = typeof phone === "string" ? phone.trim() : null;
    if (opening_hours !== undefined) updates.opening_hours = typeof opening_hours === "string" ? opening_hours.trim() : null;
    if (is_approved !== undefined) updates.is_approved = is_approved === true;
    if (is_featured !== undefined) updates.is_featured = is_featured === true;

    if (Object.keys(updates).length === 0)
      return jsonError("수정할 필드가 없습니다.", 400);

    const { data, error } = await supabaseAdmin
      .from("restaurant_places")
      .update(updates)
      .eq("id", numId)
      .select()
      .single();

    if (error) {
      console.error("admin restaurant 수정 오류:", error);
      return jsonError("수정에 실패했습니다.", 500);
    }

    return jsonOk({ data }, 200);
  } catch (e) {
    console.error("admin restaurant PUT Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

/** 관리자: 맛집 삭제 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return jsonError("잘못된 id입니다.", 400);

  try {
    const { error } = await supabaseAdmin
      .from("restaurant_places")
      .delete()
      .eq("id", numId);

    if (error) {
      console.error("admin restaurant 삭제 오류:", error);
      return jsonError("삭제에 실패했습니다.", 500);
    }

    return jsonOk({ success: true }, 200);
  } catch (e) {
    console.error("admin restaurant DELETE Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function POST() {
  return methodNotAllowed(["GET", "PUT", "DELETE"]);
}
