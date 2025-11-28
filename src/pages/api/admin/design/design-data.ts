// 파일 경로: /pages/api/admin/design-data.ts

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

  // ⭐️ [핵심] 1. 관리자인지 확인
  // @ts-ignore
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: You are not an admin.' });
  }

  // 메뉴 권한 확인
  const { getMenuIdFromPath, checkMenuPermission } = await import('@src/lib/utils/menu-permission');
  // @ts-ignore
  const userRoles = session.user.roles || [];
  const menuId = getMenuIdFromPath(req.url || '/api/admin/design/design-data');
  const permission = await checkMenuPermission(userRoles, menuId);
  
  if (!permission.hasPermission) {
    return res.status(403).json({ message: permission.error || 'Forbidden: You do not have permission.' });
  }

  try {
    // 여기에 '디자인팀'만 볼 수 있는 데이터를 DB에서 조회하는 로직을 넣습니다.
    // 예시: '말씀카드' 관련 설문조사(survey_id=2)의 응답을 가져옵니다.
    const { data, error } = await supabaseAdmin
        .from('survey_responses')
        .select(`
            response_data,
            profiles ( name, email )
        `)
        .eq('survey_id', 2) // "말씀카드 설문"의 ID가 2라고 가정
        .order('created_at');

    if (error) throw error;
    
    // 성공 시 데이터 반환
    res.status(200).json(data);

  } catch (error: any) {
    console.error('Error fetching design data:', error);
    res.status(500).json({ message: 'Failed to fetch design data', details: error.message });
  }
}