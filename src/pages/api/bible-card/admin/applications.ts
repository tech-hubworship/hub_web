// 파일 경로: src/pages/api/bible-card/admin/applications.ts
// 관리자: 말씀카드 신청 목록 조회 API

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
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const {
      page = '1',
      limit = '20',
      status,
      community,
      search,
      pastor_id,
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // 전체 개수 조회
    let countQuery = supabaseAdmin
      .from('bible_card_applications')
      .select('id', { count: 'exact', head: true });

    if (status && typeof status === 'string') {
      countQuery = countQuery.eq('status', status);
    }
    if (community && typeof community === 'string') {
      countQuery = countQuery.eq('community', community);
    }
    if (pastor_id && typeof pastor_id === 'string') {
      countQuery = countQuery.eq('assigned_pastor_id', pastor_id);
    }
    if (search && typeof search === 'string') {
      countQuery = countQuery.ilike('name', `%${search}%`);
    }

    const { count } = await countQuery;

    // 데이터 조회
    let query = supabaseAdmin
      .from('bible_card_applications')
      .select(`
        *,
        hub_groups:group_id(id, name, pastor_id),
        hub_cells:cell_id(id, name),
        pastor:assigned_pastor_id(user_id, name, email),
        user_profile:user_id(birth_date, gender)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    if (community && typeof community === 'string') {
      query = query.eq('community', community);
    }
    if (pastor_id && typeof pastor_id === 'string') {
      query = query.eq('assigned_pastor_id', pastor_id);
    }
    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
    }

    // 데이터 정리
    const applications = data.map((app: any) => ({
      ...app,
      group_name: app.hub_groups?.name,
      group_pastor_id: app.hub_groups?.pastor_id,
      cell_name: app.hub_cells?.name,
      pastor_name: app.pastor?.name,
      pastor_email: app.pastor?.email,
      birth_date: app.user_profile?.birth_date,
      gender: app.user_profile?.gender,
      hub_groups: undefined,
      hub_cells: undefined,
      pastor: undefined,
      user_profile: undefined,
    }));

    return res.status(200).json({
      data: applications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      }
    });
  } catch (error) {
    console.error('Error in applications API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

