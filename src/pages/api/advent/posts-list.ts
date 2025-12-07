import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { unstable_cache } from 'next/cache';

/**
 * GET API: 게시물 목록 조회
 * 
 * ✅ Next.js 캐시 전략 (unstable_cache)
 * - 태그 기반 캐싱: 'advent-posts-list' 태그로 캐시 관리
 * - revalidate: 3600초 (1시간) - 캐시 유효 기간
 * - 클라이언트에서 /api/advent/revalidate 호출 시 revalidateTag('advent-posts-list')로 무효화 가능
 */

// 캐시된 데이터 조회 함수 (handler 외부에서 정의하여 캐시가 제대로 작동하도록)
// unstable_cache는 함수 인자를 자동으로 캐시 키에 포함시킵니다
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
  ['advent-posts-list'], // 캐시 키 prefix (실제 키는 'advent-posts-list-{limit}' 형태)
  {
    tags: ['advent-posts-list'], // revalidateTag로 무효화할 태그
    revalidate: 3600, // 1시간 캐시 유효 기간
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // 캐시된 데이터 조회 (Next.js가 자동으로 캐시 관리)
    const data = await getCachedPostsList(limitNum);

    // Edge/CDN 캐싱을 위한 Cache-Control 헤더 설정
    // max-age=0: 브라우저는 항상 재검증 (revalidateTag 무효화 시 즉시 반영)
    // s-maxage=3600: Edge/CDN에서 1시간 캐싱 (Edge request 대폭 감소)
    // stale-while-revalidate=7200: 만료 후 2시간 동안 stale 데이터 제공하며 백그라운드 재검증
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=7200, must-revalidate'
    );

    return res.status(200).json({ posts: data });
  } catch (error) {
    console.error('게시물 목록 조회 오류:', error);
    return res.status(500).json({ error: '게시물 목록을 불러오는데 실패했습니다.' });
  }
}
