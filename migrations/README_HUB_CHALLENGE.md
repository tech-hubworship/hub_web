# 허브업 챌린지 마이그레이션

## 개요
레위기 19장 19일 실천 챌린지를 위한 데이터베이스 테이블 생성

**챌린지 기간**: 2026.04.26(일) ~ 2026.05.14(목)

## 마이그레이션 파일
- `add_hub_challenge_shares.sql` - 챌린지 나눔 테이블 생성

## 실행 방법

### Supabase SQL Editor에서 실행
1. Supabase 대시보드 접속
2. SQL Editor 메뉴 선택
3. `add_hub_challenge_shares.sql` 파일 내용 복사
4. 붙여넣기 후 실행

### psql 명령어로 실행
```bash
psql -h [호스트] -U [사용자] -d [데이터베이스] -f migrations/add_hub_challenge_shares.sql
```

## 테이블 구조

### hub_challenge_shares
챌린지 참가자들의 일일 나눔을 저장하는 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| share_id | SERIAL | 나눔 고유 ID (Primary Key) |
| slug | VARCHAR(50) | 챌린지 식별자 (예: 'hubup2026') |
| day | INTEGER | 챌린지 일차 (1~19) |
| content | TEXT | 나눔 내용 (최대 300자) |
| reg_id | VARCHAR(100) | 작성자 user_id |
| reg_dt | TIMESTAMP | 작성일시 (KST) |
| mod_id | VARCHAR(100) | 수정자 user_id |
| mod_dt | TIMESTAMP | 수정일시 (KST) |

## 인덱스
- `idx_hub_challenge_shares_slug_day` - 챌린지별, 일차별 조회 최적화
- `idx_hub_challenge_shares_reg_id` - 사용자별 조회 최적화
- `idx_hub_challenge_shares_reg_dt` - 최신순 정렬 최적화
- `idx_hub_challenge_shares_slug_day_reg_dt` - 특정 일차 나눔 목록 조회 최적화
- `idx_hub_challenge_shares_slug_reg_id_day` - 사용자 진행상황 조회 최적화

## RLS (Row Level Security) 정책
- **조회**: 모든 사용자 가능 (익명 포함)
- **작성**: 인증된 사용자만 가능
- **수정/삭제**: 본인의 나눔만 가능

## 제약 조건
- `day`는 1~19 사이의 값만 허용
- `content`는 최대 300자까지 허용

## API 엔드포인트
- `GET /api/hub-challenge/shares?day={day}&page={page}&limit={limit}` - 특정 일차의 나눔 목록 조회
- `POST /api/hub-challenge/shares` - 나눔 작성
- `GET /api/hub-challenge/my-progress` - 내 진행상황 조회

## 사용 예시

### 나눔 작성
```typescript
const response = await fetch('/api/hub-challenge/shares', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    day: 1,
    content: '오늘 하나님의 기준으로 선택한 순간을 기록합니다...'
  })
});
```

### 나눔 목록 조회
```typescript
const response = await fetch('/api/hub-challenge/shares?day=1&page=1&limit=10');
const data = await response.json();
// data.shares: 나눔 목록 (익명 처리됨)
// data.total: 전체 나눔 개수
```

### 내 진행상황 조회
```typescript
const response = await fetch('/api/hub-challenge/my-progress');
const data = await response.json();
// data.completedDays: 완료한 일차 배열 [1, 2, 3, ...]
// data.todayDayNumber: 오늘의 일차 번호
// data.todayDone: 오늘 나눔 완료 여부
```

## 롤백 방법
테이블을 삭제하려면:
```sql
DROP TABLE IF EXISTS public.hub_challenge_shares CASCADE;
```

## 주의사항
1. 이 마이그레이션은 프로덕션 환경에서 실행하기 전에 개발/스테이징 환경에서 먼저 테스트해야 합니다.
2. RLS 정책이 활성화되어 있으므로 Supabase 서비스 키로 접근해야 모든 데이터를 볼 수 있습니다.
3. 나눔 내용은 익명 처리되어 표시됩니다 (이름 마스킹).
