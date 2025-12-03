import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { unstable_cache } from 'next/cache';

/**
 * GET API: 게시물 목록 조회
 * 
 * ✅ 태그 기반 캐싱 구조
 * - unstable_cache로 태그 'advent-posts-list' 지정
 * - 클라이언트에서 /api/advent/revalidate 호출 시 revalidateTag('advent-posts-list')로 무효화 가능
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // unstable_cache로 태그 기반 캐싱 (revalidateTag로 무효화 가능)
    const getCachedPostsList = unstable_cache(
      async (limit: number) => {
        const { data, error } = await supabaseAdmin
          .from('advent_posts')
          .select('post_dt, title, thumbnail_url, video_url')
          .order('post_dt', { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        return data || [];
      },
      [`advent-posts-list-${limitNum}`], // 캐시 키
      {
        tags: ['advent-posts-list'], // revalidateTag로 무효화할 태그
        revalidate: 3600, // 1시간
      }
    );

    const data = await getCachedPostsList(limitNum);

    return res.status(200).json({ posts: data });
  } catch (error) {
    console.error('게시물 목록 조회 오류:', error);
    return res.status(500).json({ error: '게시물 목록을 불러오는데 실패했습니다.' });
  }
}
