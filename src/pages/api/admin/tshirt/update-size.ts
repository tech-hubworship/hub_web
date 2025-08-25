import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // PUT 메소드만 허용
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다' });
  }

  try {
    const { orderId, color, oldSize, newSize, itemId } = req.body;

    if (!orderId || !color || !oldSize || !newSize || !itemId) {
      return res.status(400).json({ message: '필수 파라미터가 누락되었습니다' });
    }

    // 해당 주문 아이템 찾기
    const { data: items, error: findError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('color', color)
      .eq('size', oldSize)
      .eq('item_id', itemId);

    if (findError) {
      console.error('주문 아이템 조회 오류:', findError);
      return res.status(500).json({ message: '주문 아이템 조회 중 오류가 발생했습니다' });
    }

    if (!items || items.length === 0) {
      return res.status(404).json({ message: '변경할 주문 아이템을 찾을 수 없습니다' });
    }

    // 사이즈 업데이트 - 모든 조건을 함께 사용
    const { data, error: updateError, count } = await supabase
      .from('order_items')
      .update({ size: newSize })
      .eq('item_id', itemId)
      .eq('order_id', orderId)
      .eq('color', color)
      .eq('size', oldSize);

    if (updateError) {
      console.error('사이즈 업데이트 오류:', updateError);
      return res.status(500).json({ message: '사이즈 업데이트 중 오류가 발생했습니다' });
    }

    return res.status(200).json({ 
      message: '사이즈가 성공적으로 변경되었습니다',
      updateCount: count || 0
    });
  } catch (error) {
    console.error('사이즈 변경 처리 중 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
} 