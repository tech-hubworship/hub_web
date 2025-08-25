import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';

// 초기 다운로드 제한 횟수
const INITIAL_DOWNLOAD_LIMIT = 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 요청: 남은 다운로드 횟수 확인
  if (req.method === 'GET') {
    try {
      // downloads 테이블에서 'wallpaper_downloads' 키에 해당하는 레코드 조회
      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .eq('key', 'wallpaper_downloads')
        .single();

      if (error) {
        // 레코드가 없으면 새로 생성
        if (error.code === 'PGRST116') {
          const { data: newData, error: createError } = await supabase
            .from('downloads')
            .insert([
              { key: 'wallpaper_downloads', remaining_count: INITIAL_DOWNLOAD_LIMIT }
            ])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          return res.status(200).json({ remainingCount: INITIAL_DOWNLOAD_LIMIT });
        } else {
          throw error;
        }
      }

      return res.status(200).json({ remainingCount: data.remaining_count });
    } catch (error) {
      console.error('남은 다운로드 횟수 조회 오류:', error);
      return res.status(500).json({ error: '다운로드 횟수 조회 중 오류가 발생했습니다.' });
    }
  }
  
  // POST 요청: 다운로드 횟수 감소
  else if (req.method === 'POST') {
    try {
      // 현재 카운트 확인
      const { data: currentData, error: fetchError } = await supabase
        .from('downloads')
        .select('*')
        .eq('key', 'wallpaper_downloads')
        .single();

      if (fetchError) {
        // 레코드가 없으면 새로 생성
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: createError } = await supabase
            .from('downloads')
            .insert([
              { key: 'wallpaper_downloads', remaining_count: INITIAL_DOWNLOAD_LIMIT - 1 }
            ])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          return res.status(200).json({ remainingCount: INITIAL_DOWNLOAD_LIMIT - 1 });
        } else {
          throw fetchError;
        }
      }

      // 남은 횟수가 0이면 더 이상 감소시키지 않음
      if (currentData.remaining_count <= 0) {
        return res.status(403).json({ error: '다운로드 횟수가 모두 소진되었습니다.', remainingCount: 0 });
      }

      // 카운트 감소
      const newCount = currentData.remaining_count - 1;
      const { data, error } = await supabase
        .from('downloads')
        .update({ remaining_count: newCount })
        .eq('key', 'wallpaper_downloads')
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({ remainingCount: newCount });
    } catch (error) {
      console.error('다운로드 횟수 감소 오류:', error);
      return res.status(500).json({ error: '다운로드 횟수 감소 중 오류가 발생했습니다.' });
    }
  }

  // 지원하지 않는 HTTP 메서드
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 