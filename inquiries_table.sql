-- Supabase에 inquiries(문의사항) 테이블 생성 쿼리
CREATE TABLE inquiries (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'answered')),
  reply TEXT,
  reply_at TIMESTAMP WITH TIME ZONE
);

-- RLS 정책 설정
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 문의사항을 등록할 수 있도록 설정
CREATE POLICY "inquiries_insert_policy" ON inquiries
  FOR INSERT WITH CHECK (true);

-- 관리자만 문의사항을 읽을 수 있도록 설정 (여기서는 auth.role() 함수를 예시로 사용)
CREATE POLICY "inquiries_select_policy" ON inquiries
  FOR SELECT USING (auth.uid() IN (
    SELECT uid FROM auth.users WHERE role = 'admin'
  ));

-- 관리자만 문의사항을 업데이트할 수 있도록 설정
CREATE POLICY "inquiries_update_policy" ON inquiries
  FOR UPDATE USING (auth.uid() IN (
    SELECT uid FROM auth.users WHERE role = 'admin'
  ));

-- 관리자만 문의사항을 삭제할 수 있도록 설정
CREATE POLICY "inquiries_delete_policy" ON inquiries
  FOR DELETE USING (auth.uid() IN (
    SELECT uid FROM auth.users WHERE role = 'admin'
  ));

-- 테이블 생성 함수 (클라이언트에서 호출 가능하도록 RPC 함수로 생성)
CREATE OR REPLACE FUNCTION create_inquiries_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inquiries'
  ) THEN
    CREATE TABLE inquiries (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'answered')),
      reply TEXT,
      reply_at TIMESTAMP WITH TIME ZONE
    );
    
    -- RLS 정책 설정
    ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
    
    -- 모든 사용자가 문의사항을 등록할 수 있도록 설정
    CREATE POLICY "inquiries_insert_policy" ON inquiries
      FOR INSERT WITH CHECK (true);
  END IF;
END;
$$; 