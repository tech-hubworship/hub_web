// Supabase 테이블 정의
export interface LostItem {
  id: number;
  name: string;
  description: string;
  location: string;
  found_date: string;
  status: string;
  image_url?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
} 