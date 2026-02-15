import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * 클라이언트에서 revalidateTag를 호출하기 위한 API
 * POST body: { tags: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tags } = body;
    if (!tags || !Array.isArray(tags)) {
      return Response.json({ error: "tags 배열이 필요합니다." }, { status: 400 });
    }
    for (const tag of tags) {
      try {
        revalidateTag(tag);
        console.log(`[캐시 무효화] revalidateTag 완료: ${tag}`);
      } catch (error) {
        console.warn(`[캐시 무효화] revalidateTag 실패 (무시됨): ${tag}`, error);
      }
    }
    return Response.json({
      success: true,
      message: "캐시가 무효화되었습니다.",
      revalidated: true,
      now: Date.now(),
    });
  } catch (error) {
    console.error("캐시 무효화 오류:", error);
    return Response.json({ error: "캐시 무효화에 실패했습니다." }, { status: 500 });
  }
}
