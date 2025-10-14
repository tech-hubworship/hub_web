import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/pages/api/auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || !session.user.roles?.includes('사진팀')) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    const { count: photoCount } = await supabaseClient
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: folderCount } = await supabaseClient
      .from('photo_folders')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      photoCount: photoCount || 0,
      folderCount: folderCount || 0,
    });
  } catch (error) {
    console.error('콘텐츠 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}