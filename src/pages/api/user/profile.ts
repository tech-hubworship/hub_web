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

  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: No session found' });
  }

  const userId = session.user.id;

  try {
    // ⭐️ [수정] select 목록에 'birth_date'를 추가합니다.
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('name, email, birth_date, gender, community, group_name, cell_name')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // 결과가 없는 경우
        return res.status(404).json({ message: 'Profile not found' });
      }
      throw error;
    }

    res.status(200).json(profile);

  } catch (error: any) {
    console.error('Error in /api/user/profile:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}