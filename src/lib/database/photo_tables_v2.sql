-- 포토 관련 테이블 재설계 (profiles 테이블과 연결)

-- 1. admin_roles에서 profiles로 참조 변경
ALTER TABLE admin_roles DROP CONSTRAINT IF EXISTS admin_roles_user_id_fkey;
ALTER TABLE admin_roles ADD CONSTRAINT admin_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 2. photo_folders 테이블 재생성
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS photo_folders CASCADE;

CREATE TABLE photo_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_by TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. photos 테이블 재생성
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES photo_folders(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    file_format VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by TEXT REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_photo_folders_public ON photo_folders(is_public);
CREATE INDEX IF NOT EXISTS idx_photo_folders_order ON photo_folders(order_index);
CREATE INDEX IF NOT EXISTS idx_photo_folders_created_by ON photo_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_active ON photos(is_active);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- 4. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photo_folders_updated_at 
    BEFORE UPDATE ON photo_folders 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_photos_updated_at 
    BEFORE UPDATE ON photos 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. 유틸리티 함수들 (기존 함수들 삭제 후 재생성)
DROP FUNCTION IF EXISTS get_photo_folders();

CREATE OR REPLACE FUNCTION get_photo_folders()
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    is_public BOOLEAN,
    order_index INTEGER,
    created_by TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    photo_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.name,
        pf.description,
        pf.is_public,
        pf.order_index,
        pf.created_by,
        pf.created_at,
        pf.updated_at,
        COUNT(p.id) as photo_count
    FROM photo_folders pf
    LEFT JOIN photos p ON pf.id = p.folder_id AND p.is_active = true
    GROUP BY pf.id, pf.name, pf.description, pf.is_public, pf.order_index, 
             pf.created_by, pf.created_at, pf.updated_at
    ORDER BY pf.order_index ASC, pf.created_at DESC;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_photos_by_folder(INTEGER);

CREATE OR REPLACE FUNCTION get_photos_by_folder(p_folder_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(255),
    description TEXT,
    image_url TEXT,
    thumbnail_url TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    file_format VARCHAR(10),
    is_active BOOLEAN,
    uploaded_by TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    folder_name VARCHAR(255)
) AS $$
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
        p.is_active,
        p.uploaded_by,
        p.created_at,
        p.updated_at,
        pf.name as folder_name
    FROM photos p
    INNER JOIN photo_folders pf ON p.folder_id = pf.id
    WHERE p.folder_id = p_folder_id AND p.is_active = true
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_photo_stats();

CREATE OR REPLACE FUNCTION get_photo_stats()
RETURNS TABLE (
    total_folders BIGINT,
    total_photos BIGINT,
    public_folders BIGINT,
    active_photos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM photo_folders) as total_folders,
        (SELECT COUNT(*) FROM photos WHERE is_active = true) as total_photos,
        (SELECT COUNT(*) FROM photo_folders WHERE is_public = true) as public_folders,
        (SELECT COUNT(*) FROM photos WHERE is_active = true) as active_photos;
END;
$$ LANGUAGE plpgsql;

-- 6. 샘플 데이터 (테스트용)
/*
-- profiles 테이블에 사용자 추가 (이미 존재한다면 생략)
INSERT INTO profiles (user_id, email, name, status) VALUES
('112859707849316640768', 'admin@example.com', '관리자', '관리자')
ON CONFLICT (user_id) DO NOTHING;

-- admin_roles 테이블에 역할 추가
INSERT INTO admin_roles (user_id, role_id) VALUES
('112859707849316640768', 1),
('112859707849316640768', 2)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- photo_folders 테이블에 폴더 추가
INSERT INTO photo_folders (name, description, is_public, order_index, created_by) VALUES
('행사 사진', '각종 행사 및 이벤트 사진', true, 1, '112859707849316640768'),
('팀 사진', '팀원들의 단체 사진', true, 2, '112859707849316640768'),
('프로젝트', '프로젝트 관련 자료 사진', false, 3, '112859707849316640768');

-- photos 테이블에 사진 추가
INSERT INTO photos (folder_id, title, description, image_url, uploaded_by) VALUES
(1, '정기 모임', '2024년 정기 모임 사진', 'https://example.com/image1.jpg', '112859707849316640768'),
(1, '워크샵', '팀 워크샵 진행 사진', 'https://example.com/image2.jpg', '112859707849316640768'),
(2, '신입 환영회', '2024년 신입 팀원 환영회', 'https://example.com/image3.jpg', '112859707849316640768');
*/

