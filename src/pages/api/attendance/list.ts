import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  // 권한 체크
  if (!session?.user?.isAdmin && !session?.user?.roles?.includes('MC')) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  const { date, category, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // profiles 테이블과 조인하여 이름 정보를 가져옵니다.
    let query = supabaseAdmin
      .from('weekly_attendance')
      .select(`
        *,
        profiles:user_id (
          name,
          group_id,
          cell_id,
          groups:group_id(name),
          cells:cell_id(name)
        )
      `, { count: 'exact' });

    if (date) query = query.eq('week_date', date);
    if (category) query = query.eq('category', category);

    // 최신순 정렬
    query = query
      .order('attended_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '데이터 조회 실패' });
  }
}