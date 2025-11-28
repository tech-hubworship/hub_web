// 파일 경로: src/pages/api/admin/users/update.ts

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
    // 세션 확인
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 메뉴 권한 확인
    const { getMenuIdFromPath, checkMenuPermission } = await import('@src/lib/utils/menu-permission');
    const menuId = getMenuIdFromPath(req.url || '/api/admin/users/update');
    const permission = await checkMenuPermission(session.user.roles || [], menuId);
    
    if (!permission.hasPermission) {
      return res.status(403).json({ error: permission.error || '권한이 없습니다.' });
    }

    const { userId, community, group_id, cell_id, status } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    // 업데이트할 필드 준비
    const updateData: Record<string, any> = {};
    
    if (community !== undefined) {
      updateData.community = community || null;
    }
    if (group_id !== undefined) {
      updateData.group_id = group_id || null;
    }
    if (cell_id !== undefined) {
      updateData.cell_id = cell_id || null;
    }
    if (status !== undefined) {
      updateData.status = status || null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '수정할 필드가 없습니다.' });
    }

    // 사용자 정보 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: '사용자 정보 수정에 실패했습니다.' });
    }

    return res.status(200).json({ message: '사용자 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('Error in user update API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

