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

/** 관리자: 맛집 목록 (필터: category, is_approved, is_featured) */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isApproved = searchParams.get("is_approved");
    const isFeatured = searchParams.get("is_featured");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("restaurant_places")
      .select("*")
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);
    if (isApproved !== null && isApproved !== "")
      query = query.eq("is_approved", isApproved === "true");
    if (isFeatured !== null && isFeatured !== "")
      query = query.eq("is_featured", isFeatured === "true");
    if (search && search.trim())
      query = query.or(`name.ilike.%${search.trim()}%,address.ilike.%${search.trim()}%`);

    const { data, error } = await query;

    if (error) {
      console.error("admin restaurant 목록 조회 오류:", error);
      return jsonError("목록을 가져오는데 실패했습니다.", 500);
    }

    return jsonOk({ data: data ?? [] }, 200);
  } catch (e) {
    console.error("admin restaurant GET Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

/** 관리자: 맛집 등록 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

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

    if (!name || typeof name !== "string" || !name.trim())
      return jsonError("맛집명은 필수입니다.", 400);
    if (!category || typeof category !== "string" || !category.trim())
      return jsonError("카테고리는 필수입니다.", 400);

    const { data, error } = await supabaseAdmin
      .from("restaurant_places")
      .insert({
        name: name.trim(),
        category: category.trim(),
        address: address && typeof address === "string" ? address.trim() : null,
        latitude: typeof latitude === "number" ? latitude : null,
        longitude: typeof longitude === "number" ? longitude : null,
        description:
          description && typeof description === "string"
            ? description.trim()
            : null,
        image_url:
          image_url && typeof image_url === "string" ? image_url.trim() : null,
        phone: phone && typeof phone === "string" ? phone.trim() : null,
        opening_hours:
          opening_hours && typeof opening_hours === "string"
            ? opening_hours.trim()
            : null,
        is_approved: is_approved === true,
        is_featured: is_featured === true,
        created_by: (session.user as { id?: string })?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("admin restaurant 등록 오류:", error);
      return jsonError("등록에 실패했습니다.", 500);
    }

    return jsonOk({ data }, 201);
  } catch (e) {
    console.error("admin restaurant POST Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT() {
  return methodNotAllowed(["GET", "POST"]);
}
export async function DELETE() {
  return methodNotAllowed(["GET", "POST"]);
}
