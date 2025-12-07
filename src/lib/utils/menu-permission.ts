// 파일 경로: src/lib/utils/menu-permission.ts
// 메뉴 권한 확인 유틸리티

import { supabaseAdmin } from '@src/lib/supabase';

/**
 * API 경로를 메뉴 ID로 변환 (DB에서 조회)
 * @param path API 경로 (예: /api/admin/users)
 * @returns 메뉴 ID 또는 null
 */
export async function getMenuIdFromPath(path: string): Promise<string | null> {
  // /api/admin/ 제거하고 /admin/ 경로로 변환
  let adminPath = path.replace('/api/admin/', '/admin/');
  
  // /admin으로 시작하지 않으면 /admin/ 추가
  if (!adminPath.startsWith('/admin')) {
    adminPath = `/admin${adminPath.startsWith('/') ? '' : '/'}${adminPath}`;
  }

  try {
    // DB에서 경로로 메뉴 조회
    const { data: menu, error } = await supabaseAdmin
      .from('admin_menus')
      .select('menu_id, path')
      .eq('path', adminPath)
      .eq('is_active', true)
      .single();

    if (!error && menu) {
      return menu.menu_id;
    }

    // 정확한 경로 매칭 실패 시, 경로가 포함된 메뉴 찾기 (하위 경로 처리)
    const pathSegments = adminPath.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // /admin/users/roles 같은 경우 /admin/users를 찾기
      for (let i = pathSegments.length; i > 0; i--) {
        const partialPath = '/' + pathSegments.slice(0, i).join('/');
        const { data: partialMenu } = await supabaseAdmin
          .from('admin_menus')
          .select('menu_id, path')
          .eq('path', partialPath)
          .eq('is_active', true)
          .single();

        if (partialMenu) {
          return partialMenu.menu_id;
        }
      }
    }

    // DB에서 찾지 못한 경우, 첫 번째 경로 세그먼트를 메뉴 ID로 사용 (하위 호환성)
    const firstSegment = pathSegments[0] || null;
    return firstSegment;
  } catch (error) {
    console.error('Error getting menu ID from path:', error);
    // 에러 발생 시 첫 번째 경로 세그먼트 반환
    const pathSegments = adminPath.split('/').filter(Boolean);
    return pathSegments[0] || null;
  }
}

/**
 * 사용자가 특정 메뉴에 접근할 수 있는지 확인
 * @param userRoles 사용자 권한 목록
 * @param menuId 메뉴 ID
 * @returns 접근 가능 여부
 */
export async function checkMenuPermission(
  userRoles: string[],
  menuId: string | null
): Promise<{ hasPermission: boolean; error?: string }> {
  if (!menuId) {
    return { hasPermission: false, error: '메뉴를 찾을 수 없습니다.' };
  }

  // 마스터 권한은 모든 메뉴 접근 가능
  if (userRoles.includes('마스터')) {
    return { hasPermission: true };
  }

  // 메뉴 정보 조회
  const { data: menu, error: menuError } = await supabaseAdmin
    .from('admin_menus')
    .select(`
      *,
      admin_menu_roles(
        role_id,
        roles(id, name)
      )
    `)
    .eq('menu_id', menuId)
    .eq('is_active', true)
    .single();

  if (menuError || !menu) {
    // 메뉴가 DB에 없으면 접근 불가
    return { 
      hasPermission: false, 
      error: `메뉴 "${menuId}"를 찾을 수 없거나 비활성화되어 있습니다.` 
    };
  }

  // 메뉴에 설정된 권한 추출
  const menuRoles = (menu.admin_menu_roles as any[])?.map((mr: any) => mr.roles?.name).filter(Boolean) || [];

  // 권한이 설정되지 않은 메뉴는 모든 관리자에게 접근 가능
  if (menuRoles.length === 0) {
    return { hasPermission: true };
  }

  // 사용자 권한 중 하나라도 메뉴 권한에 포함되면 접근 가능
  const hasPermission = menuRoles.some((role: string) => userRoles.includes(role));

  if (!hasPermission) {
    return { 
      hasPermission: false, 
      error: `"${menu.title || menuId}" 메뉴에 접근할 권한이 없습니다. 필요한 권한: ${menuRoles.join(', ')}` 
    };
  }

  return { hasPermission: true };
}

