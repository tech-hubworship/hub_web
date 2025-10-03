// 파일 경로: src/pages/api/user/status.ts

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
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    // 1. 'hub_groups' 테이블이 마지막으로 리셋(재생성)된 시점을 가져옵니다.
    //    가장 먼저 만들어진 그룹(id가 가장 작은)의 생성 시간이 기준이 됩니다.
    const { data: groupCreationTime, error: groupError } = await supabaseAdmin
      .from('hub_groups')
      .select('created_at')
      .order('id', { ascending: true }) // id가 가장 작은 것이 최초 데이터
      .limit(1)
      .single();

    // 그룹 테이블에 데이터가 하나도 없으면, 업데이트할 필요가 없으므로 false를 반환합니다.
    if (groupError || !groupCreationTime) {
      return res.status(200).json({ needsUpdate: false });
    }
    const groupsLastResetAt = new Date(groupCreationTime.created_at);

    // 2. 현재 로그인한 사용자의 '마지막 정보 업데이트 시간'을 가져옵니다.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('info_last_updated_at')
      .eq('user_id', userId)
      .single();

    // 프로필이 없는 신규 사용자는 업데이트가 필요 없습니다.
    if (profileError || !profile) {
      return res.status(200).json({ needsUpdate: false });
    }
    const userInfoLastUpdatedAt = new Date(profile.info_last_updated_at);

    // 3. 두 시간을 비교하여 정보 업데이트 필요 여부를 결정합니다.
    //    사용자의 정보 업데이트 시간이 그룹 생성 시간보다 오래되었으면(이전이면) 업데이트가 필요합니다.
    const needsUpdate = userInfoLastUpdatedAt < groupsLastResetAt;

    res.status(200).json({ needsUpdate });

  } catch (error: any) {
    console.error('Error in /api/user/status:', error);
    res.status(500).json({ message: '사용자 상태 확인 중 오류 발생', details: error.message });
  }
}