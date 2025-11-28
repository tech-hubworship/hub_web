// 파일 경로: src/pages/api/bible-card/pastor/complete.ts
// 목회자: 말씀 입력 완료 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 목회자 권한 확인
    const userRoles = session.user.roles || [];
    if (!userRoles.includes('목회자')) {
      return res.status(403).json({ error: '목회자 권한이 필요합니다.' });
    }

    const pastorId = session.user.id;
    const { applicationId, bible_verse, bible_verse_reference, pastor_message } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: '신청 ID가 필요합니다.' });
    }

    if (!bible_verse || !bible_verse_reference) {
      return res.status(400).json({ error: '성경 말씀과 구절 참조는 필수입니다.' });
    }

    // 해당 신청이 이 목회자에게 배정된 것인지 확인
    const { data: existing } = await supabaseAdmin
      .from('bible_card_applications')
      .select('id, assigned_pastor_id')
      .eq('id', applicationId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: '신청을 찾을 수 없습니다.' });
    }

    if (existing.assigned_pastor_id !== pastorId) {
      return res.status(403).json({ error: '본인에게 배정된 지체만 말씀을 입력할 수 있습니다.' });
    }

    // 말씀 입력
    const { error } = await supabaseAdmin
      .from('bible_card_applications')
      .update({
        bible_verse,
        bible_verse_reference,
        pastor_message: pastor_message || null,
        completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error completing:', error);
      return res.status(500).json({ error: '저장 중 오류가 발생했습니다.' });
    }

    return res.status(200).json({ message: '말씀이 저장되었습니다.' });
  } catch (error) {
    console.error('Error in complete API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

