// 파일 경로: src/pages/api/bible-card/admin/links.ts
// 관리자: 구글드라이브 링크 입력 API

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
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const { applicationId, drive_link_1, drive_link_2 } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: '신청 ID가 필요합니다.' });
    }

    // 링크 업데이트
    const { error } = await supabaseAdmin
      .from('bible_card_applications')
      .update({
        drive_link_1: drive_link_1 || null,
        drive_link_2: drive_link_2 || null,
        links_added_at: new Date().toISOString(),
        status: 'delivered', // 링크가 추가되면 전달 완료 상태로
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating links:', error);
      return res.status(500).json({ error: '링크 저장 중 오류가 발생했습니다.' });
    }

    return res.status(200).json({ message: '링크가 저장되었습니다.' });
  } catch (error) {
    console.error('Error in links API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

