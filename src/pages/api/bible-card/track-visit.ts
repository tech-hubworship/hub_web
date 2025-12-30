// 파일 경로: src/pages/api/bible-card/track-visit.ts
// 말씀카드 다운로드 페이지 접속 카운팅 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const userId = session.user.id;

    // 해당 사용자의 신청 조회
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('bible_card_applications')
      .select('id, visit_count')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching application:', fetchError);
      return res.status(500).json({ error: '신청 정보 조회 실패' });
    }

    if (!application) {
      return res.status(404).json({ error: '신청 내역이 없습니다.' });
    }

    // visit_count 증가 (없으면 0에서 1로 시작)
    const currentCount = (application.visit_count as number) || 0;
    const { error: updateError } = await supabaseAdmin
      .from('bible_card_applications')
      .update({ 
        visit_count: currentCount + 1,
      })
      .eq('id', application.id);

    if (updateError) {
      // visit_count 컬럼이 없는 경우 에러를 무시 (필드가 존재하지 않음)
      if (updateError.code === '42703' || updateError.message?.includes('visit_count')) {
        console.warn('visit_count 컬럼이 없습니다. 컬럼을 추가해주세요.');
        return res.status(200).json({ 
          success: true,
          visit_count: 0,
          warning: 'visit_count 컬럼이 없습니다.'
        });
      }
      console.error('Error updating visit count:', updateError);
      return res.status(500).json({ error: '접속 카운트 업데이트 실패' });
    }

    return res.status(200).json({ 
      success: true,
      visit_count: currentCount + 1
    });
  } catch (error) {
    console.error('Error in track-visit API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}


