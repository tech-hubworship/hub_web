// 파일 경로: src/pages/api/admin/menus/[id].ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 세션 확인
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const { id } = req.query;
    const menuId = parseInt(id as string);

    if (isNaN(menuId)) {
      return res.status(400).json({ error: '유효하지 않은 메뉴 ID입니다.' });
    }

    // 메뉴 정보 조회 (권한 확인용)
    const { data: menu, error: menuError } = await supabaseAdmin
      .from('admin_menus')
      .select(`
        *,
        admin_menu_roles(
          role_id,
          roles(id, name)
        )
      `)
      .eq('id', menuId)
      .single();

    if (menuError || !menu) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }

    // 메뉴에 설정된 권한 추출
    const menuRoles = (menu.admin_menu_roles as any[])?.map((mr: any) => mr.roles?.name).filter(Boolean) || [];

    // 권한 확인: MC 권한 또는 메뉴에 설정된 권한 중 하나라도 있으면 수정 가능
    const userRoles = session.user.roles || [];
    const hasMC = userRoles.includes('MC');
    const hasMenuRole = menuRoles.length > 0 && menuRoles.some((role: string) => userRoles.includes(role));
    const hasMasterRole = userRoles.includes('마스터'); // 마스터 권한은 모든 메뉴 수정 가능

    if (!hasMC && !hasMenuRole && !hasMasterRole) {
      return res.status(403).json({ 
        error: '이 메뉴를 수정할 권한이 없습니다. MC 권한 또는 해당 메뉴에 설정된 권한이 필요합니다.' 
      });
    }

    if (req.method === 'PUT') {
      const { title, icon, path, parent_id, order_index, description, is_active, roles } = req.body;

      // 메뉴 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('admin_menus')
        .update({
          title,
          icon,
          path,
          parent_id,
          order_index,
          description,
          is_active,
        })
        .eq('id', menuId);

      if (updateError) {
        console.error('Error updating menu:', updateError);
        return res.status(500).json({ error: '메뉴 수정에 실패했습니다.' });
      }

      // 역할 업데이트
      if (roles !== undefined) {
        // 기존 역할 삭제
        await supabaseAdmin
          .from('admin_menu_roles')
          .delete()
          .eq('menu_id', menuId);

        // 새 역할 추가
        if (roles.length > 0) {
          const { data: roleData } = await supabaseAdmin
            .from('roles')
            .select('id, name')
            .in('name', roles);

          if (roleData && roleData.length > 0) {
            const menuRoles = roleData.map((role: any) => ({
              menu_id: menuId,
              role_id: role.id,
            }));

            await supabaseAdmin.from('admin_menu_roles').insert(menuRoles);
          }
        }
      }

      return res.status(200).json({ message: '메뉴가 수정되었습니다.' });
    }

    if (req.method === 'DELETE') {
      // 하위 메뉴 확인
      const { data: childMenus } = await supabaseAdmin
        .from('admin_menus')
        .select('id')
        .eq('parent_id', menuId);

      if (childMenus && childMenus.length > 0) {
        return res.status(400).json({ error: '하위 메뉴가 있는 메뉴는 삭제할 수 없습니다.' });
      }

      // 메뉴 삭제
      const { error: deleteError } = await supabaseAdmin
        .from('admin_menus')
        .delete()
        .eq('id', menuId);

      if (deleteError) {
        console.error('Error deleting menu:', deleteError);
        return res.status(500).json({ error: '메뉴 삭제에 실패했습니다.' });
      }

      return res.status(200).json({ message: '메뉴가 삭제되었습니다.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in menu API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

