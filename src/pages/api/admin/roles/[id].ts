// 파일 경로: src/pages/api/admin/roles/[id].ts
// 권한(역할) 수정 및 삭제 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '유효하지 않은 권한 ID입니다.' });
  }

  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return res.status(400).json({ error: '유효하지 않은 권한 ID입니다.' });
  }

  // PUT: 권한 수정
  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: '권한 이름은 필수입니다.' });
      }

      const updateData: { name: string; description?: string | null } = {
        name: name.trim(),
      };

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .update(updateData)
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: '이미 존재하는 권한 이름입니다.' });
        }
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: '권한을 찾을 수 없습니다.' });
        }
        console.error('Error updating role:', error);
        return res.status(500).json({ error: '권한 수정에 실패했습니다.' });
      }

      return res.status(200).json(role);
    } catch (error) {
      console.error('Error in roles API:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }

  // DELETE: 권한 삭제
  if (req.method === 'DELETE') {
    try {
      // 먼저 해당 권한을 사용하는 사용자가 있는지 확인
      const { data: usersWithRole, error: checkError } = await supabaseAdmin
        .from('admin_roles')
        .select('user_id')
        .eq('role_id', roleId)
        .limit(1);

      if (checkError) {
        console.error('Error checking role usage:', checkError);
        return res.status(500).json({ error: '권한 사용 여부 확인에 실패했습니다.' });
      }

      if (usersWithRole && usersWithRole.length > 0) {
        return res.status(400).json({ 
          error: '이 권한을 사용하는 사용자가 있어 삭제할 수 없습니다.' 
        });
      }

      const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: '권한을 찾을 수 없습니다.' });
        }
        console.error('Error deleting role:', error);
        return res.status(500).json({ error: '권한 삭제에 실패했습니다.' });
      }

      return res.status(200).json({ message: '권한이 삭제되었습니다.' });
    } catch (error) {
      console.error('Error in roles API:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

