import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string' || date.length !== 8) {
      return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
    }

    const { data, error } = await supabaseAdmin
      .from('advent_posts')
      .select('*')
      .eq('post_dt', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 레코드가 없음
        // 캐시 우회 요청인 경우 캐시하지 않음
        if (req.headers['x-cache-bypass']) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        } else {
          // 빈 결과도 짧게 캐시 (1분)
          res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        }
        return res.status(200).json({ post: null });
      }
      console.error('게시물 조회 오류:', error);
      return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
    }

    // 캐시 우회 요청인 경우 캐시하지 않음 (캐시 무효화를 위한 내부 호출)
    if (req.headers['x-cache-bypass']) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // 게시물 데이터 캐싱 (1시간 캐시, stale-while-revalidate로 최대 2시간까지 사용)
      // Advent 게시물은 하루에 한 번만 업데이트되므로 적절한 캐시 시간 설정
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    }
    
    return res.status(200).json({ post: data });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
  }
}


