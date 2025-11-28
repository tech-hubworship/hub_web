-- ============================================
-- 말씀카드(Bible Card) 시스템 테이블 설계
-- ============================================

-- 말씀카드 신청 테이블
CREATE TABLE IF NOT EXISTS bible_card_applications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- 신청자 정보 (신청 시점 스냅샷)
    name VARCHAR(100) NOT NULL,
    community VARCHAR(50),
    group_id INTEGER REFERENCES hub_groups(id),
    cell_id INTEGER REFERENCES hub_cells(id),
    
    -- 기도제목
    prayer_request TEXT NOT NULL,
    
    -- 상태: pending(대기), assigned(목회자 배정됨), completed(말씀 작성 완료), delivered(전달 완료)
    status VARCHAR(20) DEFAULT 'pending',
    
    -- 목회자 배정
    assigned_pastor_id TEXT REFERENCES profiles(user_id),
    assigned_at TIMESTAMP,
    
    -- 목회자가 작성하는 말씀
    bible_verse TEXT,                        -- 성경 말씀 본문
    bible_verse_reference VARCHAR(100),      -- 성경 구절 (예: 요한복음 3:16)
    pastor_message TEXT,                     -- 목회자 메시지/기도
    completed_at TIMESTAMP,                  -- 말씀 입력 완료 시간
    
    -- 완성된 말씀카드 링크 (구글드라이브)
    drive_link_1 VARCHAR(500),               -- 말씀카드 이미지 링크 1
    drive_link_2 VARCHAR(500),               -- 말씀카드 이미지 링크 2
    links_added_at TIMESTAMP,                -- 링크 추가 시간
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 사용자당 1회만 신청 가능
    UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bible_card_user_id ON bible_card_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_card_status ON bible_card_applications(status);
CREATE INDEX IF NOT EXISTS idx_bible_card_pastor_id ON bible_card_applications(assigned_pastor_id);
CREATE INDEX IF NOT EXISTS idx_bible_card_community ON bible_card_applications(community);
CREATE INDEX IF NOT EXISTS idx_bible_card_created_at ON bible_card_applications(created_at);

-- 업데이트 트리거
CREATE TRIGGER update_bible_card_applications_updated_at 
    BEFORE UPDATE ON bible_card_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 말씀카드 이벤트 설정 테이블 (선택적)
-- 이벤트 기간, 활성화 여부 등을 관리
-- ============================================
CREATE TABLE IF NOT EXISTS bible_card_settings (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,        -- 이벤트 이름
    is_active BOOLEAN DEFAULT TRUE,          -- 활성화 여부
    start_date TIMESTAMP,                     -- 신청 시작일
    end_date TIMESTAMP,                       -- 신청 마감일
    description TEXT,                         -- 이벤트 설명
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정 삽입
INSERT INTO bible_card_settings (event_name, is_active, description)
VALUES ('2024 말씀카드', TRUE, '2024년 말씀카드 이벤트')
ON CONFLICT DO NOTHING;

-- ============================================
-- 뷰: 말씀카드 신청 목록 (조인된 정보 포함)
-- ============================================
CREATE OR REPLACE VIEW bible_card_applications_view AS
SELECT 
    bca.*,
    hg.name as group_name,
    hc.name as cell_name,
    pastor.name as pastor_name,
    pastor.email as pastor_email
FROM bible_card_applications bca
LEFT JOIN hub_groups hg ON bca.group_id = hg.id
LEFT JOIN hub_cells hc ON bca.cell_id = hc.id
LEFT JOIN profiles pastor ON bca.assigned_pastor_id = pastor.user_id;

-- ============================================
-- 통계 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_bible_card_stats()
RETURNS TABLE(
    total_applications INTEGER,
    pending_count INTEGER,
    assigned_count INTEGER,
    completed_count INTEGER,
    delivered_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_applications,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
        COUNT(*) FILTER (WHERE status = 'assigned')::INTEGER as assigned_count,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_count,
        COUNT(*) FILTER (WHERE status = 'delivered')::INTEGER as delivered_count
    FROM bible_card_applications;
END;
$$;

