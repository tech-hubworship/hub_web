import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

// 모든 관리자에서 사용 가능 (권한 체크 필요하면 추가)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabaseAdmin
      .from('hub_groups')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('group list error', err);
    return res.status(500).json({ error: '그룹 목록 조회 실패' });
  }
}
