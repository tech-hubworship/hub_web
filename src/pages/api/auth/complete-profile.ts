// 파일 경로: /api/auth/complete-profile.ts

import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';
import { NextApiRequest, NextApiResponse } from 'next';

// 프론트엔드 역할 이름과 DB의 'roles' 테이블 이름을 매핑합니다.
const ADMIN_ROLE_MAP: { [key: string]: string } = {
    'MC': 'MC',
    '목회자': '목회자',
    '그룹장': '그룹장',
    '다락방장': '다락방장'
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session?.user?.id || !session.user.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { 
    name, birth_date, gender, community, role,
    group_id, cell_id, 
    responsible_group_id, responsible_cell_id,
    completeGroup 
  } = req.body;

  // --- 1. 유효성 검사 ---
  // completeGroup이 있으면 이름/성별은 선택사항 (기존 프로필 정보 사용)
  if (!completeGroup && (!name || !birth_date || !gender)) {
    return res.status(400).json({ message: '이름, 생년월일, 성별 정보는 필수입니다.' });
  }

  // completeGroup이 있으면 기존 프로필 정보를 가져와서 사용
  let existingProfile = null;
  if (completeGroup) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, birth_date, gender, community')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      return res.status(400).json({ message: '기존 프로필 정보를 찾을 수 없습니다.' });
    }
    existingProfile = profile;
  }

  try {
    // --- 2. 프로필 정보 구성 ---
    // completeGroup이 있으면 기존 프로필 정보 사용, 없으면 요청 본문 사용
    const finalName = completeGroup ? (existingProfile?.name || name) : name;
    const finalBirthDate = completeGroup ? (existingProfile?.birth_date || birth_date) : birth_date;
    const finalGender = completeGroup ? (existingProfile?.gender || gender) : gender;
    const finalCommunity = completeGroup ? (existingProfile?.community || community) : community;
    
    const profileDataToUpsert = {
        user_id: userId,
        email: session.user.email,
        name: finalName,
        birth_date: finalBirthDate,
        gender: finalGender,
        community: finalCommunity,
        status: (role && (ADMIN_ROLE_MAP[role] === 'MC' || ADMIN_ROLE_MAP[role] === '목회자')) ? '관리자' : '활성',
        group_id: finalCommunity === '허브' ? (parseInt(group_id, 10) || null) : null,
        cell_id: finalCommunity === '허브' ? (parseInt(cell_id, 10) || null) : null,
        info_last_updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileDataToUpsert, { onConflict: 'user_id' })
      .select()
      .single();

    if (profileError) throw profileError;

    // --- 3. 역할에 따른 책임 정보 업데이트 ---
    if (role === '목회자' && responsible_group_id) {
      const { error } = await supabaseAdmin
        .from('hub_groups')
        .update({ pastor_id: userId })
        .eq('id', responsible_group_id);
      if (error) throw new Error('목회자 담당 그룹 정보 업데이트에 실패했습니다.');
    }
    if (role === '그룹장' && responsible_group_id) {
      const { error } = await supabaseAdmin
        .from('hub_groups')
        .update({ group_leader_id: userId })
        .eq('id', responsible_group_id);
      if (error) throw new Error('그룹장 담당 그룹 정보 업데이트에 실패했습니다.');
    }
    if (role === '다락방장' && responsible_cell_id) {
      const { error } = await supabaseAdmin
        .from('hub_cells')
        .update({ cell_leader_id: userId })
        .eq('id', responsible_cell_id);
      if (error) throw new Error('다락방장 담당 다락방 정보 업데이트에 실패했습니다.');
    }

    // --- 4. 역할이 있는 경우, admin_roles 테이블에 권한 추가 ---
    const roleName = role && ADMIN_ROLE_MAP[role];
    if (roleName) {
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();
      if (roleError || !roleData) throw new Error(`'${roleName}' 역할을 DB에서 찾을 수 없습니다.`);
      
      await supabaseAdmin.from('admin_roles').insert({ user_id: userId, role_id: roleData.id });
    }

    res.status(200).json({ message: '회원가입이 완료되었습니다.', user: profile });

  } catch (error: any) {
    console.error('Error in complete-profile API:', error);
    res.status(500).json({ message: '프로필 처리 중 오류가 발생했습니다.', details: error.message });
  }
}