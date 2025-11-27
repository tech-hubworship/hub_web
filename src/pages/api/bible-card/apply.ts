// 파일 경로: src/pages/api/bible-card/apply.ts
// 말씀카드 신청 API

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
    const { name, birth_date, gender, community, group_id, cell_id, prayer_request } = req.body;

    // 필수 필드 검증
    if (!name || !prayer_request) {
      return res.status(400).json({ error: '이름과 기도제목은 필수입니다.' });
    }

    // 이미 신청했는지 확인
    const { data: existing } = await supabaseAdmin
      .from('bible_card_applications')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: '이미 말씀카드를 신청하셨습니다.' });
    }

    // 신청 저장
    const { data, error } = await supabaseAdmin
      .from('bible_card_applications')
      .insert({
        user_id: userId,
        name,
        community: community || null,
        group_id: group_id || null,
        cell_id: cell_id || null,
        prayer_request,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ error: '신청 중 오류가 발생했습니다.' });
    }

    // 프로필 정보도 업데이트 (선택적)
    const profileUpdate: Record<string, any> = {};
    if (name) profileUpdate.name = name;
    if (birth_date) profileUpdate.birth_date = birth_date;
    if (gender) profileUpdate.gender = gender;
    if (community) profileUpdate.community = community;
    if (group_id) profileUpdate.group_id = group_id;
    if (cell_id) profileUpdate.cell_id = cell_id;
    
    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', userId);
    }

    return res.status(201).json({ 
      message: '말씀카드 신청이 완료되었습니다.',
      data 
    });
  } catch (error) {
    console.error('Error in apply API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

