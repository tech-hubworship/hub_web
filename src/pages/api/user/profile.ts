// 파일 경로: src/pages/api/user/profile.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: '인증되지 않음' });
  }

  try {
    // @ts-ignore
    const { id: userId } = session.user;

    const { data: googleUser, error: gUserError } = await supabaseAdmin
      .from('google_users')
      .select('email, phone_number')
      .eq('uuid', userId)
      .single();

    if (gUserError) throw gUserError;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone_number', googleUser.phone_number)
      .single();

    if (profileError) throw profileError;

    res.status(200).json({ ...profile, email: googleUser.email });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}