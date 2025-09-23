// 파일 경로: src/pages/api/user/profile.ts (새 파일)

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
// 방금 수정한 supabase.ts 파일에서 supabaseAdmin 클라이언트를 가져옵니다.
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 서버에서 현재 로그인된 사용자의 세션을 확인합니다.
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: '인증되지 않은 사용자입니다.' });
  }

  try {
    // @ts-ignore
    const userId = session.user.id;
    if (!userId) {
      return res.status(400).json({ error: '세션에 사용자 ID가 없습니다.' });
    }

    // 관리자 클라이언트로 google_users 테이블을 조회합니다.
    const { data: googleUser, error: googleUserError } = await supabaseAdmin
      .from('google_users')
      .select('email, phone_number')
      .eq('uuid', userId)
      .single();

    if (googleUserError) throw googleUserError;

    // 위에서 얻은 전화번호로 profiles 테이블을 조회합니다.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone_number', googleUser.phone_number)
      .single();

    if (profileError) throw profileError;
    
    // 두 정보를 조합하여 최종 사용자 프로필을 클라이언트에 반환합니다.
    const userProfile = {
      ...profile,
      email: googleUser.email,
    };

    res.status(200).json(userProfile);

  } catch (error: any) {
    console.error('API Error fetching user profile:', error);
    res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}