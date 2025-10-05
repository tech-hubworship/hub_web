import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 서비스 키를 사용한 Supabase 클라이언트 (RLS 우회)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  const { folderId } = req.query;

  if (!folderId || typeof folderId !== 'string') {
    return res.status(400).json({ error: '폴더 ID가 필요합니다.' });
  }

  try {
    const { data, error } = await supabaseClient
      .from('photo_folders')
      .select(`
        id,
        name,
        description,
        is_public,
        order_index,
        created_at
      `)
      .eq('id', folderId)
      .eq('is_public', true) // 공개 폴더만 조회
      .single();

    if (error) {
      console.error('폴더 조회 오류:', error);
      return res.status(404).json({ error: '폴더를 찾을 수 없습니다.' });
    }

    return res.status(200).json({ folder: data });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
