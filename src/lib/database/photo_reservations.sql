-- 사진 예약 테이블
CREATE TABLE IF NOT EXISTS photo_reservations (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    status TEXT DEFAULT '예약중' CHECK (status IN ('예약중', '예약완료', '수령완료', '취소됨')),
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_photo_reservations_photo_id ON photo_reservations(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_reservations_user_id ON photo_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_reservations_status ON photo_reservations(status);

-- 중복 예약 방지 (한 사용자가 같은 사진을 중복 예약하는 것 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_photo_reservations_unique_user 
ON photo_reservations(photo_id, user_id) 
WHERE status = '예약중';

-- 사진별 단일 예약 방지 (한 사진당 한 명만 예약 가능)
CREATE UNIQUE INDEX IF NOT EXISTS idx_photo_reservations_unique_photo 
ON photo_reservations(photo_id) 
WHERE status IN ('예약중', '예약완료', '수령완료');

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_photo_reservations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_photo_reservations_update
    BEFORE UPDATE ON photo_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_reservations_timestamp();

-- 사진 예약 조회 함수
CREATE OR REPLACE FUNCTION get_photo_reservations(p_photo_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    photo_id INTEGER,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    status TEXT,
    reservation_date TIMESTAMP,
    message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    photo_title TEXT,
    photo_url TEXT,
    folder_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.photo_id,
        pr.user_id,
        pr.user_name,
        pr.user_email,
        pr.status,
        pr.reservation_date,
        pr.message,
        pr.created_at,
        pr.updated_at,
        p.title as photo_title,
        p.image_url as photo_url,
        pf.name as folder_name
    FROM photo_reservations pr
    INNER JOIN photos p ON pr.photo_id = p.id
    INNER JOIN photo_folders pf ON p.folder_id = pf.id
    WHERE (p_photo_id IS NULL OR pr.photo_id = p_photo_id)
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 사용자별 예약 조회 함수
CREATE OR REPLACE FUNCTION get_user_reservations(p_user_id TEXT)
RETURNS TABLE (
    id INTEGER,
    photo_id INTEGER,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    status TEXT,
    reservation_date TIMESTAMP,
    message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    photo_title TEXT,
    photo_url TEXT,
    folder_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.photo_id,
        pr.user_id,
        pr.user_name,
        pr.user_email,
        pr.status,
        pr.reservation_date,
        pr.message,
        pr.created_at,
        pr.updated_at,
        p.title as photo_title,
        p.image_url as photo_url,
        pf.name as folder_name
    FROM photo_reservations pr
    INNER JOIN photos p ON pr.photo_id = p.id
    INNER JOIN photo_folders pf ON p.folder_id = pf.id
    WHERE pr.user_id = p_user_id
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 예약 통계 함수
CREATE OR REPLACE FUNCTION get_reservation_stats()
RETURNS TABLE (
    total_reservations BIGINT,
    pending_reservations BIGINT,
    completed_reservations BIGINT,
    cancelled_reservations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM photo_reservations) as total_reservations,
        (SELECT COUNT(*) FROM photo_reservations WHERE status = '예약중') as pending_reservations,
        (SELECT COUNT(*) FROM photo_reservations WHERE status = '예약완료') as completed_reservations,
        (SELECT COUNT(*) FROM photo_reservations WHERE status = '취소됨') as cancelled_reservations;
END;
$$ LANGUAGE plpgsql;
