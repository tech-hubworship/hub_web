// 파일 경로: src/pages/api/admin/users/roles.ts

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
    const menuId = getMenuIdFromPath(req.url || '/api/admin/users/roles');
    const permission = await checkMenuPermission(session.user.roles || [], menuId);
    
    if (!permission.hasPermission) {
      return res.status(403).json({ error: permission.error || '권한이 없습니다.' });
    }

    const { userId, roles } = req.body;

    if (!userId || !Array.isArray(roles)) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }

    // 1. 먼저 roles 테이블에서 역할 ID 조회
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .in('name', roles);

    if (roleError) {
      console.error('Error fetching roles:', roleError);
      return res.status(500).json({ error: '역할 조회에 실패했습니다.' });
    }

    // 2. 기존 권한 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('admin_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting roles:', deleteError);
      return res.status(500).json({ error: '기존 권한 삭제에 실패했습니다.' });
    }

    // 3. 새 권한 추가 (역할이 있는 경우만)
    if (roleData && roleData.length > 0) {
      const adminRoles = roleData.map(role => ({
        user_id: userId,
        role_id: role.id,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('admin_roles')
        .insert(adminRoles);

      if (insertError) {
        console.error('Error inserting roles:', insertError);
        return res.status(500).json({ error: '권한 추가에 실패했습니다.' });
      }
    }

    // 4. status 필드 업데이트 (권한이 있으면 관리자, 없으면 활성)
    const newStatus = roleData && roleData.length > 0 ? '관리자' : '활성';
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating status:', updateError);
      // status 업데이트 실패는 치명적이지 않으므로 경고만 출력
    }

    return res.status(200).json({ message: '권한이 수정되었습니다.' });
  } catch (error) {
    console.error('Error in roles API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

