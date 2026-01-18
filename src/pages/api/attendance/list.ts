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

  const { date, category, group_id, cell_id, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // ---------------------------------------------------------
    // 1. 출석 데이터 조회 (List)
    // ---------------------------------------------------------
    // profiles 테이블과 Inner Join하여 그룹/다락방 필터링 적용
    // profiles!inner 구문을 사용해야 필터링된 유저의 출석만 가져옵니다.
    let query = supabaseAdmin
      .from('weekly_attendance')
      .select(`
        *,
        profiles!inner (
          name,
          group_id,
          cell_id,
          groups:group_id(name),
          cells:cell_id(name)
        )
      `, { count: 'exact' });

    // 기본 필터
    if (date) query = query.eq('week_date', date);
    if (category) query = query.eq('category', category);

    // 그룹/다락방 필터 (profiles 테이블 컬럼 기준)
    if (group_id) query = query.eq('profiles.group_id', group_id);
    if (cell_id) query = query.eq('profiles.cell_id', cell_id);

    // 정렬 및 페이징
    query = query
      .order('attended_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // ---------------------------------------------------------
    // 2. 통계 데이터 계산 (Stats)
    // ---------------------------------------------------------
    // 선택된 필터 조건(그룹/다락방)에 해당하는 "전체 활성 멤버 수" 조회
    let totalMembersQuery = supabaseAdmin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true }) // 데이터 없이 개수만 조회
      .eq('community', '허브')
      .eq('status', '활성'); // 활성 유저만 집계

    if (group_id) totalMembersQuery = totalMembersQuery.eq('group_id', group_id);
    if (cell_id) totalMembersQuery = totalMembersQuery.eq('cell_id', cell_id);

    // OD(리더십)인 경우 리더십 역할을 가진 사람만 세야 정확하겠지만, 
    // 일단 전체 모수를 그룹/다락방 인원으로 잡거나 로직을 추가할 수 있습니다.
    // 여기서는 단순하게 해당 그룹/다락방의 전체 인원으로 계산합니다.
    const { count: totalCount } = await totalMembersQuery;

    // 현재 조건(날짜+카테고리+그룹+다락방)의 실제 출석 수
    // 위 list 쿼리의 count는 페이지네이션 된 개수가 아니라 전체 개수이므로 사용 가능
    const attendedCount = count || 0;

    return res.status(200).json({
      data,
      stats: {
        total_members: totalCount || 0,
        attended_count: attendedCount,
        attendance_rate: totalCount ? Math.round((attendedCount / totalCount) * 100) : 0
      },
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