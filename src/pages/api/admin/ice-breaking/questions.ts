import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('ice_breaking_questions')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('질문 목록 조회 오류:', error);
        return res.status(500).json({ error: '질문 목록을 가져오는데 실패했습니다.' });
      }

      return res.status(200).json({ questions: data || [] });
    } catch (error) {
      console.error('질문 목록 조회 오류:', error);
      return res.status(500).json({ error: '질문 목록을 가져오는데 실패했습니다.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { question, is_active, order_index } = req.body;

      if (!question) {
        return res.status(400).json({ error: '질문 내용은 필수입니다.' });
      }

      const { data, error } = await supabaseAdmin
        .from('ice_breaking_questions')
        .insert({
          question,
          is_active: is_active !== false,
          order_index: order_index || 0
        })
        .select()
        .single();

      if (error) {
        console.error('질문 추가 오류:', error);
        return res.status(500).json({ error: '질문 추가에 실패했습니다.' });
      }

      return res.status(201).json({ question: data });
    } catch (error) {
      console.error('질문 추가 오류:', error);
      return res.status(500).json({ error: '질문 추가에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

