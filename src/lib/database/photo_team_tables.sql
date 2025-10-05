-- 사진팀 기능을 위한 테이블 생성 SQL
-- HUB Worship 웹사이트 사진 관리 시스템

-- 사진 폴더 테이블
CREATE TABLE IF NOT EXISTS photo_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사진 테이블
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES photo_folders(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    file_format VARCHAR(10), -- jpg, png, gif, webp 등
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_photo_folders_public ON photo_folders(is_public);
CREATE INDEX IF NOT EXISTS idx_photo_folders_order ON photo_folders(order_index);
CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_active ON photos(is_active);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- 업데이트 트리거 함수 (이미 존재한다면 생략)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_photo_folders_updated_at BEFORE UPDATE ON photo_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (선택사항)
-- INSERT INTO photo_folders (name, description, is_public, order_index, created_by)
-- VALUES 
--     ('행사 사진', '교회 행사 및 모임 사진', true, 1, 1),
--     ('예배 사진', '주일예배 및 특별예배 사진', true, 2, 1),
--     ('팀 모임', '팀별 모임 및 활동 사진', false, 3, 1);

-- 사진 폴더 조회 함수
CREATE OR REPLACE FUNCTION get_photo_folders()
RETURNS TABLE(
    id integer,
    name varchar,
    description text,
    is_public boolean,
    order_index integer,
    created_at timestamp,
    photo_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.name,
        pf.description,
        pf.is_public,
        pf.order_index,
        pf.created_at,
        COUNT(p.id) as photo_count
    FROM photo_folders pf
    LEFT JOIN photos p ON pf.id = p.folder_id AND p.is_active = true
    GROUP BY pf.id, pf.name, pf.description, pf.is_public, pf.order_index, pf.created_at
    ORDER BY pf.order_index ASC, pf.created_at DESC;
END;
$$;

-- 폴더별 사진 조회 함수
CREATE OR REPLACE FUNCTION get_photos_by_folder(
    p_folder_id integer
)
RETURNS TABLE(
    id integer,
    title varchar,
    description text,
    image_url text,
    thumbnail_url text,
    file_size integer,
    width integer,
    height integer,
    file_format varchar,
    created_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.image_url,
        p.thumbnail_url,
        p.file_size,
        p.width,
        p.height,
        p.file_format,
        p.created_at
    FROM photos p
    WHERE p.folder_id = p_folder_id 
    AND p.is_active = true
    ORDER BY p.created_at DESC;
END;
$$;

-- 사진 통계 함수
CREATE OR REPLACE FUNCTION get_photo_stats()
RETURNS TABLE(
    total_folders integer,
    total_photos integer,
    photos_today integer,
    photos_this_week integer,
    photos_this_month integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT pf.id)::integer as total_folders,
        COUNT(p.id)::integer as total_photos,
        COUNT(p.id) FILTER (WHERE p.created_at >= CURRENT_DATE)::integer as photos_today,
        COUNT(p.id) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days')::integer as photos_this_week,
        COUNT(p.id) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days')::integer as photos_this_month
    FROM photo_folders pf
    LEFT JOIN photos p ON pf.id = p.folder_id AND p.is_active = true;
END;
$$;
