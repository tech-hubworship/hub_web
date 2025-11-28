// 파일 경로: src/pages/api/bible-card/admin/group-pastor.ts
// 그룹별 담당 목회자 지정 API

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

    const { groupId, pastorId } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: '그룹 ID가 필요합니다.' });
    }

    // pastorId가 제공된 경우 목회자 권한 확인
    if (pastorId) {
      const { data: pastorRoles } = await supabaseAdmin
        .from('admin_roles')
        .select(`
          user_id,
          roles!inner(name)
        `)
        .eq('user_id', pastorId)
        .eq('roles.name', '목회자');

      if (!pastorRoles || pastorRoles.length === 0) {
        return res.status(400).json({ error: '목회자 권한이 있는 사용자만 지정할 수 있습니다.' });
      }
    }

    // 그룹의 담당 목회자 업데이트
    const { error } = await supabaseAdmin
      .from('hub_groups')
      .update({ pastor_id: pastorId || null })
      .eq('id', groupId);

    if (error) {
      console.error('Error updating group pastor:', error);
      return res.status(500).json({ error: '목회자 지정 중 오류가 발생했습니다.' });
    }

    return res.status(200).json({ 
      message: pastorId ? '담당 목회자가 지정되었습니다.' : '담당 목회자가 해제되었습니다.'
    });
  } catch (error) {
    console.error('Error in group-pastor API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

