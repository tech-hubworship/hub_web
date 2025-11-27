// 파일 경로: src/pages/api/admin/menus/roles.ts
// 역할 목록 조회 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 세션 확인
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 역할 목록 조회
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ error: '역할 목록을 가져오는 데 실패했습니다.' });
    }

    return res.status(200).json(roles);
  } catch (error) {
    console.error('Error in roles API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

