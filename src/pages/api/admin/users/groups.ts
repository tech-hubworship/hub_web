// 파일 경로: src/pages/api/admin/users/groups.ts
// 그룹 목록 조회 API

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

    // 그룹 목록 조회 (hub_groups 테이블에는 community 컬럼이 없으므로 모든 그룹 반환)
    // is_active가 false인 그룹도 포함하여 조회
    const { data: groups, error } = await supabaseAdmin
      .from('hub_groups')
      .select('id, name, is_active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
      return res.status(500).json({ error: '그룹 목록을 가져오는 데 실패했습니다.' });
    }

    return res.status(200).json(groups);
  } catch (error) {
    console.error('Error in groups API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

