// 파일 경로: src/pages/api/user/update-profile.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';
import { getKoreanTimestamp } from '@src/lib/utils/date';

// ⭐️ [핵심] 역할별 비밀번호 환경 변수를 매핑합니다.
const PASSWORD_ENV_MAP: { [key: string]: string | undefined } = {
    'MC': process.env.MC_SIGNUP_PASSWORD,
    '다락방장': process.env.CELL_LEADER_SIGNUP_PASSWORD,
    '그룹장': process.env.GROUP_LEADER_SIGNUP_PASSWORD,
    '목회자': process.env.PASTOR_SIGNUP_PASSWORD,
};

const ALL_ROLES = Object.keys(PASSWORD_ENV_MAP);
const ADMIN_ROLES_IN_DB = ['MC', '목회자'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { role, password, ...formData } = req.body;

  try {
    // ⭐️ [핵심] 권한이 필요한 역할로 변경 시, 역할에 맞는 비밀번호를 검증합니다.
    if (role && ALL_ROLES.includes(role)) {
      const correctPassword = PASSWORD_ENV_MAP[role];
      if (!correctPassword) {
        throw new Error(`서버에 ${role} 역할의 비밀번호가 설정되지 않았습니다.`);
      }
      if (password !== correctPassword) {
        return res.status(401).json({ message: '암호가 올바르지 않습니다.' });
      }
    }

    // 2. 기존 책임 정보 초기화
    await supabaseAdmin.from('hub_groups').update({ pastor_id: null }).eq('pastor_id', userId);
    await supabaseAdmin.from('hub_groups').update({ group_leader_id: null }).eq('group_leader_id', userId);
    await supabaseAdmin.from('hub_cells').update({ cell_leader_id: null }).eq('cell_leader_id', userId);

    // 3. 프로필 정보 업데이트
    const profileDataToUpdate = {
      status: ADMIN_ROLES_IN_DB.includes(role) ? '관리자' : '활성',
      group_id: parseInt(formData.group_id) || null,
      cell_id: parseInt(formData.cell_id) || null,
      info_last_updated_at: getKoreanTimestamp(),
    };
    await supabaseAdmin.from('profiles').update(profileDataToUpdate).eq('user_id', userId);

    // 4. 새로운 책임 정보 할당
    if (role === '목회자' && formData.responsible_group_id) {
        await supabaseAdmin.from('hub_groups').update({ pastor_id: userId }).eq('id', formData.responsible_group_id);
    }
    if (role === '그룹장' && formData.responsible_group_id) {
        await supabaseAdmin.from('hub_groups').update({ group_leader_id: userId }).eq('id', formData.responsible_group_id);
    }
    if (role === '다락방장' && formData.responsible_cell_id) {
        await supabaseAdmin.from('hub_cells').update({ cell_leader_id: userId }).eq('id', formData.responsible_cell_id);
    }
    
    // 5. admin_roles 테이블 재설정
    await supabaseAdmin.from('admin_roles').delete().eq('user_id', userId);
    if (role && ALL_ROLES.includes(role)) {
        const { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', role).single();
        if (roleData) {
            await supabaseAdmin.from('admin_roles').insert({ user_id: userId, role_id: roleData.id });
        }
    }

    res.status(200).json({ message: '정보가 성공적으로 업데이트되었습니다.' });

  } catch (error: any) {
    console.error('Error in /api/user/update-profile:', error);
    res.status(500).json({ message: '정보 업데이트 중 오류가 발생했습니다.', details: error.message });
  }
}