-- 다운로드 횟수를 관리하는 테이블 생성
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  remaining_count INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 배경화면 다운로드 초기 데이터 삽입
INSERT INTO downloads (key, remaining_count) 
VALUES ('wallpaper_downloads', 1000)
ON CONFLICT (key) DO NOTHING; 