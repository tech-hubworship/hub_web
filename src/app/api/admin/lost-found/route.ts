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

/** 관리자: 분실물 포스트 목록 */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  try {
    const { data, error } = await supabaseAdmin
      .from("lost_found_posts")
      .select("*")
      .order("post_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("admin lost-found 목록 조회 오류:", error);
      return jsonError("목록을 가져오는데 실패했습니다.", 500);
    }

    return jsonOk({ data: data ?? [] }, 200);
  } catch (e) {
    console.error("admin lost-found GET Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

/** 관리자: 분실물 포스트 등록 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자만 접근할 수 있습니다.", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { post_date, image_urls, memo } = body as {
      post_date?: string;
      image_urls?: string[];
      memo?: string | null;
    };

    if (!post_date || typeof post_date !== "string") {
      return jsonError("post_date(YYYY-MM-DD)는 필수입니다.", 400);
    }
    const urls = Array.isArray(image_urls) ? image_urls : [];
    if (urls.length === 0) {
      return jsonError("image_urls는 1개 이상 필요합니다.", 400);
    }
    if (urls.length > 2) {
      return jsonError("image_urls는 최대 2개까지입니다.", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("lost_found_posts")
      .insert({
        post_date,
        image_urls: urls,
        memo: memo ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("admin lost-found 등록 오류:", error);
      return jsonError("등록에 실패했습니다.", 500);
    }

    return jsonOk({ data }, 201);
  } catch (e) {
    console.error("admin lost-found POST Error:", e);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT() {
  return methodNotAllowed(["GET", "POST"]);
}
export async function DELETE() {
  return methodNotAllowed(["GET", "POST"]);
}
