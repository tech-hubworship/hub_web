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
      .eq('is_public', true) // 공개 폴더만 조회
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('폴더 조회 오류:', error);
      return res.status(500).json({ error: '폴더 조회 실패' });
    }

    // 각 폴더별로 활성 사진 수 계산
    const foldersWithCount = await Promise.all(
      (data || []).map(async (folder) => {
        const { count } = await supabaseClient
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id)
          .eq('is_active', true);

        return {
          ...folder,
          photo_count: count || 0
        };
      })
    );

    return res.status(200).json({ folders: foldersWithCount });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
