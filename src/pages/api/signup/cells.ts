// 파일 경로: src/pages/api/cells.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('\n--- [API LOG] /api/cells 호출됨 ---');
  if (req.method !== 'GET') {
    console.log(`[API LOG] 허용되지 않은 메서드: ${req.method}`);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { groupId } = req.query;
  console.log(`[API LOG] 요청받은 groupId: ${groupId}`);

  if (!groupId) {
    console.log('[API WARN] groupId가 요청에 포함되지 않았습니다.');
    return res.status(400).json({ success: false, message: 'groupId가 필요합니다.' });
  }

  try {
    console.log(`[API LOG] Supabase에서 groupId=${groupId}에 대한 다락방 목록 조회를 시작합니다.`);
    const { data, error } = await supabaseAdmin
      .from('hub_cells')
      .select('id, name')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('[API ERROR] Supabase 조회 오류:', error);
      throw error;
    }

    console.log(`[API LOG] Supabase 조회 성공. ${data.length}개의 다락방을 반환합니다.`);
    console.log('[API LOG] 반환 데이터:', data);
    res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error(`[API CRITICAL] /api/cells (groupId=${groupId}) 처리 중 심각한 오류 발생:`, error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.', details: error.message });
  }
}