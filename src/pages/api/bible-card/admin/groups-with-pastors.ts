// 파일 경로: src/pages/api/bible-card/admin/groups-with-pastors.ts
// 그룹별 담당 목회자 정보 조회 API

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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 그룹 목록과 담당 목회자 정보 조회
    const { data: groups, error } = await supabaseAdmin
      .from('hub_groups')
      .select(`
        id,
        name,
        pastor_id,
        pastor:pastor_id(user_id, name, email)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching groups:', error);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    const result = groups.map((group: any) => ({
      id: group.id,
      name: group.name,
      pastor_id: group.pastor_id,
      pastor_name: group.pastor?.name || null,
      pastor_email: group.pastor?.email || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in groups-with-pastors API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

