# HUB Worship Supabase 설정 가이드

## 📋 개요

HUB Worship 웹사이트에서 Supabase를 사용하여 데이터베이스 기능을 구현합니다.
현재 프로젝트는 **일반 SQL 쿼리**를 사용하여 데이터베이스와 상호작용합니다.

## 🚀 Supabase 프로젝트 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭
3. 프로젝트 이름: `hub-worship`
4. 데이터베이스 비밀번호 설정
5. 리전 선택 (Asia Pacific - Seoul 권장)
6. 프로젝트 생성 완료

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정 (필수)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### 3. API 키 찾기

Supabase 대시보드에서:
1. Settings → API
2. Project URL과 API keys 복사
   - Project URL → `SUPABASE_URL`
   - `anon` `public` 키 → `SUPABASE_KEY`
   - `service_role` `secret` 키 → `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ 데이터베이스 스키마 설정

### 1. SQL Editor에서 스키마 실행

Supabase 대시보드 → SQL Editor에서 다음 스키마를 실행하세요:

```sql
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
    status VARCHAR(20) DEFAULT 'pending',
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

-- 다운로드 통계 테이블
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
    size VARCHAR(10) NOT NULL,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
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
    meal_type VARCHAR(20) NOT NULL,
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
    status VARCHAR(20) DEFAULT 'unclaimed',
    claimed_by INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_download_stats_date ON download_stats(downloaded_at);
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
CREATE TRIGGER update_downloads_updated_at BEFORE UPDATE ON downloads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. 일반 SQL 쿼리 실행 함수 추가

```sql
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
    FOR rec IN EXECUTE query_text LOOP
        result_array := result_array || row_to_json(rec);
    END LOOP;
    
    RETURN QUERY SELECT json_agg(result_array);
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
    SELECT d.remaining_count INTO current_count
    FROM downloads d
    WHERE d.key = 'wallpaper_downloads'
    ORDER BY d.id DESC
    LIMIT 1;
    
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
    
    IF current_count <= 0 THEN
        RETURN QUERY SELECT false, current_count, false;
        RETURN;
    END IF;
    
    UPDATE downloads 
    SET remaining_count = remaining_count - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE key = 'wallpaper_downloads'
    RETURNING remaining_count INTO new_count;
    
    RETURN QUERY SELECT true, new_count, true;
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
```

### 3. RLS (Row Level Security) 설정

```sql
-- RLS 활성화
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_stats ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (공지사항, FAQ)
CREATE POLICY "Public read access" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON faqs FOR SELECT USING (is_active = true);

-- 서비스 역할 키로 모든 작업 허용
CREATE POLICY "Service role access" ON downloads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON announcements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON faqs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON inquiries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON download_stats FOR ALL USING (auth.role() = 'service_role');
```

## 🔧 초기 데이터 설정

### 다운로드 제한 초기화

```sql
-- 다운로드 제한 초기 데이터 삽입
INSERT INTO downloads (key, remaining_count) 
VALUES ('wallpaper_downloads', 1000) 
ON CONFLICT (key) DO NOTHING;
```

### 샘플 데이터 추가 (선택사항)

```sql
-- 샘플 공지사항
INSERT INTO announcements (title, content, is_important, order_index) VALUES
('환영합니다!', 'HUB Worship 웹사이트에 오신 것을 환영합니다.', true, 1),
('배경화면 다운로드', '새로운 배경화면을 다운로드하실 수 있습니다.', false, 2);

-- 샘플 FAQ
INSERT INTO faqs (question, answer, category, order_index) VALUES
('배경화면은 어떻게 다운로드하나요?', '원하는 배경화면을 선택하고 다운로드 버튼을 클릭하세요.', 'general', 1),
('다운로드 횟수 제한이 있나요?', '네, 일일 다운로드 횟수 제한이 있습니다.', 'general', 2);
```

## 🧪 테스트

### 1. API 테스트

```bash
# 다운로드 수 조회
curl -X GET http://localhost:3000/api/downloads/decrement

# 다운로드 카운트 차감
curl -X POST http://localhost:3000/api/downloads/decrement

# 공지사항 조회
curl -X GET http://localhost:3000/api/announcements

# FAQ 조회
curl -X GET http://localhost:3000/api/faqs
```

### 2. 웹 인터페이스 테스트

1. 개발 서버 실행: `pnpm dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 배경화면 다운로드 섹션에서 카운트 확인
4. 다운로드 버튼 클릭하여 카운트 차감 테스트

## 🔍 문제 해결

### 자주 발생하는 문제들

1. **"Invalid API key" 에러**
   - 환경 변수가 올바르게 설정되었는지 확인
   - Supabase 대시보드에서 API 키 재확인

2. **"Table doesn't exist" 에러**
   - SQL Editor에서 스키마가 올바르게 실행되었는지 확인
   - 테이블 이름과 컬럼명 확인

3. **RLS 정책 에러**
   - 서비스 역할 키 사용 확인
   - RLS 정책이 올바르게 설정되었는지 확인

4. **연결 타임아웃**
   - Supabase 프로젝트가 활성 상태인지 확인
   - 네트워크 연결 확인

5. **execute_sql 함수 에러**
   - SQL Editor에서 `execute_sql` 함수가 올바르게 생성되었는지 확인
   - 함수 실행 권한 확인

### 로그 확인

개발 서버 콘솔에서 다음 로그들을 확인하세요:

```
데이터베이스에서 다운로드 수 조회 시작...
데이터베이스 조회 성공: 1000
일반 SQL 쿼리로 다운로드 카운트 차감 시작...
데이터베이스에서 카운트 차감 성공: 999
```

## 💡 일반 SQL 쿼리 사용법

현재 프로젝트는 Supabase ORM 대신 일반 SQL 쿼리를 사용합니다:

### 1. execute_sql 함수 사용

```sql
-- 직접 SQL 쿼리 실행
SELECT * FROM execute_sql('SELECT * FROM downloads WHERE key = ''wallpaper_downloads''');
```

### 2. 커스텀 함수 사용

```sql
-- 다운로드 수 조회
SELECT get_remaining_downloads();

-- 다운로드 카운트 차감
SELECT * FROM decrement_download_count();

-- 다운로드 통계 조회
SELECT * FROM get_download_stats();
```

### 3. API에서 사용

```typescript
// TypeScript에서 사용 예시
const { data, error } = await supabaseAdmin.rpc('execute_sql', {
  query: 'SELECT * FROM downloads WHERE key = $1',
  params: ['wallpaper_downloads']
});
```

## 📚 추가 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL 함수 생성 가이드](https://www.postgresql.org/docs/current/xfunc.html)

## 🆘 지원

문제가 지속되면:
1. Supabase 대시보드에서 로그 확인
2. 개발 서버 콘솔 에러 메시지 확인
3. GitHub Issues에 문제 보고

---

**HUB Development Team** | 2024