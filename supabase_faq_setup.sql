-- Supabase에 FAQ 테이블 생성 쿼리
CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  tag VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  contents TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 FAQ 데이터 추가
INSERT INTO faqs (tag, title, contents, display_order, is_visible) VALUES
('접수', '1. 허브업 신청을 취소하고싶어요', '신청 시 입력한 이메일로 전송된 확인 메일 또는 문자 메시지 내 ''신청 취소'' 링크를 클릭해주세요.또는 [허브업 문의 페이지]를 통해 직접 요청하실 수 있습니다.', 1, true),
('차량', '2. 차량 시간을 변경하고 싶어요.', '신청 시 입력한 이메일로 전송된 확인 메일 또는 문자 메시지 내 ''신청 취소'' 링크를 클릭해주세요.또는 [허브업 문의 페이지]를 통해 직접 요청하실 수 있습니다.', 2, true),
('회비', '3. 부분 참석시 회비 할인이 되나요?', '신청 시 입력한 이메일로 전송된 확인 메일 또는 문자 메시지 내 ''신청 취소'' 링크를 클릭해주세요.또는 [허브업 문의 페이지]를 통해 직접 요청하실 수 있습니다.', 3, true); 