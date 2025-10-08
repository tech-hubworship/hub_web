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

    const { search = '' } = req.query;

    // 기본 쿼리
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
        hub_groups:group_id(name),
        hub_cells:cell_id(name),
        admin_roles(roles(name))
      `)
      .order('created_at', { ascending: false });

    // 검색어가 있으면 필터 적용
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: '사용자 목록을 가져오는데 실패했습니다.' });
    }

    // 역할 정보를 roles 배열로 변환하고 group_name, cell_name 추가
    const users = data.map((user: any) => {
      const roles = user.admin_roles && Array.isArray(user.admin_roles)
        ? user.admin_roles.map((roleEntry: any) => roleEntry?.roles?.name).filter(Boolean)
        : [];
      
      // group_name과 cell_name 추출
      const group_name = user.hub_groups?.name || null;
      const cell_name = user.hub_cells?.name || null;
      
      // 불필요한 필드 제거하고 정리
      const { admin_roles, hub_groups, hub_cells, ...userWithoutRelations } = user;
      
      return {
        ...userWithoutRelations,
        group_name,
        cell_name,
        roles,
      };
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

