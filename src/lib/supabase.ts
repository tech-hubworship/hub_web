/**
 * Supabase 클라이언트 설정
 * 환경 변수에서 Supabase 설정을 가져와 클라이언트를 초기화합니다.
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. 서버(API Route)에서만 사용할 관리자용 클라이언트 (RLS 정책 우회)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_KEY를 확인하세요.');
}

// 서버 사이드용 클라이언트 (서비스 역할 키 사용)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseServiceKey || supabaseAnonKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // 💡 수정: 서버용 클라이언트에도 동일하게 스키마 설정을 추가합니다.
    db: {
      schema: 'public',
    }
  }
);

// 에러 핸들링 유틸 함수 (400 에러 시 팝업)
export async function safeInsert(table: string, data: any) {
  const { data: inserted, error } = await supabase.from(table).insert(data);
  if (error) {
    // PGRST301 은 이미 존재하는 PK 때문에 발생
    if (error.code === 'PGRST301') {
      alert(`데이터를 저장할 수 없습니다.\n사유: ${error.message}`);
    } else {
      console.error('Supabase Insert Error:', error);
      alert(`데이터 저장 중 오류가 발생했습니다.\n사유: ${error.message}`);
    }
    return null;
  }
  return inserted;
}

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