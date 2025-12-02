import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { getKoreanTimestamp } from '@src/lib/utils/date';
import { revalidateTag } from 'next/cache';

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

      // 캐시 무효화: 확실한 무효화를 위해 await 사용
      try {
        // 1. Next.js Data Cache 무효화 시도
        try {
          revalidateTag('advent-posts');
          revalidateTag('advent-posts-list');
          console.log(`[캐시 무효화] revalidateTag 호출 완료, post_dt: ${post_dt}`);
        } catch (revalidateError) {
          console.warn('[캐시 무효화] revalidateTag 실패 (무시됨):', revalidateError);
        }

        // 2. HTTP 캐시 무효화
        let baseUrl = process.env.NEXTAUTH_URL || 
                      process.env.NEXT_PUBLIC_BASE_URL;
        
        if (!baseUrl) {
          if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
          } else {
            const protocol = req.headers['x-forwarded-proto']?.toString() || 
              (req.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http') ||
              ((req.connection as any)?.encrypted ? 'https' : 'http');
            const host = req.headers.host || 
              req.headers['x-forwarded-host'] || 
              'localhost:3000';
            baseUrl = `${protocol}://${host}`;
          }
        }
        
        console.log(`[캐시 무효화] baseUrl: ${baseUrl}, post_dt: ${post_dt}`);
        
        await Promise.all([
          fetch(`${baseUrl}/api/advent/posts?date=${post_dt}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'x-cache-bypass': 'true',
              'User-Agent': 'HubWorship-Cache-Invalidator',
            },
            cache: 'no-store',
          }),
          fetch(`${baseUrl}/api/advent/posts?date=${post_dt}&_t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'x-cache-bypass': 'true',
              'User-Agent': 'HubWorship-Cache-Invalidator',
            },
            cache: 'no-store',
          }),
          fetch(`${baseUrl}/api/advent/posts-list?limit=12`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'x-cache-bypass': 'true',
              'User-Agent': 'HubWorship-Cache-Invalidator',
            },
            cache: 'no-store',
          }),
          fetch(`${baseUrl}/api/advent/posts-list?limit=12&_t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'x-cache-bypass': 'true',
              'User-Agent': 'HubWorship-Cache-Invalidator',
            },
            cache: 'no-store',
          }),
        ]);
        
        console.log(`[캐시 무효화 성공] 모든 캐시 레이어 무효화 완료, post_dt: ${post_dt}`);
      } catch (cacheError) {
        console.error('[캐시 무효화 실패]', {
          error: cacheError,
          message: cacheError instanceof Error ? cacheError.message : String(cacheError),
          post_dt,
        });
      }

      return res.status(201).json({ post: data });
    } catch (error) {
      console.error('게시물 추가 오류:', error);
      return res.status(500).json({ error: '게시물 추가에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}




