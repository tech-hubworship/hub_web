// 파일 경로: src/pages/api/user/profile.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: No session found' });
  }

  const userId = session.user.id;

  try {
    // 1. 프로필 + 그룹/다락방 관계 정보 조회
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        name, email, birth_date, gender, community,
        hub_groups!fk_group_id ( id, name ), 
        hub_cells!fk_cell_id ( id, name )
      `)
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // 2. 관리자 역할 조회
    const { data: roles } = await supabaseAdmin
      .from('admin_roles')
      .select(`roles ( name )`)
      .eq('user_id', userId);

    // 3. 담당 그룹 조회 (목회자/그룹장)
    const { data: responsibleGroup } = await supabaseAdmin
      .from('hub_groups')
      .select('id, name')
      .or(`pastor_id.eq.${userId},group_leader_id.eq.${userId}`)
      .maybeSingle();

    // 4. 담당 다락방 조회 (다락방장)
    const { data: responsibleCell } = await supabaseAdmin
      .from('hub_cells')
      .select(`id, name, hub_groups ( id, name )`)
      .eq('cell_leader_id', userId)
      .maybeSingle();

    // 5. 응답 데이터 구성
    const responseData = {
      name: profile.name,
      email: profile.email,
      birth_date: profile.birth_date,
      gender: profile.gender,
      community: profile.community,

      group_id: (profile.hub_groups as any)?.id || null,
      group_name: (profile.hub_groups as any)?.name || null,

      cell_id: (profile.hub_cells as any)?.id || null,
      cell_name: (profile.hub_cells as any)?.name || null,

      roles: roles?.map(r => (r.roles as any).name) || [],

      responsible_group_id: responsibleGroup?.id || null,
      responsible_group_name: responsibleGroup?.name || null,

      responsible_cell_id: responsibleCell?.id || null,
      responsible_cell_info: responsibleCell
        ? `${(responsibleCell.hub_groups as any)?.name} / ${responsibleCell.name}`
        : null,
    };

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('Error in /api/user/profile:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}
