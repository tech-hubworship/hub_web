// 파일 경로: src/pages/api/photos/folder-path.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { folderId } = req.query;

  if (!folderId) {
    return res.status(400).json({ error: '폴더 ID가 필요합니다.' });
  }

  try {
    const path: Array<{ id: number; name: string; parent_id: number | null }> = [];
    let currentId: number | null = parseInt(folderId as string);

    // 재귀적으로 부모 폴더 찾기 (최대 10번 반복으로 무한루프 방지)
    for (let i = 0; i < 10 && currentId !== null; i++) {
      const { data, error } = await supabase
        .from('photo_folders')
        .select('id, name, parent_id')
        .eq('id', currentId)
        .single();

      if (error || !data) {
        break;
      }

      const folder = data as { id: number; name: string; parent_id: number | null };
      path.unshift(folder); // 배열 앞에 추가
      currentId = folder.parent_id;
    }

    return res.status(200).json({ path });
  } catch (error) {
    console.error('Error fetching folder path:', error);
    return res.status(500).json({ error: '폴더 경로 조회 실패' });
  }
}


