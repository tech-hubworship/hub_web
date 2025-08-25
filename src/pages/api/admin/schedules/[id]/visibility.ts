import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 스케줄 ID 파싱
  const id = parseInt(req.query.id as string);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: '유효하지 않은 스케줄 ID입니다.' });
  }
  
  try {
    // PATCH 요청 처리: 메인 노출 상태 변경
    if (req.method === 'PATCH') {
      const { mainvisible } = req.body;
      
      // mainvisible 값이 1, 2, 3 중 하나이거나 null이어야 함
      if (mainvisible !== null && ![1, 2, 3].includes(mainvisible)) {
        return res.status(400).json({ message: 'mainvisible 값은 1, 2, 3 중 하나이거나 null이어야 합니다.' });
      }
      
      const { data, error } = await supabase
        .from('schedules')
        .update({ mainvisible })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (data && data.length === 0) {
        return res.status(404).json({ message: '해당 스케줄을 찾을 수 없습니다.' });
      }
      
      return res.status(200).json(data[0]);
    }
    
    // 지원하지 않는 HTTP 메서드
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  } catch (error: any) {
    console.error('Schedule API 오류:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
} 