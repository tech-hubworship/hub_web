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
        return res.status(200).json({ post: null });
      }
      console.error('게시물 조회 오류:', error);
      return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
    }

    return res.status(200).json({ post: data });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    return res.status(500).json({ error: '게시물을 불러오는데 실패했습니다.' });
  }
}

