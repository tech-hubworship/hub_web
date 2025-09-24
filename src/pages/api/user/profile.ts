// 파일 경로: src/pages/api/user/profile.ts

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

  // ⭐️ [보안] NextAuth의 getSession을 사용하여 안전하게 세션 정보를 가져옵니다.
  const session = await getSession({ req });

  // 세션이 없거나, 세션에 사용자 ID가 없으면 비인가(401) 오류를 반환합니다.
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: No session found' });
  }

  const userId = session.user.id; // 이 ID는 이제 Google의 숫자 ID (TEXT 타입) 입니다.

  try {
    // ⭐️ [핵심 수정] 'google_users' 대신 'profiles' 테이블을 조회합니다.
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*') // 프로필의 모든 정보를 가져옵니다. 필요에 따라 수정 가능합니다.
      .eq('user_id', userId) // ⭐️ user_id 컬럼에서 Google ID로 사용자를 찾습니다.
      .single();

    if (error) {
      // 'PGRST116'은 결과가 없다는 뜻이므로, 프로필이 아직 생성되지 않은 정상적인 경우일 수 있습니다.
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Profile not found' });
      }
      // 그 외의 데이터베이스 오류는 서버 오류로 처리합니다.
      throw error;
    }

    // 프로필 정보를 성공적으로 찾았을 경우
    res.status(200).json(profile);

  } catch (error: any) {
    console.error('Error in /api/user/profile:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}