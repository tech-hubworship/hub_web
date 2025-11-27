import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { group_id } = req.query;

  if (!group_id) {
    return res.status(400).json({ error: 'group_id가 필요합니다.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('hub_cells')
      .select('id, name, hub_group_id')
      .eq('hub_group_id', group_id)
      .order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('cell list error', err);
    return res.status(500).json({ error: '셀 목록 조회 실패' });
  }
}
