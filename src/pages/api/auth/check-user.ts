// 파일 경로: src/pages/api/auth/check-user.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: '인증되지 않음' });
  }

  try {
    // @ts-ignore
    const { id: userId } = session.user;
    
    const { data, error } = await supabaseAdmin
      .from('google_users')
      .select('uuid')
      .eq('uuid', userId)
      .maybeSingle(); // 결과 없으면 null 반환

    if (error) throw error;

    res.status(200).json({ exists: !!data }); // 존재 여부만 반환
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}