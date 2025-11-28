import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '@src/lib/supabase';
import { NextApiRequest, NextApiResponse } from 'next';
import { getKoreanTimestamp } from '@src/lib/utils/date';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session?.user?.id || !session.user.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { group_id, cell_id, community, name, birth_date, gender } = req.body;

  try {
    // 프로필 정보 업데이트 (그룹/셀/커뮤니티)
    const profileDataToUpdate: Record<string, any> = {
      info_last_updated_at: getKoreanTimestamp(),
    };

    if (group_id !== undefined) {
      profileDataToUpdate.group_id = group_id ? parseInt(group_id, 10) : null;
    }
    if (cell_id !== undefined) {
      profileDataToUpdate.cell_id = cell_id ? parseInt(cell_id, 10) : null;
    }
    if (community !== undefined) {
      profileDataToUpdate.community = community || null;
    }
    if (name !== undefined) {
      profileDataToUpdate.name = name || null;
    }
    if (birth_date !== undefined) {
      profileDataToUpdate.birth_date = birth_date || null;
    }
    if (gender !== undefined) {
      profileDataToUpdate.gender = gender || null;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileDataToUpdate)
      .eq('user_id', userId)
      .select()
      .single();

    if (profileError) throw profileError;

    res.status(200).json({ 
      message: '그룹/다락방 정보가 성공적으로 업데이트되었습니다.',
      profile 
    });

  } catch (error: any) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ 
      message: '정보 업데이트 중 오류가 발생했습니다.', 
      details: error.message 
    });
  }
}


