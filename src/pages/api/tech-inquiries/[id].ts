/**
 * 테크팀 문의사항 상세/수정/삭제 API
 * 
 * GET /api/tech-inquiries/[id] - 특정 문의사항 조회
 * PATCH /api/tech-inquiries/[id] - 문의사항 상태 업데이트 (관리자 전용)
 * DELETE /api/tech-inquiries/[id] - 문의사항 삭제 (관리자 전용)
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
  const { id } = req.query;
  const { method } = req;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: '유효하지 않은 ID입니다.' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, parseInt(id));
      case 'PATCH':
        return await handlePatch(req, res, parseInt(id));
      case 'DELETE':
        return await handleDelete(req, res, parseInt(id));
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Tech Inquiry Detail API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

/**
 * 특정 문의사항 조회 (관리자 전용)
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  id: number
) {
  // 관리자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.isAdmin) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { data, error } = await supabaseAdmin
    .from('tech_inquiries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('문의사항 조회 오류:', error);
    return res.status(404).json({ error: '문의사항을 찾을 수 없습니다.' });
  }

  return res.status(200).json({
    success: true,
    data
  });
}

/**
 * 문의사항 상태 업데이트 (관리자 전용)
 */
async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  id: number
) {
  // 관리자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.isAdmin) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { status, adminNote, inquiryType } = req.body;

  const updateData: any = {};

  if (status) {
    if (!['new', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태입니다.' });
    }
    updateData.status = status;

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
  }

  if (adminNote !== undefined) {
    updateData.admin_note = adminNote;
  }

  if (inquiryType) {
    if (!['bug', 'inquiry', 'suggestion', 'general'].includes(inquiryType)) {
      return res.status(400).json({ error: '유효하지 않은 문의 유형입니다.' });
    }
    updateData.inquiry_type = inquiryType;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: '업데이트할 내용이 없습니다.' });
  }

  const { data, error } = await supabaseAdmin
    .from('tech_inquiries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('문의사항 업데이트 오류:', error);
    return res.status(500).json({ error: '문의사항 업데이트에 실패했습니다.' });
  }

  return res.status(200).json({
    success: true,
    message: '문의사항이 업데이트되었습니다.',
    data
  });
}

/**
 * 문의사항 삭제 (관리자 전용)
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: number
) {
  // 관리자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.isAdmin) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { error } = await supabaseAdmin
    .from('tech_inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('문의사항 삭제 오류:', error);
    return res.status(500).json({ error: '문의사항 삭제에 실패했습니다.' });
  }

  return res.status(200).json({
    success: true,
    message: '문의사항이 삭제되었습니다.'
  });
}

