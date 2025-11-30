/**
 * 사용자 본인의 문의사항 목록 조회 API
 * 
 * GET /api/tech-inquiries/my-inquiries - 로그인한 사용자의 문의사항 목록 조회
 * 
 * @author HUB Development Team
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 로그인 확인
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ 
        error: '로그인이 필요합니다.' 
      });
    }

    const userId = session.user.id;

    // 사용자 본인의 문의사항만 조회
    const { data, error } = await supabaseAdmin
      .from('tech_inquiries')
      .select('id, message, inquiry_type, status, admin_response, response_at, created_at, page_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('문의사항 조회 오류:', error);
      return res.status(500).json({ error: '문의사항 조회에 실패했습니다.' });
    }

    return res.status(200).json({
      success: true,
      data: data?.map(inquiry => ({
        ...inquiry,
        has_response: !!inquiry.admin_response
      })) || []
    });
  } catch (error) {
    console.error('My Inquiries API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

