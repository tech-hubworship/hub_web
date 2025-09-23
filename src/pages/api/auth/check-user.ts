// 파일 경로: src/pages/api/auth/check-user.ts (새 파일)

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // 관리자 클라이언트로 사용자가 DB에 존재하는지 확인합니다.
    const { data, error } = await supabaseAdmin
      .from('google_users')
      .select('uuid')
      .eq('uuid', userId)
      .maybeSingle(); // 결과가 없어도 에러가 아닌 null을 반환합니다.

    if (error) {
      throw error;
    }

    // 데이터가 존재하면 exists: true, 아니면 exists: false를 반환합니다.
    res.status(200).json({ exists: !!data });

  } catch (error: any) {
    console.error('API Error checking user:', error);
    res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}