-- Supabase에 admin_users(관리자 사용자) 테이블 생성 쿼리
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책 설정
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 관리자 자신의 정보만 조회 가능하도록 설정
CREATE POLICY "admin_users_select_policy" ON admin_users
  FOR SELECT USING (auth.uid()::text = phone_number);

-- 관리자 로그인 검증용 샘플 데이터 추가
INSERT INTO admin_users (phone_number, password, name, role)
VALUES ('01012345678', 'admin1234', '관리자', 'admin');

-- RLS 정책 우회 함수 (관리자 로그인 및 인증에 사용)
CREATE OR REPLACE FUNCTION admin_login(p_phone VARCHAR, p_password VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE phone_number = p_phone 
    AND password = p_password
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$; 