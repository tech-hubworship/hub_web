// 파일 경로: src/pages/api/admin/menus/index.ts

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

    if (req.method === 'GET') {
      // 메뉴 목록 조회
      const { data: menus, error } = await supabaseAdmin
        .from('admin_menus')
        .select(`
          *,
          parent:parent_id(menu_id, title),
          admin_menu_roles(
            role_id,
            roles(id, name)
          )
        `)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching menus:', error);
        return res.status(500).json({ error: '메뉴 목록을 가져오는 데 실패했습니다.' });
      }

      // 역할 정보 정리
      const formattedMenus = menus.map((menu: any) => ({
        ...menu,
        roles: menu.admin_menu_roles?.map((mr: any) => mr.roles?.name).filter(Boolean) || [],
        admin_menu_roles: undefined,
      }));

      return res.status(200).json(formattedMenus);
    }

    if (req.method === 'POST') {
      // MC 권한 확인 (메뉴 생성은 MC만 가능)
      const userRoles = session.user.roles || [];
      if (!userRoles.includes('MC')) {
        return res.status(403).json({ error: 'MC 권한이 필요합니다.' });
      }

      const { menu_id, title, icon, path, parent_id, order_index, description, roles } = req.body;

      if (!menu_id || !title || !path) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
      }

      // 메뉴 생성
      const { data: newMenu, error: insertError } = await supabaseAdmin
        .from('admin_menus')
        .insert({
          menu_id,
          title,
          icon,
          path,
          parent_id,
          order_index: order_index || 0,
          description,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating menu:', insertError);
        return res.status(500).json({ error: '메뉴 생성에 실패했습니다.' });
      }

      // 역할 연결
      if (roles && roles.length > 0) {
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('id, name')
          .in('name', roles);

        if (roleData && roleData.length > 0) {
          const menuRoles = roleData.map((role: any) => ({
            menu_id: newMenu.id,
            role_id: role.id,
          }));

          await supabaseAdmin.from('admin_menu_roles').insert(menuRoles);
        }
      }

      return res.status(201).json(newMenu);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in menus API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

