// 파일 경로: /api/auth/complete-profile.ts

import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session?.user?.id || !session.user.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;
  // ⭐️ [수정] birth_date를 포함한 모든 가능한 필드를 받습니다.
  const { name, birth_date, gender, community, group_name, cell_name } = req.body;

  // ⭐️ [수정] 조건부 유효성 검사 (birth_date 추가)
  if (!name || !birth_date || !gender || !community) {
    return res.status(400).json({ message: '이름, 생년월일, 성별, 공동체 정보는 필수입니다.' });
  }
  if (community === '허브' && (!group_name || !cell_name)) {
    return res.status(400).json({ message: '허브 공동체는 그룹과 다락방 정보가 필수입니다.' });
  }

  // ⭐️ [수정] DB에 저장할 데이터를 동적으로 구성 (birth_date 추가)
  const profileDataToUpsert = {
    user_id: userId,
    email: session.user.email,
    name,
    birth_date,
    gender,
    community,
    status: '활성',
    group_name: community === '허브' ? group_name : null,
    cell_name: community === '허브' ? cell_name : null,
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileDataToUpsert)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: '회원가입이 완료되었습니다.', user: data });

  } catch (error: any) {
    console.error('Error in complete-profile API:', error);
    res.status(500).json({ message: '프로필 업데이트 중 오류가 발생했습니다.', details: error.message });
  }
}