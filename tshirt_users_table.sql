-- 티셔츠 유저 테이블 생성
CREATE TABLE tshirt_users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  community VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책 설정 (보안)
ALTER TABLE tshirt_users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 레코드만 읽을 수 있도록 설정
CREATE POLICY "사용자가 자신의 데이터만 읽기" ON tshirt_users
  FOR SELECT USING (auth.uid()::text = phone_number);

-- 모든 사용자가 회원가입 가능하도록 설정
CREATE POLICY "회원가입 허용" ON tshirt_users
  FOR INSERT WITH CHECK (true);

-- 사용자가 자신의 데이터만 수정할 수 있도록 설정
CREATE POLICY "사용자가 자신의 데이터만 수정" ON tshirt_users
  FOR UPDATE USING (auth.uid()::text = phone_number); 