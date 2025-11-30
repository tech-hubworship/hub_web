// 파일 경로: src/pages/api/bible-card/update-prayer.ts
// 말씀카드 기도제목 수정 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const userId = session.user.id;
    const { prayer_request } = req.body;

    // 필수 필드 검증
    if (!prayer_request || !prayer_request.trim()) {
      return res.status(400).json({ error: '기도제목을 입력해주세요.' });
    }

    // 기도제목 길이 제한 (1000자)
    if (prayer_request.length > 1000) {
      return res.status(400).json({ error: '기도제목은 1000자 이내로 작성해주세요.' });
    }

    // 내 신청 내역 조회
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('bible_card_applications')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });
    }

    // pending 상태일 때만 수정 가능
    if (existing.status !== 'pending') {
      return res.status(400).json({ 
        error: '목회자 배정이 완료된 후에는 기도제목을 수정할 수 없습니다.' 
      });
    }

    // 기도제목 업데이트
    const { data, error } = await supabaseAdmin
      .from('bible_card_applications')
      .update({
        prayer_request: prayer_request.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('Error updating prayer request:', error);
      return res.status(500).json({ error: '기도제목 수정 중 오류가 발생했습니다.' });
    }

    return res.status(200).json({ 
      message: '기도제목이 수정되었습니다.',
      data 
    });
  } catch (error) {
    console.error('Error in update-prayer API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

