// 파일 경로: src/pages/api/admin/users/cells.ts
// 다락방 목록 조회 API

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

    const { group_id } = req.query;

    // 다락방 목록 조회
    let query = supabaseAdmin
      .from('hub_cells')
      .select('id, name, group_id')
      .order('name', { ascending: true });

    // 그룹 필터
    if (group_id && typeof group_id === 'string') {
      query = query.eq('group_id', parseInt(group_id));
    }

    const { data: cells, error } = await query;

    if (error) {
      console.error('Error fetching cells:', error);
      return res.status(500).json({ error: '다락방 목록을 가져오는 데 실패했습니다.' });
    }

    return res.status(200).json(cells);
  } catch (error) {
    console.error('Error in cells API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

