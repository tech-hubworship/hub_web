import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { unstable_cache } from 'next/cache';

/**
 * GET API: 게시물 조회
 * 
 * ✅ Next.js 캐시 전략 (unstable_cache)
 * - 태그 기반 캐싱: 'advent-posts' 태그로 캐시 관리
 * - revalidate: 3600초 (1시간) - 캐시 유효 기간
 * - 클라이언트에서 /api/advent/revalidate 호출 시 revalidateTag('advent-posts')로 무효화 가능
 */

// 캐시된 데이터 조회 함수 (handler 외부에서 정의하여 캐시가 제대로 작동하도록)
// unstable_cache는 함수 인자를 자동으로 캐시 키에 포함시킵니다
const getCachedPost = unstable_cache(
  async (postDate: string) => {
    const { data, error } = await supabaseAdmin
      .from('advent_posts')
      .select('*')
      .eq('post_dt', postDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },
  ['advent-post'], // 캐시 키 prefix (실제 키는 'advent-post-{postDate}' 형태)
  {
    tags: ['advent-posts'], // revalidateTag로 무효화할 태그
    revalidate: 3600, // 1시간 캐시 유효 기간
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string' || date.length !== 8) {
      return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
    }

    // 캐시된 데이터 조회 (Next.js가 자동으로 캐시 관리)
    const data = await getCachedPost(date);

    if (data === null) {
      // 데이터가 없을 때는 null 반환
      return res.status(200).json({ post: null });
    }

    return res.status(200).json({ post: data });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
  }
}
