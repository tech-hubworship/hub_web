// 파일 경로: src/pages/api/bible-card/admin/assign.ts
// 관리자: 목회자 배정 API

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

    const { applicationIds, pastorId } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: '신청 ID가 필요합니다.' });
    }

    if (!pastorId) {
      return res.status(400).json({ error: '목회자 ID가 필요합니다.' });
    }

    // 목회자 권한 확인
    const { data: pastorRoles } = await supabaseAdmin
      .from('admin_roles')
      .select('roles(name)')
      .eq('user_id', pastorId);

    const hasRole = pastorRoles?.some((r: any) => r.roles?.name === '목회자');
    if (!hasRole) {
      return res.status(400).json({ error: '목회자 권한이 있는 사용자만 배정할 수 있습니다.' });
    }

    // 배정 업데이트
    const { error } = await supabaseAdmin
      .from('bible_card_applications')
      .update({
        assigned_pastor_id: pastorId,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
      })
      .in('id', applicationIds);

    if (error) {
      console.error('Error assigning pastor:', error);
      return res.status(500).json({ error: '배정 중 오류가 발생했습니다.' });
    }

    return res.status(200).json({ 
      message: `${applicationIds.length}명에게 목회자가 배정되었습니다.` 
    });
  } catch (error) {
    console.error('Error in assign API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

