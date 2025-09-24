// 파일 경로: src/pages/api/auth/complete-profile.ts

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

  // ⭐️ [보안] NextAuth의 getSession을 사용하여 안전하게 세션 정보를 가져옵니다.
  const session = await getSession({ req });

  // 세션이 없거나, 세션에 사용자 ID가 없으면 비인가(401) 오류를 반환합니다.
  if (!session?.user?.id || !session.user.email || !session.user.name) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;
  const {
    name, birth_date, phone_number, gender,
    cell_name, leader_name, community,
  } = req.body;

  // 필수 값 검증
  if (!name || !birth_date || !phone_number || !gender || !cell_name || !leader_name || !community) {
    return res.status(400).json({ message: '모든 항목을 빠짐없이 입력해주세요.' });
  }

  try {
    // ⭐️ [핵심 수정] .update() 대신 .upsert()를 사용합니다.
    // user_id를 기준으로 프로필이 있으면 업데이트, 없으면 새로 생성합니다.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId, // ⭐️ upsert를 위해 id를 명시적으로 포함
        email: session.user.email,
        name: name,
        birth_date: birth_date,
        phone_number: phone_number,
        gender: gender,
        cell_name: cell_name,
        leader_name: leader_name,
        community: community,
        status: '활성', // 추가 정보가 입력되었으므로 '활성' 상태로 변경
      })
      .select()
      .single();

    if (error) {
      // 에러를 그대로 throw하여 아래 catch 블록에서 처리하도록 합니다.
      throw error;
    }

    res.status(200).json({ message: '회원가입이 완료되었습니다.', user: data });

  } catch (error: any) {
    console.error('Error in complete-profile API:', error);

    // 중복된 전화번호 오류 처리
    if (error.code === '23505') {
        return res.status(409).json({ message: '이미 사용 중인 전화번호입니다.' });
    }

    res.status(500).json({ message: '프로필 업데이트 중 오류가 발생했습니다.', details: error.message });
  }
}