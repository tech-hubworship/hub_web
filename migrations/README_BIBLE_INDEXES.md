# 성경 테이블 인덱스 최적화

## 문제점
`bible` 테이블의 조회 속도가 느린 문제를 해결하기 위한 인덱스 최적화입니다.

## 쿼리 패턴 분석
현재 사용되는 주요 쿼리 패턴:

1. **책 목록 조회**
   ```sql
   SELECT id, book_full_name, book_name 
   FROM bible 
   ORDER BY id;
   ```

2. **장 목록 조회**
   ```sql
   SELECT chapter, book_full_name 
   FROM bible 
   WHERE book_name = ? 
   ORDER BY chapter;
   ```

3. **절 목록 조회**
   ```sql
   SELECT verse, book_full_name 
   FROM bible 
   WHERE book_name = ? AND chapter = ? 
   ORDER BY verse;
   ```

4. **본문 조회**
   ```sql
   SELECT content, book_full_name 
   FROM bible 
   WHERE book_name = ? AND chapter = ? AND verse = ?;
   ```

## 생성되는 인덱스

### 1. `idx_bible_book_chapter_verse` (복합 인덱스)
- **컬럼**: `book_name`, `chapter`, `verse`
- **용도**: 가장 자주 사용되는 쿼리 패턴 최적화
- **효과**: 
  - 장 목록 조회 (book_name만 사용)
  - 절 목록 조회 (book_name + chapter)
  - 본문 조회 (book_name + chapter + verse)

### 2. `idx_bible_book_name` (단일 인덱스)
- **컬럼**: `book_name`
- **용도**: book_name만 사용하는 쿼리 최적화
- **효과**: 책별 전체 데이터 조회 시 성능 향상

### 3. `idx_bible_book_full_name` (단일 인덱스)
- **컬럼**: `book_full_name`
- **용도**: 책 목록 조회 시 사용
- **효과**: book_full_name으로 조회하는 경우 성능 향상

## 실행 방법

### PostgreSQL 직접 실행
```bash
psql -U your_username -d your_database -f migrations/add_bible_indexes.sql
```

### Supabase SQL Editor
1. Supabase 대시보드 접속
2. SQL Editor 열기
3. `migrations/add_bible_indexes.sql` 파일 내용 복사하여 실행

### 실행 전 확인
```sql
-- 현재 인덱스 상태 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'bible';
```

### 실행 후 확인
```sql
-- 인덱스 생성 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'bible'
ORDER BY indexname;

-- 테이블 통계 확인
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename = 'bible';
```

## 성능 개선 예상 효과

- **장 목록 조회**: Full Table Scan → Index Scan (10-100배 향상)
- **절 목록 조회**: Full Table Scan → Index Scan (10-100배 향상)
- **본문 조회**: Full Table Scan → Index Scan (10-100배 향상)

## 주의사항

1. **인덱스 생성 시간**: 데이터 양에 따라 수 분~수십 분 소요될 수 있습니다.
2. **디스크 공간**: 인덱스는 추가 디스크 공간을 사용합니다 (약 테이블 크기의 20-30%).
3. **INSERT/UPDATE 성능**: 인덱스가 많을수록 INSERT/UPDATE 성능이 약간 저하될 수 있지만, 이 테이블은 주로 읽기 전용이므로 문제 없습니다.

## 롤백 방법

인덱스를 제거하려면:
```sql
DROP INDEX IF EXISTS idx_bible_book_chapter_verse;
DROP INDEX IF EXISTS idx_bible_book_name;
DROP INDEX IF EXISTS idx_bible_book_full_name;
```




