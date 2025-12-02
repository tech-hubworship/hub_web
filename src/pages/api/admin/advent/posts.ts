import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { getKoreanTimestamp } from '@src/lib/utils/date';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('advent_posts')
        .select('*')
        .order('post_dt', { ascending: false });

      if (error) {
        console.error('게시물 목록 조회 오류:', error);
        return res.status(500).json({ error: '게시물 목록을 불러오는데 실패했습니다.' });
      }

      return res.status(200).json({ posts: data || [] });
    } catch (error) {
      console.error('게시물 목록 조회 오류:', error);
      return res.status(500).json({ error: '게시물 목록을 불러오는데 실패했습니다.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { post_dt, title, content, video_url, thumbnail_url } = req.body;

      if (!post_dt || !title) {
        return res.status(400).json({ error: '날짜와 제목은 필수입니다.' });
      }

      if (typeof post_dt !== 'string' || post_dt.length !== 8) {
        return res.status(400).json({ error: '날짜는 YYYYMMDD 형식이어야 합니다.' });
      }

      if (title.length > 200) {
        return res.status(400).json({ error: '제목은 200자 이하여야 합니다.' });
      }

      if (video_url && video_url.length > 500) {
        return res.status(400).json({ error: '유튜브 URL은 500자 이하여야 합니다.' });
      }

      if (thumbnail_url && thumbnail_url.length > 500) {
        return res.status(400).json({ error: '썸네일 URL은 500자 이하여야 합니다.' });
      }

      // 사용자 ID 처리 (이메일의 경우 길이 제한)
      let userId = session.user.id || session.user.email || 'admin';
      if (userId.length > 100) {
        userId = userId.substring(0, 100);
      }
      const now = getKoreanTimestamp();

      const { data, error } = await supabaseAdmin
        .from('advent_posts')
        .insert({
          post_dt,
          title: title.trim(),
          content: content?.trim() || null,
          video_url: video_url?.trim() || null,
          thumbnail_url: thumbnail_url?.trim() || null,
          reg_id: userId,
          reg_dt: now,
          mod_id: userId,
          mod_dt: now,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: '이미 해당 날짜의 게시물이 존재합니다.' });
        }
        console.error('게시물 추가 오류:', error);
        return res.status(500).json({ error: '게시물 추가에 실패했습니다.' });
      }

      // 캐시 무효화: 새로 추가된 게시물의 캐시를 갱신하기 위해 내부적으로 API 호출
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
          (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');
        await fetch(`${baseUrl}/api/advent/posts?date=${post_dt}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'x-cache-bypass': 'true',
          },
        });
      } catch (cacheError) {
        console.warn('캐시 갱신 실패 (무시됨):', cacheError);
      }

      // posts-list 캐시도 무효화
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
          (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');
        await fetch(`${baseUrl}/api/advent/posts-list?limit=12`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'x-cache-bypass': 'true',
          },
        });
      } catch (cacheError) {
        console.warn('posts-list 캐시 갱신 실패 (무시됨):', cacheError);
      }

      return res.status(201).json({ post: data });
    } catch (error) {
      console.error('게시물 추가 오류:', error);
      return res.status(500).json({ error: '게시물 추가에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}


