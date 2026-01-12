import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: '로그인이 필요합니다.' });

  const { phrase } = req.body;

  // 1. 문구 검증
  if (phrase !== '허브 리더십입니다.') {
    return res.status(400).json({ error: '인증 문구가 올바르지 않습니다.' });
  }

  try {
    // 2. '리더십' 역할 ID 조회
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', '리더십')
      .single();

    if (!roleData) return res.status(500).json({ error: '시스템에 리더십 역할이 없습니다.' });

    // 3. 역할 부여 (이미 있으면 무시)
    const { error } = await supabaseAdmin
      .from('admin_roles')
      .insert({ user_id: session.user.id, role_id: roleData.id })
      .select()
      .single();

    // 중복 에러(23505)는 성공으로 간주
    if (error && error.code !== '23505') {
      console.error(error);
      return res.status(500).json({ error: '권한 부여 실패' });
    }

    return res.status(200).json({ message: '리더십으로 권한이 설정되었습니다.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error' });
  }
}