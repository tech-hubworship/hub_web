# Tech Inquiries 피드백 기능 마이그레이션

## 개요
문의사항 시스템에 관리자 피드백 기능을 추가하는 마이그레이션입니다.

## 변경 사항

### 데이터베이스 스키마 변경
- `admin_response` (TEXT): 관리자가 사용자에게 보내는 피드백/답변
- `response_at` (TIMESTAMP): 피드백 작성 시간
- `response_by` (INTEGER): 피드백을 작성한 관리자 ID (향후 확장용)
- `user_id` (UUID): 로그인된 사용자 ID (필수: 문의 제출 및 조회용)
- `user_email` (VARCHAR(255)): 로그인된 사용자 이메일
- `user_name` (VARCHAR(100)): 로그인된 사용자 이름

### 인덱스 추가
- `idx_tech_inquiries_response_at`: response_at 인덱스
- `idx_tech_inquiries_user_id`: user_id 인덱스 (로그인 사용자 조회용)

## 마이그레이션 실행 방법

```sql
-- Supabase SQL Editor에서 실행
\i migrations/add_tech_inquiries_feedback.sql

-- 또는 직접 실행
ALTER TABLE public.tech_inquiries 
ADD COLUMN IF NOT EXISTS admin_response TEXT NULL,
ADD COLUMN IF NOT EXISTS response_at TIMESTAMP WITHOUT TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS response_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS inquiry_token VARCHAR(64) NULL;

CREATE INDEX IF NOT EXISTS idx_tech_inquiries_token ON public.tech_inquiries USING btree (inquiry_token);
CREATE INDEX IF NOT EXISTS idx_tech_inquiries_response_at ON public.tech_inquiries USING btree (response_at);
```

## 기능 개선 사항

### 1. 관리자 기능
- ✅ 문의사항에 피드백 작성 가능
- ✅ 피드백 작성 시간 자동 기록
- ✅ 검색 기능 (메시지, 메모, 피드백 내용, 사용자 정보)
- ✅ 유형별 필터링 (버그, 문의, 제안, 일반)
- ✅ 상태별 필터링 강화
- ✅ 로그인 사용자 정보 표시 (이름, 이메일, ID)
- ✅ 로그인 여부 표시 (배지)

### 2. 사용자 기능
- ✅ 로그인 필수: 문의 제출 및 조회는 로그인된 사용자만 가능
- ✅ 내 문의사항 페이지에서 모든 문의 내역 확인
- ✅ 관리자 피드백 실시간 확인
- ✅ 문의사항 목록 및 상세 보기

### 3. API 개선
- ✅ `PATCH /api/tech-inquiries/[id]`: 피드백 작성 기능 추가
- ✅ `GET /api/tech-inquiries/my-inquiries`: 로그인 사용자의 문의사항 목록 조회
- ✅ `POST /api/tech-inquiries`: 로그인 필수, 사용자 정보 자동 저장
- ✅ 중복 제출 체크 개선 (user_id 기반)

## 사용 방법

### 관리자
1. `/admin/tech-inquiries` 페이지 접속
2. 문의사항 클릭하여 상세보기
3. "사용자 피드백" 섹션에 답변 작성
4. 저장 버튼 클릭

### 사용자
1. **로그인 필수**: 문의 제출 및 조회는 로그인이 필요합니다
2. Footer에서 문의사항 제출
3. `/tech-inquiry-feedback` 페이지에서 내 문의사항 확인
4. 관리자 피드백 확인

## 주의사항
- **로그인 필수**: 문의 제출 및 조회는 로그인된 사용자만 가능합니다
- `response_by` 필드는 현재 사용되지 않지만 향후 관리자 추적 기능을 위해 준비되었습니다.
- `user_id`는 필수 필드입니다 (로그인 사용자만 문의 제출 가능)
- 익명 사용자는 문의를 제출할 수 없습니다

