-- HUB Worship 웹사이트 데이터베이스 스키마
-- PostgreSQL/Supabase용 테이블 정의

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ 테이블
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 문의사항 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, resolved, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 배경화면 다운로드 통계 테이블
CREATE TABLE IF NOT EXISTS download_stats (
    id SERIAL PRIMARY KEY,
    wallpaper_id INTEGER NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 티셔츠 주문 테이블
CREATE TABLE IF NOT EXISTS tshirt_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    size VARCHAR(10) NOT NULL, -- S, M, L, XL
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, shipped, delivered
    pickup_location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 식사 신청 테이블
CREATE TABLE IF NOT EXISTS meal_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    meal_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 숙소 신청 테이블
CREATE TABLE IF NOT EXISTS accommodation_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_type VARCHAR(50),
    guest_count INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 분실물 테이블
CREATE TABLE IF NOT EXISTS lost_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    location_found VARCHAR(255),
    found_date DATE,
    status VARCHAR(20) DEFAULT 'unclaimed', -- unclaimed, claimed
    claimed_by INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 다운로드 제한 테이블
CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    remaining_count INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_order ON announcements(order_index);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_download_stats_date ON download_stats(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_tshirt_orders_status ON tshirt_orders(status);
CREATE INDEX IF NOT EXISTS idx_meal_applications_date ON meal_applications(meal_date);
CREATE INDEX IF NOT EXISTS idx_accommodation_applications_dates ON accommodation_applications(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_lost_items_status ON lost_items(status);
CREATE INDEX IF NOT EXISTS idx_downloads_key ON downloads(key);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tshirt_orders_updated_at BEFORE UPDATE ON tshirt_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_applications_updated_at BEFORE UPDATE ON meal_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accommodation_applications_updated_at BEFORE UPDATE ON accommodation_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lost_items_updated_at BEFORE UPDATE ON lost_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_downloads_updated_at BEFORE UPDATE ON downloads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 일반 SQL 쿼리 실행 함수
CREATE OR REPLACE FUNCTION execute_sql(query_text text)
RETURNS TABLE(result json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec record;
    result_array json[] := '{}';
BEGIN
    -- 동적 SQL 실행
    FOR rec IN EXECUTE query_text LOOP
        result_array := result_array || row_to_json(rec);
    END LOOP;
    
    RETURN QUERY SELECT json_agg(result_array);
END;
$$;

-- 다운로드 통계 조회 함수
CREATE OR REPLACE FUNCTION get_download_stats()
RETURNS TABLE(
    total_downloads integer,
    downloads_today integer,
    downloads_this_week integer,
    downloads_this_month integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_downloads,
        COUNT(*) FILTER (WHERE downloaded_at >= CURRENT_DATE)::integer as downloads_today,
        COUNT(*) FILTER (WHERE downloaded_at >= CURRENT_DATE - INTERVAL '7 days')::integer as downloads_this_week,
        COUNT(*) FILTER (WHERE downloaded_at >= CURRENT_DATE - INTERVAL '30 days')::integer as downloads_this_month
    FROM download_stats;
END;
$$;

-- 다운로드 기록 추가 함수
CREATE OR REPLACE FUNCTION record_download(
    p_wallpaper_id integer,
    p_user_ip text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO download_stats (wallpaper_id, user_ip, user_agent)
    VALUES (p_wallpaper_id, p_user_ip, p_user_agent);
END;
$$;

-- 다운로드 수 조회 함수
CREATE OR REPLACE FUNCTION get_remaining_downloads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    remaining_count integer;
BEGIN
    SELECT d.remaining_count INTO remaining_count
    FROM downloads d
    WHERE d.key = 'wallpaper_downloads'
    ORDER BY d.id DESC
    LIMIT 1;
    
    IF remaining_count IS NULL THEN
        -- 데이터가 없으면 초기화
        INSERT INTO downloads (key, remaining_count)
        VALUES ('wallpaper_downloads', 1000)
        ON CONFLICT (key) DO NOTHING;
        
        SELECT d.remaining_count INTO remaining_count
        FROM downloads d
        WHERE d.key = 'wallpaper_downloads'
        ORDER BY d.id DESC
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(remaining_count, 1000);
END;
$$;

-- 다운로드 카운트 차감 함수
CREATE OR REPLACE FUNCTION decrement_download_count()
RETURNS TABLE(success boolean, remaining_count integer, can_download boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count integer;
    new_count integer;
BEGIN
    -- 현재 카운트 조회
    SELECT d.remaining_count INTO current_count
    FROM downloads d
    WHERE d.key = 'wallpaper_downloads'
    ORDER BY d.id DESC
    LIMIT 1;
    
    -- 데이터가 없으면 초기화
    IF current_count IS NULL THEN
        INSERT INTO downloads (key, remaining_count)
        VALUES ('wallpaper_downloads', 1000)
        ON CONFLICT (key) DO NOTHING;
        
        SELECT d.remaining_count INTO current_count
        FROM downloads d
        WHERE d.key = 'wallpaper_downloads'
        ORDER BY d.id DESC
        LIMIT 1;
    END IF;
    
    -- 카운트 확인
    IF current_count <= 0 THEN
        RETURN QUERY SELECT false, current_count, false;
        RETURN;
    END IF;
    
    -- 카운트 차감
    UPDATE downloads 
    SET remaining_count = remaining_count - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE key = 'wallpaper_downloads'
    RETURNING remaining_count INTO new_count;
    
    RETURN QUERY SELECT true, new_count, true;
END;
$$;
