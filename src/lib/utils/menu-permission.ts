// 파일 경로: src/lib/utils/menu-permission.ts
// 메뉴 권한 확인 유틸리티

import { supabaseAdmin } from '@src/lib/supabase';

/**
 * API 경로를 메뉴 ID로 변환
 */
export function getMenuIdFromPath(path: string): string | null {
  // /api/admin/ 제거
  const cleanPath = path.replace('/api/admin/', '');
  
  // 경로를 메뉴 ID로 매핑
  const pathToMenuId: { [key: string]: string } = {
    'users': 'users',
    'users/roles': 'users',
    'users/update': 'users',
    'users/groups': 'users',
    'users/cells': 'users',
    'roles': 'roles',
    'roles/[id]': 'roles',
    'photos': 'photos',
    'photos/manage': 'photos-manage',
    'photos/reservations': 'photos-reservations',
    'photos/stats': 'photos',
    'photos/folders': 'photos-manage',
    'advent': 'advent',
    'advent/posts': 'advent-posts',
    'advent/posts/[post_dt]': 'advent-posts',
    'advent/attendance': 'advent-attendance',
    'advent/stats': 'advent-stats',
    'design': 'design',
    'design/design-data': 'design',
    'design/survey-stats': 'design',
    'design/download-survey-csv': 'design',
    'secretary': 'secretary',
    'ice-breaking/questions': 'ice-breaking',
    'ice-breaking/questions/[id]': 'ice-breaking',
    'menus': 'menu-management',
    'menus/[id]': 'menu-management',
    'menus/roles': 'menu-management',
    'tech-inquiries': 'tech-inquiries',
    'bible-card': 'bible-card',
    'bible-card/applications': 'bible-card-applications',
    'bible-card/pastor': 'bible-card-pastor',
    'bible-card/complete': 'bible-card-complete',
  };

  // 정확한 매칭 시도
  if (pathToMenuId[cleanPath]) {
    return pathToMenuId[cleanPath];
  }

  // 동적 경로 처리 ([id] 등)
  for (const [pattern, menuId] of Object.entries(pathToMenuId)) {
    const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$');
    if (regex.test(cleanPath)) {
      return menuId;
    }
  }

  // 첫 번째 경로 세그먼트를 메뉴 ID로 사용
  const firstSegment = cleanPath.split('/')[0];
  return firstSegment || null;
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

