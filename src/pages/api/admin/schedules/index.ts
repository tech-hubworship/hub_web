import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 인증 로직은 미들웨어 또는 별도 함수로 구현할 수 있습니다.
  // 예제에서는 간단하게 구현합니다.

  try {
    // GET 요청 처리: 일정 목록 조회
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('day', { ascending: true })
        .order('end_time', { ascending: true });
      
      if (error) throw error;
      
      return res.status(200).json(data);
    }
    
    // POST 요청 처리: 새 일정 추가
    if (req.method === 'POST') {
      const { title, end_time, day, mainvisible } = req.body;
      
      if (!title || !end_time || !day) {
        return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
      }
      
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          title,
          end_time,
          day,
          mainvisible: mainvisible !== undefined ? mainvisible : null
        })
        .select();
      
      if (error) throw error;
      
      return res.status(201).json(data[0]);
    }
    
    // 지원하지 않는 HTTP 메서드
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  } catch (error: any) {
    console.error('일정 API 오류:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
} 