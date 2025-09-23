// 파일 경로: src/pages/api/auth/check-user.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 세션: 서버에서 사용자 세션 확인
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

    // DB: 관리자 권한으로 사용자 존재 여부 확인
    const { data, error } = await supabaseAdmin
      .from('google_users')
      .select('uuid')
      .eq('uuid', userId)
      .maybeSingle(); // 조회: 결과 없으면 null 반환

    if (error) {
      throw error;
    }

    // 반환: 사용자 존재 여부 (true/false)
    res.status(200).json({ exists: !!data });

  } catch (error: any) {
    console.error('API Error checking user:', error);
    res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}