// 파일 경로: src/pages/api/bible-card/download.ts
// 사용자 말씀카드 다운로드 링크 조회 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const userId = session.user.id;

    // 내 신청 조회 (완료되고 링크가 있는 경우만)
    const { data, error } = await supabaseAdmin
      .from('bible_card_applications')
      .select(`
        id,
        name,
        bible_verse,
        bible_verse_reference,
        pastor_message,
        drive_link_1,
        drive_link_2,
        status,
        completed_at,
        links_added_at,
        pastor:assigned_pastor_id(name)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching download info:', error);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    if (!data) {
      return res.status(404).json({ 
        error: '신청 내역이 없습니다.',
        hasApplication: false
      });
    }

    // 링크가 아직 없는 경우
    if (!data.drive_link_1 && !data.drive_link_2) {
      return res.status(200).json({
        hasApplication: true,
        hasLinks: false,
        status: data.status,
        message: '아직 말씀카드가 준비되지 않았습니다.'
      });
    }

    const pastorData = data.pastor as any;
    return res.status(200).json({
      hasApplication: true,
      hasLinks: true,
      data: {
        name: data.name,
        bible_verse: data.bible_verse,
        bible_verse_reference: data.bible_verse_reference,
        pastor_message: data.pastor_message,
        pastor_name: pastorData?.name,
        drive_link_1: data.drive_link_1,
        drive_link_2: data.drive_link_2,
        completed_at: data.completed_at,
      }
    });
  } catch (error) {
    console.error('Error in download API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

