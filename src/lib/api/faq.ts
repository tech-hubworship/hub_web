import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// FAQ 모델 인터페이스
export interface FaqItem {
  id: number;
  tag: string;
  title: string;
  contents: string;
  display_order: number;
  is_visible: boolean;
  created_at?: string;
}

// 메인 페이지에 표시할 FAQ 목록 가져오기
export async function getMainPageFaqs(): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .limit(3);
  
  if (error) {
    console.error('FAQ 데이터 로드 오류:', error);
    return [];
  }
  
  return data || [];
}

// 모든 FAQ 목록 가져오기
export async function getAllFaqs(): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('FAQ 데이터 로드 오류:', error);
    return [];
  }
  
  return data || [];
}

// FAQ 검색하기
export async function searchFaqs(query: string): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_visible', true)
    .or(`title.ilike.%${query}%,contents.ilike.%${query}%`)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('FAQ 검색 오류:', error);
    return [];
  }
  
  return data || [];
} 