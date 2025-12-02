import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { getKoreanTimestamp } from '@src/lib/utils/date';
import { revalidateTag } from 'next/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  const { post_dt } = req.query;

  if (!post_dt || typeof post_dt !== 'string' || post_dt.length !== 8) {
    return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
  }

  if (req.method === 'PUT') {
    try {
      const { title, content, video_url, thumbnail_url } = req.body;

      if (!title) {
        return res.status(400).json({ error: '제목은 필수입니다.' });
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

      const { data, error } = await supabaseAdmin
        .from('advent_posts')
        .update({
          title: title.trim(),
          content: content?.trim() || null,
          video_url: video_url?.trim() || null,
          thumbnail_url: thumbnail_url?.trim() || null,
          mod_id: userId,
          mod_dt: getKoreanTimestamp(),
        })
        .eq('post_dt', post_dt)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
        }
        console.error('게시물 수정 오류:', error);
        return res.status(500).json({ error: '게시물 수정에 실패했습니다.' });
      }

      // 캐시 무효화: 하이브리드 방식 (revalidateTag + HTTP 캐시 무효화)
      // 1. revalidateTag로 Next.js Data Cache 무효화
      // 2. HTTP fetch로 CDN/Edge 캐시도 무효화
      const invalidateCache = async () => {
        try {
          // 1. Next.js Data Cache 무효화 (unstable_cache)
          revalidateTag('advent-posts');
          revalidateTag('advent-posts-list');
          console.log(`[캐시 무효화] revalidateTag 완료, post_dt: ${post_dt}`);

          // 2. HTTP 캐시 무효화 (CDN/Edge 캐시)
          // 운영 환경과 개발 환경 모두 지원
          // 우선순위: NEXTAUTH_URL > NEXT_PUBLIC_BASE_URL > VERCEL_URL > 헤더에서 자동 감지
          let baseUrl = process.env.NEXTAUTH_URL || 
                        process.env.NEXT_PUBLIC_BASE_URL;
          
          if (!baseUrl) {
            // Vercel 환경
            if (process.env.VERCEL_URL) {
              baseUrl = `https://${process.env.VERCEL_URL}`;
            } 
            // 일반 운영 환경 (헤더에서 감지)
            else {
              const protocol = req.headers['x-forwarded-proto']?.toString() || 
                (req.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'http') ||
                ((req.connection as any)?.encrypted ? 'https' : 'http');
              const host = req.headers.host || 
                req.headers['x-forwarded-host'] || 
                'localhost:3000';
              baseUrl = `${protocol}://${host}`;
            }
          }
          
          // HTTP 캐시 무효화를 위한 fetch 호출 (CDN/Edge 캐시)
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
          ]);
          
          console.log(`[캐시 무효화 성공] 모든 캐시 레이어 무효화 완료, post_dt: ${post_dt}`);
        } catch (cacheError) {
          // 캐시 갱신 실패는 로그만 남기고 응답은 성공으로 처리
          console.error('[캐시 무효화 실패]', {
            error: cacheError,
            message: cacheError instanceof Error ? cacheError.message : String(cacheError),
            post_dt,
          });
        }
      };

      // 비동기로 캐시 무효화 실행 (응답을 기다리지 않음)
      invalidateCache();

      return res.status(200).json({ post: data });
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      return res.status(500).json({ error: '게시물 수정에 실패했습니다.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('advent_posts')
        .delete()
        .eq('post_dt', post_dt);

      if (error) {
        console.error('게시물 삭제 오류:', error);
        return res.status(500).json({ error: '게시물 삭제에 실패했습니다.' });
      }

      // 캐시 무효화: 하이브리드 방식 (revalidateTag + HTTP 캐시 무효화)
      const invalidateCache = async () => {
        try {
          // 1. Next.js Data Cache 무효화 (unstable_cache)
          revalidateTag('advent-posts');
          revalidateTag('advent-posts-list');
          console.log(`[캐시 무효화] revalidateTag 완료, post_dt: ${post_dt}`);

          // 2. HTTP 캐시 무효화 (CDN/Edge 캐시)
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
          ]);
          
          console.log(`[캐시 무효화 성공] 모든 캐시 레이어 무효화 완료, post_dt: ${post_dt}`);
        } catch (cacheError) {
          console.error('[캐시 무효화 실패]', {
            error: cacheError,
            message: cacheError instanceof Error ? cacheError.message : String(cacheError),
            post_dt,
          });
        }
      };

      invalidateCache();

      return res.status(200).json({ message: '게시물이 삭제되었습니다.' });
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      return res.status(500).json({ error: '게시물 삭제에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}
