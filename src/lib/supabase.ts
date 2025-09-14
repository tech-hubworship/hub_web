/**
 * Supabase 클라이언트 설정
 * 환경 변수에서 Supabase 설정을 가져와 클라이언트를 초기화합니다.
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_KEY를 확인하세요.');
}

// Supabase 클라이언트 생성
export const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!
);

// 서버 사이드용 클라이언트 (서비스 역할 키 사용)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseServiceKey || supabaseAnonKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 테이블 타입 정의
export interface DownloadsTable {
  id: number;
  key: string;
  remaining_count: number;
  created_at: string;
  updated_at: string;
}

// 다운로드 관련 타입
export interface DownloadStats {
  id: number;
  wallpaper_id: number;
  user_ip: string | null;
  user_agent: string | null;
  downloaded_at: string;
}

export interface AnnouncementTable {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  is_active: boolean;
  order_index: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface FAQTable {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryTable {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}
