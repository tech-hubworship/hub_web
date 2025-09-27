// 파일 경로: /pages/api/admin/survey-stats.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  // ⭐️ [보안] 관리자(또는 특정 권한 소유자)만 접근 가능하도록 설정
  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Access is denied.' });
  }

  const { surveyId } = req.query;

  if (!surveyId) {
    return res.status(400).json({ message: 'Survey ID is required.' });
  }

  try {
    // ⭐️ [핵심] .select()에 count 옵션을 사용하여 전체 개수만 효율적으로 가져옵니다.
    const { count, error } = await supabaseAdmin
      .from('survey_responses')
      .select('*', { count: 'exact', head: true }) // head: true는 데이터 없이 개수만 요청
      .eq('survey_id', surveyId);

    if (error) throw error;
    
    // 성공 시 전체 응답 개수를 반환
    res.status(200).json({ totalResponses: count });

  } catch (error: any) {
    console.error('Error fetching survey stats:', error);
    res.status(500).json({ message: 'Failed to fetch survey stats', details: error.message });
  }
}