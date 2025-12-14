// 파일 경로: src/pages/api/bible-card/pastor/assigned.ts
// 목회자: 배정된 지체 목록 조회 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
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

    // 목회자 권한 확인
    const userRoles = session.user.roles || [];
    if (!userRoles.includes('목회자')) {
      return res.status(403).json({ error: '목회자 권한이 필요합니다.' });
    }

    const pastorId = session.user.id;
    const { status, page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;
    const searchQuery = search && typeof search === 'string' ? search.trim() : '';

    // 전체 개수 조회
    let countQuery = supabaseAdmin
      .from('bible_card_applications')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_pastor_id', pastorId);

    if (status && typeof status === 'string') {
      countQuery = countQuery.eq('status', status);
    }

    // 검색 조건 추가 (이름, 말씀 본문, 구절 참조)
    if (searchQuery) {
      countQuery = countQuery.or(`name.ilike.%${searchQuery}%,bible_verse.ilike.%${searchQuery}%,bible_verse_reference.ilike.%${searchQuery}%`);
    }

    const { count } = await countQuery;

    // 배정된 지체 조회
    let query = supabaseAdmin
      .from('bible_card_applications')
      .select(`
        *,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name),
        user_profile:user_id(birth_date, gender)
      `)
      .eq('assigned_pastor_id', pastorId)
      .order('assigned_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // 검색 조건 추가 (이름, 말씀 본문, 구절 참조)
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,bible_verse.ilike.%${searchQuery}%,bible_verse_reference.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assigned applications:', error);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    // 데이터 정리
    const applications = data?.map((app: any) => ({
      ...app,
      group_name: app.hub_groups?.name,
      cell_name: app.hub_cells?.name,
      birth_date: app.user_profile?.birth_date,
      gender: app.user_profile?.gender,
      hub_groups: undefined,
      hub_cells: undefined,
      user_profile: undefined,
    }));

    // 통계
    const { data: allAssigned } = await supabaseAdmin
      .from('bible_card_applications')
      .select('status')
      .eq('assigned_pastor_id', pastorId);

    const stats = {
      total: allAssigned?.length || 0,
      assigned: allAssigned?.filter(a => a.status === 'assigned').length || 0,
      completed: allAssigned?.filter(a => a.status === 'completed').length || 0,
      delivered: allAssigned?.filter(a => a.status === 'delivered').length || 0,
    };

    return res.status(200).json({
      data: applications,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      }
    });
  } catch (error) {
    console.error('Error in assigned API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

