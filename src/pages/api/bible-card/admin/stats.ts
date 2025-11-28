// 파일 경로: src/pages/api/bible-card/admin/stats.ts
// 관리자: 말씀카드 통계 API

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

    // 전체 통계
    const { data: allApplications } = await supabaseAdmin
      .from('bible_card_applications')
      .select('status');

    const stats = {
      total: allApplications?.length || 0,
      pending: allApplications?.filter(a => a.status === 'pending').length || 0,
      assigned: allApplications?.filter(a => a.status === 'assigned').length || 0,
      completed: allApplications?.filter(a => a.status === 'completed').length || 0,
      delivered: allApplications?.filter(a => a.status === 'delivered').length || 0,
    };

    // 공동체별 통계
    const { data: byCommunity } = await supabaseAdmin
      .from('bible_card_applications')
      .select('community, status');

    const communityStats: Record<string, any> = {};
    byCommunity?.forEach((app: any) => {
      const comm = app.community || '미지정';
      if (!communityStats[comm]) {
        communityStats[comm] = { total: 0, pending: 0, assigned: 0, completed: 0, delivered: 0 };
      }
      communityStats[comm].total++;
      communityStats[comm][app.status]++;
    });

    // 목회자별 통계
    const { data: byPastor } = await supabaseAdmin
      .from('bible_card_applications')
      .select(`
        status,
        assigned_pastor_id,
        pastor:assigned_pastor_id(name)
      `)
      .not('assigned_pastor_id', 'is', null);

    const pastorStats: Record<string, any> = {};
    byPastor?.forEach((app: any) => {
      const pastorName = app.pastor?.name || '알수없음';
      const pastorId = app.assigned_pastor_id;
      if (!pastorStats[pastorId]) {
        pastorStats[pastorId] = { 
          name: pastorName, 
          total: 0, 
          assigned: 0, 
          completed: 0, 
          delivered: 0 
        };
      }
      pastorStats[pastorId].total++;
      if (app.status !== 'pending') {
        pastorStats[pastorId][app.status]++;
      }
    });

    return res.status(200).json({
      overall: stats,
      byCommunity: communityStats,
      byPastor: Object.values(pastorStats),
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

