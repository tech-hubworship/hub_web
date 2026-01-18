// 파일 경로: src/pages/api/bible-card/admin/export-csv.ts
// 관리자: CSV 내보내기 API

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

    const { status, pastor_id, search } = req.query;

    // 데이터 조회
    let query = supabaseAdmin
      .from('bible_card_applications')
      .select(`
        id,
        name,
        community,
        prayer_request,
        bible_verse,
        bible_verse_reference,
        pastor_message,
        status,
        drive_link_1,
        drive_link_2,
        created_at,
        completed_at,
        hub_groups:group_id(name),
        hub_cells:cell_id(name),
        pastor:assigned_pastor_id(name)
      `)
      .order('created_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    if (pastor_id && typeof pastor_id === 'string') {
      query = query.eq('assigned_pastor_id', pastor_id);
    }
    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching data for CSV:', error);
      return res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }

    // CSV 헤더
    const headers = [
      'ID',
      '이름',
      '공동체',
      '그룹',
      '다락방',
      '기도제목',
      '성경구절',
      '말씀본문',
      '목회자메시지',
      '담당목회자',
      '상태',
      '링크1',
      '링크2',
      '신청일',
      '완료일'
    ];

    // CSV 데이터 생성
    const csvRows = [headers.join(',')];
    
    data?.forEach((row: any) => {
      const values = [
        row.id,
        `"${(row.name || '').replace(/"/g, '""')}"`,
        `"${(row.community || '').replace(/"/g, '""')}"`,
        `"${(row.hub_groups?.name || '').replace(/"/g, '""')}"`,
        `"${(row.hub_cells?.name || '').replace(/"/g, '""')}"`,
        `"${(row.prayer_request || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(row.bible_verse_reference || '').replace(/"/g, '""')}"`,
        `"${(row.bible_verse || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(row.pastor_message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(row.pastor?.name || '').replace(/"/g, '""')}"`,
        row.status,
        row.drive_link_1 || '',
        row.drive_link_2 || '',
        row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '',
        row.completed_at ? new Date(row.completed_at).toLocaleDateString('ko-KR') : '',
      ];
      csvRows.push(values.join(','));
    });

    const csv = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=bible-cards-${new Date().toISOString().split('T')[0]}.csv`);
    
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error in export-csv API:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

