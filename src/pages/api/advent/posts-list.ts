import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { limit = '10' } = req.query;

    const { data, error } = await supabaseAdmin
      .from('advent_posts')
      .select('post_dt, title, thumbnail_url, video_url')
      .order('post_dt', { ascending: false })
      .limit(parseInt(limit as string, 10));

    if (error) {
      console.error('게시물 목록 조회 오류:', error);
      return res.status(500).json({ error: '게시물 목록을 불러오는데 실패했습니다.' });
    }

    // 캐시 우회 요청인 경우 캐시하지 않음 (캐시 무효화를 위한 내부 호출)
    if (req.headers['x-cache-bypass']) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // 게시물 목록 캐싱 (1시간 캐시, stale-while-revalidate로 최대 2시간까지 사용)
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    }

    return res.status(200).json({ posts: data || [] });
  } catch (error) {
    console.error('게시물 목록 조회 오류:', error);
    return res.status(500).json({ error: '게시물 목록을 불러오는데 실패했습니다.' });
  }
}


