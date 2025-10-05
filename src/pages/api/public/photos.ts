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

  const { folder_id, page = 1, limit = 50 } = req.query;

  try {
    let query = supabaseClient
      .from('photos')
      .select(`
        id,
        title,
        description,
        image_url,
        thumbnail_url,
        file_size,
        width,
        height,
        file_format,
        created_at,
        photo_folders!inner(id, name, is_public)
      `)
      .eq('is_active', true)
      .eq('photo_folders.is_public', true); // 공개 폴더의 사진만 조회

    if (folder_id) {
      query = query.eq('folder_id', folder_id);
    }

    // 페이지네이션
    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error } = await query;

    if (error) {
      console.error('사진 조회 오류:', error);
      return res.status(500).json({ error: '사진 조회 실패' });
    }

    // Google Drive URL 변환 함수
    const convertGoogleDriveUrl = (url: string) => {
      if (url.includes('drive.google.com/file/d/')) {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
      }
      return url;
    };

    // 사진 데이터에 변환된 URL 추가
    const photosWithConvertedUrls = (data || []).map(photo => ({
      ...photo,
      image_url: convertGoogleDriveUrl(photo.image_url),
      thumbnail_url: photo.thumbnail_url ? convertGoogleDriveUrl(photo.thumbnail_url) : null
    }));

    return res.status(200).json({ 
      photos: photosWithConvertedUrls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: photosWithConvertedUrls.length
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
