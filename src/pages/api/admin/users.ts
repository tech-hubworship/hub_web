// 파일 경로: src/pages/api/admin/users.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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
    const menuId = getMenuIdFromPath(req.url || '/api/admin/users');
    const permission = await checkMenuPermission(session.user.roles || [], menuId);
    
    if (!permission.hasPermission) {
      return res.status(403).json({ error: permission.error || '권한이 없습니다.' });
    }

    const { 
      search = '', 
      page = '1', 
      limit = '20',
      community,
      group_id,
      cell_id,
      status
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // 먼저 전체 개수 조회
    let countQuery = supabaseAdmin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true });

    // 검색어가 있으면 필터 적용
    if (search && typeof search === 'string') {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // 필터 적용
    if (community && typeof community === 'string') {
      countQuery = countQuery.eq('community', community);
    }
    if (group_id && typeof group_id === 'string') {
      countQuery = countQuery.eq('group_id', parseInt(group_id));
    }
    if (cell_id && typeof cell_id === 'string') {
      countQuery = countQuery.eq('cell_id', parseInt(cell_id));
    }
    if (status && typeof status === 'string') {
      if (status === 'null') {
        countQuery = countQuery.is('status', null);
      } else {
        countQuery = countQuery.eq('status', status);
      }
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting users:', countError);
      return res.status(500).json({ error: '사용자 수를 가져오는 데 실패했습니다.' });
    }

    // 데이터 조회
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        user_id,
        email,
        name,
        birth_date,
        community,
        group_id,
        cell_id,
        status,
        created_at,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name),
        admin_roles(roles(name))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // 검색어가 있으면 필터 적용
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 필터 적용
    if (community && typeof community === 'string') {
      query = query.eq('community', community);
    }
    if (group_id && typeof group_id === 'string') {
      query = query.eq('group_id', parseInt(group_id));
    }
    if (cell_id && typeof cell_id === 'string') {
      query = query.eq('cell_id', parseInt(cell_id));
    }
    if (status && typeof status === 'string') {
      if (status === 'null') {
        query = query.is('status', null);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: '사용자 목록을 가져오는 데 실패했습니다.' });
    }

    // 역할 정보를 roles 배열로 변환하고 group_name, cell_name 추가
    const users = data.map((user: any) => {
      const roles = user.admin_roles && Array.isArray(user.admin_roles)
        ? user.admin_roles.map((roleEntry: any) => roleEntry?.roles?.name).filter(Boolean)
        : [];
      
      // group_name과 cell_name 추출
      const group_name = user.hub_groups?.name || null;
      const cell_name = user.hub_cells?.name || null;
      const group = user.hub_groups || null;
      const cell = user.hub_cells || null;
      
      // 불필요한 필드 제거하고 정리
      const { admin_roles, hub_groups, hub_cells, ...userWithoutRelations } = user;
      
      return {
        ...userWithoutRelations,
        group_name,
        cell_name,
        group,
        cell,
        roles,
      };
    });

    // 페이지네이션 정보와 함께 반환
    return res.status(200).json({
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      }
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

