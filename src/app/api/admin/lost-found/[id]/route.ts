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

/** 관리자: 분실물 포스트 수정 */
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
    const { post_date, image_urls, memo } = body as {
      post_date?: string;
      image_urls?: string[];
      memo?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (typeof post_date === "string") updates.post_date = post_date;
    if (Array.isArray(image_urls)) {
      if (image_urls.length === 0) return jsonError("image_urls는 1개 이상 필요합니다.", 400);
      if (image_urls.length > 2) return jsonError("image_urls는 최대 2개까지입니다.", 400);
      updates.image_urls = image_urls;
    }
    if (memo !== undefined) updates.memo = memo ?? null;

    if (Object.keys(updates).length === 0) {
      return jsonError("수정할 필드가 없습니다.", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("lost_found_posts")
      .update(updates)
      .eq("id", numId)
      .select()
      .single();

    if (error) {
      console.error("admin lost-found 수정 오류:", error);
      return jsonError("수정에 실패했습니다.", 500);
    }

    return jsonOk({ data }, 200);
  } catch (e) {
    console.error("admin lost-found PUT Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

/** 관리자: 분실물 포스트 삭제 */
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
      .from("lost_found_posts")
      .delete()
      .eq("id", numId);

    if (error) {
      console.error("admin lost-found 삭제 오류:", error);
      return jsonError("삭제에 실패했습니다.", 500);
    }

    return jsonOk({ success: true }, 200);
  } catch (e) {
    console.error("admin lost-found DELETE Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["PUT", "DELETE"]);
}
export async function POST() {
  return methodNotAllowed(["PUT", "DELETE"]);
}
