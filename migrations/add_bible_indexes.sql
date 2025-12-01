-- 성경 테이블 성능 개선을 위한 인덱스 생성
-- 실행 전: 현재 인덱스 상태 확인
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'bible';

-- 1. 가장 중요한 복합 인덱스: book_name + chapter + verse
-- 이 인덱스는 대부분의 쿼리 패턴을 커버합니다
CREATE INDEX IF NOT EXISTS idx_bible_book_chapter_verse 
ON public.bible (book_name, chapter, verse);

-- 2. book_name 단일 인덱스 (책별 조회 최적화)
-- 복합 인덱스가 있지만, book_name만 사용하는 쿼리도 많으므로 별도 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bible_book_name 
ON public.bible (book_name);

-- 3. book_full_name 인덱스 (책 목록 조회 시 사용)
CREATE INDEX IF NOT EXISTS idx_bible_book_full_name 
ON public.bible (book_full_name);

-- 4. id 인덱스 (이미 primary key이므로 자동 생성되지만, 명시적으로 확인)
-- PRIMARY KEY는 자동으로 인덱스를 생성하므로 별도 생성 불필요

-- 인덱스 생성 후 통계 정보 업데이트
ANALYZE public.bible;

-- 인덱스 생성 확인 쿼리
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes 
-- WHERE tablename = 'bible'
-- ORDER BY indexname;



