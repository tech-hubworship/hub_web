// 파일 경로: src/pages/api/bible-card/admin/assign-by-group.ts
// 그룹별 담당 목회자에게 자동 배정 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 담당 목회자가 있는 그룹 목록 조회
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('hub_groups')
      .select('id, name, pastor_id')
      .eq('is_active', true)
      .not('pastor_id', 'is', null);

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return res.status(500).json({ error: '그룹 조회 중 오류가 발생했습니다.' });
    }

    let totalAssigned = 0;

    // 각 그룹에 대해 배정되지 않은 신청을 담당 목회자에게 배정
    for (const group of groups) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('bible_card_applications')
        .update({
          assigned_pastor_id: group.pastor_id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('group_id', group.id)
        .eq('status', 'pending')
        .select('id');

      if (updateError) {
        console.error(`Error assigning group ${group.name}:`, updateError);
        continue;
      }

      totalAssigned += updated?.length || 0;
    }

    return res.status(200).json({
      success: true,
      message: `${totalAssigned}명이 그룹 담당 목회자에게 배정되었습니다.`,
      assignedCount: totalAssigned,
    });
  } catch (error) {
    console.error('Error in assign-by-group API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

