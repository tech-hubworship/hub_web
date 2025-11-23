import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      // 사용자 ID 처리
      let userId = session.user.id || session.user.email || 'anonymous';
      if (userId.length > 100) {
        userId = userId.substring(0, 100);
      }

      // 사용자의 묵상들을 가져오면서 profiles 테이블과 조인하여 name 가져오기
      // Supabase에서 직접 조인은 외래키가 필요하므로, 
      // reg_id를 기준으로 profiles에서 name을 가져옴
      const { data: comments, error: commentsError } = await supabaseAdmin
        .from('advent_comments')
        .select('*')
        .eq('reg_id', userId)
        .order('reg_dt', { ascending: false });

      if (commentsError) {
        console.error('사용자 묵상 조회 오류:', commentsError);
        return res.status(500).json({ error: '묵상을 불러오는데 실패했습니다.' });
      }

      if (!comments || comments.length === 0) {
        return res.status(200).json({ comments: [] });
      }

      // profiles 테이블에서 사용자 이름 조회
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name')
        .eq('user_id', userId)
        .single();

      // 각 묵상에 user_name 추가
      const commentsWithNames = comments.map((comment) => ({
        ...comment,
        user_name: profile?.name || comment.reg_id, // name이 없으면 reg_id 사용
      }));

      return res.status(200).json({ comments: commentsWithNames });
    } catch (error) {
      console.error('사용자 묵상 조회 오류:', error);
      return res.status(500).json({ error: '묵상을 불러오는데 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

