/**
 * 문의사항 API 라우트
 * GET: 문의사항 목록 조회 (관리자만)
 * POST: 문의사항 생성
 * PUT: 문의사항 상태 업데이트 (관리자용)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, InquiryTable } from '@src/lib/supabase';

// 문의사항 타입 정의 (Supabase 타입 사용)
type Inquiry = InquiryTable;

// GET: 문의사항 목록 조회 (관리자용)
export async function getInquiries(): Promise<Inquiry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('문의사항 조회 에러:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getInquiries 에러:', error);
    return [];
  }
}

// POST: 문의사항 생성
export async function createInquiry(data: {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<Inquiry> {
  // query 함수 대신 Supabase ORM의 insert 메소드를 사용하도록 수정
  const { data: newInquiry, error } = await supabaseAdmin
    .from('inquiries')
    .insert({
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return newInquiry;
}

// PUT: 문의사항 상태 업데이트 (관리자용)
export async function updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
  // query 함수 대신 Supabase ORM의 update 메소드를 사용하도록 수정
  const { data: updatedInquiry, error } = await supabaseAdmin
    .from('inquiries')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return updatedInquiry;
}

// API 핸들러
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // TODO: 관리자 인증 추가
        const inquiries = await getInquiries();
        res.status(200).json({
          success: true,
          data: inquiries
        });
        break;
        
      case 'POST':
        const newInquiry = await createInquiry(req.body);
        res.status(201).json({
          success: true,
          data: newInquiry,
          message: '문의사항이 성공적으로 등록되었습니다.'
        });
        break;
        
      case 'PUT':
        // TODO: 관리자 인증 추가
        const { id, status } = req.body;
        if (!id || !status) {
          return res.status(400).json({
            success: false,
            message: 'ID와 status가 필요합니다.'
          });
        }
        
        const updatedInquiry = await updateInquiryStatus(id, status);
        res.status(200).json({
          success: true,
          data: updatedInquiry
        });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Inquiries API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}