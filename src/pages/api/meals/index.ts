import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 요청 처리 - 식단 정보 조회
  if (req.method === 'GET') {
    try {
      // 쿼리 파라미터에서 날짜 필터링 값 가져오기
      const { startDate, endDate } = req.query;
      
      // 기본 쿼리 설정
      let query = supabase.from('meals').select('*');
      
      // 날짜 필터링 적용
      if (startDate) {
        query = query.gte('date', startDate as string);
      }
      
      if (endDate) {
        query = query.lte('date', endDate as string);
      }
      
      // 정렬 적용
      query = query.order('date', { ascending: true });
      
      // 쿼리 실행
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('식단 정보 조회 중 오류 발생:', error);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.', error });
    }
  }
  
  // 지원하지 않는 HTTP 메소드
  return res.status(405).json({ success: false, message: '지원하지 않는 메소드입니다.' });
} 