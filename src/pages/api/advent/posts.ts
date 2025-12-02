import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { unstable_cache } from 'next/cache';

// Node.js runtime 명시 (unstable_cache는 Node.js에서만 작동)
export const config = {
  runtime: 'nodejs',
};

// 캐시된 게시물 조회 함수 (날짜별로 캐시 키 분리)
const getCachedPost = (date: string) => {
  return unstable_cache(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('advent_posts')
        .select('*')
        .eq('post_dt', date)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { post: null, error: null };
        }
        return { post: null, error };
      }
      
      return { post: data, error: null };
    },
    [`advent-post-${date}`],
    {
      tags: ['advent-posts'],
      revalidate: 3600, // 1시간
    }
  )();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string' || date.length !== 8) {
      return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
    }

    // 캐시 우회 요청인 경우 직접 조회 (캐시 무효화를 위한 내부 호출)
    if (req.headers['x-cache-bypass']) {
      const { data, error } = await supabaseAdmin
        .from('advent_posts')
        .select('*')
        .eq('post_dt', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.status(200).json({ post: null });
        }
        console.error('게시물 조회 오류:', error);
        return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).json({ post: data });
    }

    // 일반 요청: 캐시 사용
    const { post, error } = await getCachedPost(date);

    if (error) {
      console.error('게시물 조회 오류:', error);
      return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
    }

    // 게시물 데이터 캐싱 (1시간 캐시, stale-while-revalidate로 최대 2시간까지 사용)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return res.status(200).json({ post });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
  }
}


