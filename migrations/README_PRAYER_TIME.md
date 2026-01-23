# 기도 시간 측정 앱 마이그레이션

## 개요
노크 기도 톡방에서 착안한 기도 시간 자동 측정 및 기록 시스템을 위한 데이터베이스 마이그레이션입니다.

## 변경 사항

### 데이터베이스 스키마

#### 1. `prayer_times` 테이블
기도 시간 기록을 저장하는 메인 테이블입니다.

- `id` (SERIAL PRIMARY KEY): 고유 ID
- `user_id` (TEXT): 사용자 ID (profiles.user_id 참조)
- `start_time` (TIMESTAMP): 기도 시작 시간
- `end_time` (TIMESTAMP): 기도 종료 시간 (NULL이면 아직 진행 중)
- `duration_seconds` (INTEGER): 기도 시간 (초 단위, NULL이면 아직 종료 안 됨)
- `created_at` (TIMESTAMP): 생성 시간
- `updated_at` (TIMESTAMP): 수정 시간 (자동 업데이트)

#### 2. `prayer_sessions` 테이블
현재 기도 중인 세션을 추적하는 테이블입니다. 실시간으로 기도 중인 사람 목록을 보여주기 위해 사용됩니다.

- `id` (SERIAL PRIMARY KEY): 고유 ID
- `user_id` (TEXT UNIQUE): 사용자 ID (한 사용자는 한 번에 하나의 세션만 가질 수 있음)
- `start_time` (TIMESTAMP): 기도 시작 시간
- `created_at` (TIMESTAMP): 생성 시간

### 인덱스
- `idx_prayer_times_user_id`: 사용자별 조회 최적화
- `idx_prayer_times_start_time`: 시작 시간별 조회 최적화
- `idx_prayer_times_end_time`: 종료 시간별 조회 최적화
- `idx_prayer_times_user_date`: 사용자별 날짜별 집계 최적화
- `idx_prayer_sessions_user_id`: 세션 조회 최적화
- `idx_prayer_sessions_start_time`: 세션 시간별 조회 최적화

## 마이그레이션 실행 방법

```sql
-- Supabase SQL Editor에서 실행
\i migrations/add_prayer_time.sql

-- 또는 직접 실행
-- 파일 내용을 복사하여 Supabase SQL Editor에 붙여넣고 실행
```

## 주요 기능

### 1. 기도 시간 측정
- 기도 시작 버튼 클릭 시 `prayer_times` 테이블에 레코드 생성
- 기도 종료 버튼 클릭 시 `end_time`과 `duration_seconds` 업데이트
- 동시에 `prayer_sessions` 테이블에서 해당 세션 제거

### 2. 실시간 기도 중인 사람 목록
- `prayer_sessions` 테이블에서 현재 기도 중인 사람 조회
- "LIVE 18명 기도 중" 같은 형태로 표시

### 3. 개인 기도 시간 통계
- 오늘 나의 기도 시간: 오늘 날짜의 모든 기도 시간 합계
- 나의 총 기도 시간: 모든 기도 시간 합계
- 날짜별 기도 시간: 날짜별 집계

### 4. 공동체 기도 시간
- 허브 전체 기도 시간 합계
- 각 허브 지체의 기도 시간 목록
- 날짜별 공동체 기도 시간 통계

## 쿼리 예시

### 오늘 나의 기도 시간 조회
```sql
SELECT 
    COALESCE(SUM(duration_seconds), 0) as total_seconds
FROM prayer_times
WHERE user_id = 'user_id_here'
    AND DATE(start_time) = CURRENT_DATE
    AND end_time IS NOT NULL;
```

### 현재 기도 중인 사람 목록
```sql
SELECT 
    ps.user_id,
    p.name,
    ps.start_time,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ps.start_time))::INTEGER as duration_seconds
FROM prayer_sessions ps
JOIN profiles p ON p.user_id = ps.user_id
ORDER BY ps.start_time DESC;
```

### 날짜별 기도 시간 집계
```sql
SELECT 
    DATE(start_time) as prayer_date,
    SUM(duration_seconds) as total_seconds
FROM prayer_times
WHERE user_id = 'user_id_here'
    AND end_time IS NOT NULL
GROUP BY DATE(start_time)
ORDER BY prayer_date DESC;
```

### 허브 전체 기도 시간 합계
```sql
SELECT 
    COALESCE(SUM(duration_seconds), 0) as total_seconds
FROM prayer_times
WHERE end_time IS NOT NULL;
```

### 각 허브 지체의 기도 시간 목록
```sql
SELECT 
    p.user_id,
    p.name,
    COALESCE(SUM(pt.duration_seconds), 0) as total_seconds
FROM profiles p
LEFT JOIN prayer_times pt ON pt.user_id = p.user_id 
    AND pt.end_time IS NOT NULL
    AND DATE(pt.start_time) = CURRENT_DATE
GROUP BY p.user_id, p.name
ORDER BY total_seconds DESC;
```

## 주의사항
- `prayer_sessions` 테이블은 실시간 추적용이므로, 기도 종료 시 반드시 세션을 제거해야 합니다.
- `duration_seconds`는 초 단위로 저장되며, 프론트엔드에서 분/시간으로 변환하여 표시합니다.
- 한 사용자는 한 번에 하나의 기도 세션만 가질 수 있습니다 (UNIQUE 제약조건).
