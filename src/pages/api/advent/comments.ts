import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { date } = req.query;

      if (!date || typeof date !== 'string' || date.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      const { data, error } = await supabaseAdmin
        .from('advent_comments')
        .select('*')
        .eq('post_dt', date)
        .order('reg_dt', { ascending: false });

      if (error) {
        console.error('댓글 조회 오류:', error);
        return res.status(500).json({ error: '댓글을 불러오는데 실패했습니다.' });
      }

      return res.status(200).json({ comments: data || [] });
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      return res.status(500).json({ error: '댓글을 불러오는데 실패했습니다.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      const { post_dt, content } = req.body;

      if (!post_dt || !content) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
      }

      if (typeof post_dt !== 'string' || post_dt.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      if (content.length > 1000) {
        return res.status(400).json({ error: '댓글은 1000자 이하여야 합니다.' });
      }

      // 사용자 ID 처리 (이메일의 경우 길이 제한)
      let userId = session.user.id || session.user.email || 'anonymous';
      if (userId.length > 100) {
        userId = userId.substring(0, 100);
      }
      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('advent_comments')
        .insert({
          post_dt,
          content: content.trim(),
          reg_id: userId,
          reg_dt: now,
          mod_id: userId,
          mod_dt: now,
        })
        .select()
        .single();

      if (error) {
        console.error('댓글 작성 오류:', error);
        return res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
      }

      return res.status(201).json({ comment: data });
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      return res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

