import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * ✅ 클라이언트 → 서버 API → revalidateTag() 호출 구조
 * 
 * 클라이언트 컴포넌트에서는 revalidateTag()를 직접 호출할 수 없으므로
 * 서버 Route Handler를 통해 간접적으로 호출합니다.
 * 
 * 사용 방법:
 * - 클라이언트: fetch('/api/advent/revalidate', { method: 'POST', body: JSON.stringify({ tags: ['advent-posts'] }) })
 * - 서버: revalidateTag('advent-posts') 실행
 * 
 * 참고: https://nextjs-ko.org/docs/app/api-reference/functions/revalidateTag
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags)) {
      return Response.json(
        { error: 'tags 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 각 태그에 대해 revalidateTag 호출
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
      message: '캐시가 무효화되었습니다.',
      revalidated: true,
      now: Date.now()
    });
  } catch (error) {
    console.error('캐시 무효화 오류:', error);
    return Response.json(
      { error: '캐시 무효화에 실패했습니다.' },
      { status: 500 }
    );
  }
}

