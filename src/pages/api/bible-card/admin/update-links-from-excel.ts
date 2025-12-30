// 파일 경로: src/pages/api/bible-card/admin/update-links-from-excel.ts
// 관리자: 엑셀 데이터로 drive_link_1 업데이트 API

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

interface UpdateLink {
  id: number;
  drive_link: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    const { data }: { data: UpdateLink[] } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: '업데이트할 데이터가 없습니다.' });
    }

    // 각 ID별로 업데이트
    const updatePromises = data.map(async (item) => {
      const { error } = await supabaseAdmin
        .from('bible_card_applications')
        .update({
          drive_link_1: item.drive_link.trim(),
          links_added_at: new Date().toISOString(),
          status: 'delivered', // 링크가 추가되면 전달 완료 상태로
        })
        .eq('id', item.id);

      if (error) {
        console.error(`Error updating application ${item.id}:`, error);
        return { id: item.id, success: false, error: error.message };
      }

      return { id: item.id, success: true };
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const failures = results.filter(r => !r.success);

    return res.status(200).json({
      success: true,
      total: data.length,
      successCount,
      failureCount,
      failures,
    });
  } catch (error: any) {
    console.error('Error in update-links-from-excel API:', error);
    return res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}




