// 파일 경로: src/pages/api/bible-card/my-application.ts
// 내 말씀카드 신청 조회 API

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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const userId = session.user.id;

    // 내 신청 조회
    const { data, error } = await supabaseAdmin
      .from('bible_card_applications')
      .select(`
        *,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name),
        pastor:assigned_pastor_id(name, email)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching application:', error);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    // 신청 내역이 없는 경우
    if (!data) {
      // 사용자 프로필 정보 가져오기 (신청 폼 기본값으로 사용)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select(`
          name,
          community,
          group_id,
          cell_id,
          hub_groups:group_id(id, name),
          hub_cells:cell_id(id, name)
        `)
        .eq('user_id', userId)
        .single();

      const profileGroups = profile?.hub_groups as any;
      const profileCells = profile?.hub_cells as any;
      return res.status(200).json({ 
        hasApplication: false,
        profile: profile ? {
          name: profile.name,
          community: profile.community,
          group_id: profile.group_id,
          cell_id: profile.cell_id,
          group_name: profileGroups?.name,
          cell_name: profileCells?.name,
        } : null
      });
    }

    // 신청 내역이 있는 경우
    const dataGroups = data.hub_groups as any;
    const dataCells = data.hub_cells as any;
    const dataPastor = data.pastor as any;
    return res.status(200).json({
      hasApplication: true,
      application: {
        ...data,
        group_name: dataGroups?.name,
        cell_name: dataCells?.name,
        pastor_name: dataPastor?.name,
        hub_groups: undefined,
        hub_cells: undefined,
        pastor: undefined,
      }
    });
  } catch (error) {
    console.error('Error in my-application API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

