/**
 * 테크팀 문의사항 API
 * 
 * POST /api/tech-inquiries - 새로운 문의사항 등록
 * GET /api/tech-inquiries - 문의사항 목록 조회 (관리자 전용)
 * 
 * @author HUB Development Team
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Tech Inquiries API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

/**
 * 새로운 문의사항 등록 (익명 허용)
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { message, inquiryType = 'general', pageUrl } = req.body;

  // 입력 검증
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: '메시지를 입력해주세요.' });
  }

  if (message.trim().length > 5000) {
    return res.status(400).json({ error: '메시지는 5000자를 초과할 수 없습니다.' });
  }

  // 사용자 정보 수집
  const userAgent = req.headers['user-agent'] || null;
  const userIp = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    null;

  // 중복 제출 체크 (5분 내 동일 IP에서 동일 메시지)
  if (userIp) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentInquiries, error: checkError } = await supabase
      .from('tech_inquiries')
      .select('id')
      .eq('user_ip', userIp)
      .eq('message', message.trim())
      .gte('created_at', fiveMinutesAgo);

    if (!checkError && recentInquiries && recentInquiries.length > 0) {
      return res.status(429).json({ 
        error: '동일한 문의사항을 이미 제출하셨습니다. 잠시 후 다시 시도해주세요.' 
      });
    }
  }

  // 문의사항 저장
  const { data, error } = await supabase
    .from('tech_inquiries')
    .insert({
      message: message.trim(),
      inquiry_type: inquiryType,
      user_agent: userAgent,
      user_ip: userIp,
      page_url: pageUrl || null,
      status: 'new'
    })
    .select()
    .single();

  if (error) {
    console.error('문의사항 저장 오류:', error);
    return res.status(500).json({ 
      error: '문의사항 저장에 실패했습니다.',
      details: error.message
    });
  }

  return res.status(201).json({
    success: true,
    message: '문의사항이 성공적으로 전송되었습니다.',
    data
  });
}

/**
 * 문의사항 목록 조회 (관리자 전용)
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  // 관리자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.isAdmin) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { 
    limit = '50', 
    offset = '0', 
    status,
    stats 
  } = req.query;

  // 통계만 조회
  if (stats === 'true') {
    const { data: allInquiries, error: statsError } = await supabase
      .from('tech_inquiries')
      .select('*');

    if (statsError) {
      console.error('통계 조회 오류:', statsError);
      return res.status(500).json({ error: '통계 조회에 실패했습니다.' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total_count: allInquiries?.length || 0,
      new_count: allInquiries?.filter(i => i.status === 'new').length || 0,
      in_progress_count: allInquiries?.filter(i => i.status === 'in_progress').length || 0,
      resolved_count: allInquiries?.filter(i => i.status === 'resolved').length || 0,
      bug_count: allInquiries?.filter(i => i.inquiry_type === 'bug').length || 0,
      suggestion_count: allInquiries?.filter(i => i.inquiry_type === 'suggestion').length || 0,
      today_count: allInquiries?.filter(i => new Date(i.created_at) >= today).length || 0,
      this_week_count: allInquiries?.filter(i => new Date(i.created_at) >= weekAgo).length || 0,
    };

    return res.status(200).json({
      success: true,
      stats
    });
  }

  // 문의사항 목록 조회
  let query = supabase
    .from('tech_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('문의사항 조회 오류:', error);
    return res.status(500).json({ error: '문의사항 조회에 실패했습니다.' });
  }

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      total: data?.length || 0
    }
  });
}

