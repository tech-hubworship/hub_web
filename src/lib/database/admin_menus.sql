-- 관리자 메뉴 테이블
-- 권한별 메뉴 접근을 데이터베이스로 관리

-- 메뉴 테이블
CREATE TABLE IF NOT EXISTS admin_menus (
    id SERIAL PRIMARY KEY,
    menu_id VARCHAR(50) UNIQUE NOT NULL,  -- 'dashboard', 'users', 'photos' 등
    title VARCHAR(100) NOT NULL,           -- 표시 이름
    icon VARCHAR(10),                       -- 이모지 아이콘
    path VARCHAR(255) NOT NULL,            -- 경로
    parent_id INTEGER REFERENCES admin_menus(id), -- 부모 메뉴 (하위 메뉴용)
    order_index INTEGER DEFAULT 0,         -- 정렬 순서
    is_active BOOLEAN DEFAULT TRUE,        -- 활성화 여부
    description TEXT,                      -- 메뉴 설명
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메뉴-역할 관계 테이블
CREATE TABLE IF NOT EXISTS admin_menu_roles (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER REFERENCES admin_menus(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(menu_id, role_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_menus_menu_id ON admin_menus(menu_id);
CREATE INDEX IF NOT EXISTS idx_admin_menus_parent_id ON admin_menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_menus_active ON admin_menus(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_menus_order ON admin_menus(order_index);
CREATE INDEX IF NOT EXISTS idx_admin_menu_roles_menu_id ON admin_menu_roles(menu_id);
CREATE INDEX IF NOT EXISTS idx_admin_menu_roles_role_id ON admin_menu_roles(role_id);

-- 트리거
CREATE TRIGGER update_admin_menus_updated_at 
    BEFORE UPDATE ON admin_menus 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 메뉴 데이터 삽입
INSERT INTO admin_menus (menu_id, title, icon, path, parent_id, order_index, description) VALUES
    ('dashboard', '대시보드', '🏠', '/admin', NULL, 0, 'HUB 관리자 대시보드'),
    ('users', '회원관리', '👥', '/admin/users', NULL, 1, '계정관리 및 권한관리'),
    ('photos', '사진팀 관리', '📷', '/admin/photos', NULL, 2, '사진팀 업무 메뉴'),
    ('design', '디자인 관리', '🎨', '/admin/design', NULL, 3, '디자인 작업 관리 및 통계'),
    ('secretary', '서기 관리', '✍️', '/admin/secretary', NULL, 4, '회의록 및 문서 관리'),
    ('advent', '대림절 관리', '🎄', '/admin/advent', NULL, 5, '대림절 관리 대시보드'),
    ('tech-inquiries', '문의사항', '💬', '/admin/tech-inquiries', NULL, 6, '사용자 문의 및 버그 리포트 관리'),
    ('menu-management', '메뉴 관리', '⚙️', '/admin/menu-management', NULL, 99, '관리자 메뉴 설정')
ON CONFLICT (menu_id) DO NOTHING;

-- 하위 메뉴 데이터 삽입
INSERT INTO admin_menus (menu_id, title, icon, path, parent_id, order_index, description) VALUES
    ('photos-manage', '사진 관리', '📸', '/admin/photos/manage', (SELECT id FROM admin_menus WHERE menu_id = 'photos'), 0, '사진 업로드/수정/삭제'),
    ('photos-reservations', '예약 관리', '📋', '/admin/photos/reservations', (SELECT id FROM admin_menus WHERE menu_id = 'photos'), 1, '사진 예약 현황 관리'),
    ('advent-posts', '게시글 관리', '📝', '/admin/advent/posts', (SELECT id FROM admin_menus WHERE menu_id = 'advent'), 0, '대림절 말씀/영상/콘텐츠 관리'),
    ('advent-attendance', '출석 현황', '📅', '/admin/advent/attendance', (SELECT id FROM admin_menus WHERE menu_id = 'advent'), 1, '대림절 출석 정보 및 통계')
ON CONFLICT (menu_id) DO NOTHING;

-- 메뉴-역할 매핑 (기본값)
-- MC 권한에 회원관리 메뉴
INSERT INTO admin_menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM admin_menus m, roles r 
WHERE m.menu_id = 'users' AND r.name = 'MC'
ON CONFLICT DO NOTHING;

-- 사진팀 권한에 사진팀 메뉴들
INSERT INTO admin_menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM admin_menus m, roles r 
WHERE m.menu_id IN ('photos', 'photos-manage', 'photos-reservations') AND r.name = '사진팀'
ON CONFLICT DO NOTHING;

-- 디자인팀/양육MC 권한에 디자인 관리
INSERT INTO admin_menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM admin_menus m, roles r 
WHERE m.menu_id = 'design' AND r.name IN ('디자인팀', '양육MC')
ON CONFLICT DO NOTHING;

-- 서기 권한에 서기 관리
INSERT INTO admin_menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM admin_menus m, roles r 
WHERE m.menu_id = 'secretary' AND r.name = '서기'
ON CONFLICT DO NOTHING;

-- 목회자 권한에 대림절 관리
INSERT INTO admin_menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM admin_menus m, roles r 
WHERE m.menu_id IN ('advent', 'advent-posts', 'advent-attendance') AND r.name = '목회자'
ON CONFLICT DO NOTHING;

-- MC 권한에 메뉴 관리
INSERT INTO admin_menu_roles (menu_id, role_id)
SELECT m.id, r.id FROM admin_menus m, roles r 
WHERE m.menu_id = 'menu-management' AND r.name = 'MC'
ON CONFLICT DO NOTHING;

