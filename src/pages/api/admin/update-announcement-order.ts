import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { announcement1, announcement2 } = req.body;

    // 두 공지사항의 순서를 동시에 업데이트
    const { error } = await supabase.rpc('update_announcement_order', {
      p_announcement1_id: announcement1.id,
      p_announcement1_order: announcement1.display_order,
      p_announcement2_id: announcement2.id,
      p_announcement2_order: announcement2.display_order
    });

    if (error) throw error;

    res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating announcement order:', error);
    res.status(500).json({ message: 'Error updating announcement order' });
  }
} 