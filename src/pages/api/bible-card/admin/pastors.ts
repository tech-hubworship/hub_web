// 파일 경로: src/pages/api/bible-card/admin/pastors.ts
// 관리자: 목회자 목록 조회 API

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

    // 목회자 역할을 가진 사용자 조회
    const { data: pastorRoles, error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .select(`
        user_id,
        roles!inner(name)
      `)
      .eq('roles.name', '목회자');

    if (roleError) {
      console.error('Error fetching pastor roles:', roleError);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    if (!pastorRoles || pastorRoles.length === 0) {
      return res.status(200).json([]);
    }

    const pastorIds = pastorRoles.map((r: any) => r.user_id);

    // 목회자 프로필 조회
    const { data: pastors, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, name, email, community')
      .in('user_id', pastorIds)
      .order('name', { ascending: true });

    if (profileError) {
      console.error('Error fetching pastors:', profileError);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    // 각 목회자별 배정 수 조회
    const { data: assignmentCounts } = await supabaseAdmin
      .from('bible_card_applications')
      .select('assigned_pastor_id')
      .in('assigned_pastor_id', pastorIds);

    const countMap: Record<string, number> = {};
    assignmentCounts?.forEach((a: any) => {
      countMap[a.assigned_pastor_id] = (countMap[a.assigned_pastor_id] || 0) + 1;
    });

    const pastorsWithCounts = pastors?.map((p: any) => ({
      ...p,
      assigned_count: countMap[p.user_id] || 0,
    }));

    return res.status(200).json(pastorsWithCounts);
  } catch (error) {
    console.error('Error in pastors API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

