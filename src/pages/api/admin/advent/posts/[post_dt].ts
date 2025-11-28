import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { getKoreanTimestamp } from '@src/lib/utils/date';
import { getMenuIdFromPath, checkMenuPermission } from '@src/lib/utils/menu-permission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }

  // 메뉴 권한 확인
  const menuId = getMenuIdFromPath(req.url || '/api/admin/advent/posts/[post_dt]');
  const permission = await checkMenuPermission(session.user.roles || [], menuId);
  
  if (!permission.hasPermission) {
    return res.status(403).json({ error: permission.error || '권한이 없습니다.' });
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

      return res.status(200).json({ message: '게시물이 삭제되었습니다.' });
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      return res.status(500).json({ error: '게시물 삭제에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

