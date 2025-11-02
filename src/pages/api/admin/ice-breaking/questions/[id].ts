import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { question, is_active, order_index } = req.body;

      const updateData: any = {};
      
      if (question !== undefined) updateData.question = question;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (order_index !== undefined) updateData.order_index = order_index;

      const { data, error } = await supabaseAdmin
        .from('ice_breaking_questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('질문 수정 오류:', error);
        return res.status(500).json({ error: '질문 수정에 실패했습니다.' });
      }

      return res.status(200).json({ question: data });
    } catch (error) {
      console.error('질문 수정 오류:', error);
      return res.status(500).json({ error: '질문 수정에 실패했습니다.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('ice_breaking_questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('질문 삭제 오류:', error);
        return res.status(500).json({ error: '질문 삭제에 실패했습니다.' });
      }

      return res.status(200).json({ message: '질문이 삭제되었습니다.' });
    } catch (error) {
      console.error('질문 삭제 오류:', error);
      return res.status(500).json({ error: '질문 삭제에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

