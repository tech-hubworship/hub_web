-- tech_inquiries 테이블에 피드백 기능 추가
-- 관리자가 사용자에게 피드백을 줄 수 있도록 필드 추가

-- 피드백 관련 필드 추가
ALTER TABLE public.tech_inquiries 
ADD COLUMN IF NOT EXISTS admin_response TEXT NULL,
ADD COLUMN IF NOT EXISTS response_at TIMESTAMP WITHOUT TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS response_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS user_id TEXT NULL, -- 로그인된 사용자 ID (필수: 문의 내역 조회용, profiles.user_id와 동일한 형식)
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) NULL, -- 로그인된 사용자 이메일
ADD COLUMN IF NOT EXISTS user_name VARCHAR(100) NULL; -- 로그인된 사용자 이름

-- user_id가 UUID 타입인 경우 TEXT로 변경
DO $$
BEGIN
    -- user_id 컬럼의 데이터 타입 확인 및 변경
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tech_inquiries' 
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    ) THEN
        -- UUID 타입인 경우 TEXT로 변경
        ALTER TABLE public.tech_inquiries 
        ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tech_inquiries_response_at ON public.tech_inquiries USING btree (response_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_tech_inquiries_user_id ON public.tech_inquiries USING btree (user_id) TABLESPACE pg_default;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.tech_inquiries.admin_response IS '관리자가 사용자에게 보내는 피드백/답변';
COMMENT ON COLUMN public.tech_inquiries.response_at IS '피드백 작성 시간';
COMMENT ON COLUMN public.tech_inquiries.response_by IS '피드백을 작성한 관리자 ID (향후 확장용)';
COMMENT ON COLUMN public.tech_inquiries.user_id IS '로그인된 사용자 ID (문의 내역 조회용, 필수, profiles.user_id와 동일한 형식)';
COMMENT ON COLUMN public.tech_inquiries.user_email IS '로그인된 사용자 이메일';
COMMENT ON COLUMN public.tech_inquiries.user_name IS '로그인된 사용자 이름';
