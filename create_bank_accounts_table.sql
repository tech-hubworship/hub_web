-- bank_accounts 테이블을 생성하는 SQL

-- 계좌 정보 테이블 생성
CREATE TABLE bank_accounts (
  id SERIAL PRIMARY KEY,
  bank VARCHAR(50) NOT NULL,
  account VARCHAR(50) NOT NULL,
  holder VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 입력
INSERT INTO bank_accounts (bank, account, holder) 
VALUES ('카카오뱅크', '3333063840721', '이지선');

-- 권한 설정
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 부여 (모든 사용자가 계좌 정보를 조회할 수 있도록)
CREATE POLICY "bank_accounts_read_policy" ON bank_accounts
  FOR SELECT USING (true);
