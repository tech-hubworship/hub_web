// 파일 경로: src/pages/api/signup/groups.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('hub_groups')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[API ERROR] Supabase 조회 오류:', error);
      throw error;
    }

    res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error('[API CRITICAL] /api/signup/groups 처리 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.', details: error.message });
  }
}
