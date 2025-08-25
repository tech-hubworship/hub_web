import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
); 