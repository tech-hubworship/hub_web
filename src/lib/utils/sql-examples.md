# 순수 SQL 쿼리 사용 가이드

## 📋 개요

Supabase JS ORM 대신 순수 SQL 쿼리를 편하게 작성할 수 있는 유틸리티 함수들을 제공합니다.

## 🚀 설치

1. **SQL 함수 생성**
   - Supabase SQL Editor에서 `src/lib/database/execute_sql_function.sql` 파일의 내용을 실행

2. **TypeScript 유틸리티 사용**
   ```typescript
   import { executeSql, executeSqlWithParams } from '@src/lib/utils/sql';
   ```

## 📖 사용 예시

### 1. 간단한 SELECT 쿼리

```typescript
import { executeSql } from '@src/lib/utils/sql';

// 모든 프로필 조회
const { data, error } = await executeSql(`
  SELECT 
    user_id,
    name,
    email,
    group_id,
    cell_id
  FROM profiles
  WHERE is_active = true
  ORDER BY name
`);

if (error) {
  console.error('오류:', error);
} else {
  console.log('조회된 사용자:', data);
}
```

### 2. 매개변수화된 쿼리

```typescript
import { executeSqlWithParams } from '@src/lib/utils/sql';

// 특정 그룹의 사용자 조회
const { data, error } = await executeSqlWithParams(`
  SELECT 
    p.user_id,
    p.name,
    p.email,
    g.name as group_name,
    c.name as cell_name
  FROM profiles p
  LEFT JOIN hub_groups g ON p.group_id = g.id
  LEFT JOIN hub_cells c ON p.cell_id = c.id
  WHERE p.group_id = $1 AND p.cell_id = $2
  ORDER BY p.name
`, [1, 5]);
```

### 3. 단일 행 조회

```typescript
import { executeSqlSingle } from '@src/lib/utils/sql';

// 특정 사용자 조회
const { data, error } = await executeSqlSingle(`
  SELECT * FROM profiles WHERE user_id = $1
`, ['user-123']);

if (data) {
  console.log('사용자 정보:', data);
}
```

### 4. 복잡한 JOIN 쿼리

```typescript
import { executeSql } from '@src/lib/utils/sql';

// 대림절 출석 통계 조회
const { data, error } = await executeSql(`
  SELECT 
    aa.post_dt,
    COUNT(DISTINCT aa.user_id) as attendance_count,
    COUNT(DISTINCT ac.reg_id) as comment_count,
    COUNT(DISTINCT CASE 
      WHEN aa.user_id = ac.reg_id THEN aa.user_id 
    END) as completed_count
  FROM advent_attendance aa
  LEFT JOIN advent_comments ac ON aa.post_dt = ac.post_dt
  WHERE aa.post_dt >= '20251201' AND aa.post_dt <= '20251225'
  GROUP BY aa.post_dt
  ORDER BY aa.post_dt
`);
```

### 5. 집계 함수 사용

```typescript
import { executeSql } from '@src/lib/utils/sql';

// 그룹별 사용자 통계
const { data, error } = await executeSql(`
  SELECT 
    g.name as group_name,
    COUNT(p.user_id) as total_users,
    COUNT(CASE WHEN p.is_active THEN 1 END) as active_users,
    COUNT(CASE WHEN p.cell_id IS NOT NULL THEN 1 END) as users_with_cell
  FROM hub_groups g
  LEFT JOIN profiles p ON g.id = p.group_id
  GROUP BY g.id, g.name
  ORDER BY g.name
`);
```

### 6. INSERT, UPDATE, DELETE (DML)

```typescript
import { executeSqlDml } from '@src/lib/utils/sql';

// 사용자 정보 업데이트
const { error } = await executeSqlDml(`
  UPDATE profiles 
  SET 
    name = $1,
    email = $2,
    updated_at = NOW()
  WHERE user_id = $3
`, ['새 이름', 'new@email.com', 'user-123']);

if (error) {
  console.error('업데이트 실패:', error);
} else {
  console.log('업데이트 성공');
}
```

### 7. 서브쿼리 사용

```typescript
import { executeSql } from '@src/lib/utils/sql';

// 최근 활동한 사용자 조회
const { data, error } = await executeSql(`
  SELECT 
    p.*,
    (
      SELECT MAX(reg_dt) 
      FROM advent_comments 
      WHERE reg_id = p.user_id
    ) as last_comment_date
  FROM profiles p
  WHERE EXISTS (
    SELECT 1 FROM advent_comments 
    WHERE reg_id = p.user_id
  )
  ORDER BY last_comment_date DESC
  LIMIT 10
`);
```

### 8. CTE (Common Table Expression) 사용

```typescript
import { executeSql } from '@src/lib/utils/sql';

// 복잡한 통계 쿼리
const { data, error } = await executeSql(`
  WITH daily_stats AS (
    SELECT 
      post_dt,
      COUNT(DISTINCT user_id) as attendance_count
    FROM advent_attendance
    WHERE post_dt >= '20251201'
    GROUP BY post_dt
  ),
  comment_stats AS (
    SELECT 
      post_dt,
      COUNT(DISTINCT reg_id) as comment_count
    FROM advent_comments
    WHERE post_dt >= '20251201'
    GROUP BY post_dt
  )
  SELECT 
    COALESCE(ds.post_dt, cs.post_dt) as date,
    COALESCE(ds.attendance_count, 0) as attendance,
    COALESCE(cs.comment_count, 0) as comments
  FROM daily_stats ds
  FULL OUTER JOIN comment_stats cs ON ds.post_dt = cs.post_dt
  ORDER BY date
`);
```

## ⚠️ 주의사항

1. **SQL 인젝션 방지**: 항상 매개변수화된 쿼리 사용 (`$1`, `$2` 등)
2. **에러 처리**: 항상 `error` 체크
3. **성능**: 복잡한 쿼리는 인덱스 확인
4. **트랜잭션**: 여러 쿼리를 하나의 트랜잭션으로 묶으려면 RPC 함수 사용

## 🔄 기존 Supabase ORM과 비교

### Before (Supabase ORM)
```typescript
const { data, error } = await supabaseAdmin
  .from('profiles')
  .select(`
    user_id,
    name,
    email,
    hub_groups:group_id (id, name),
    hub_cells:cell_id (id, name)
  `)
  .eq('group_id', 1)
  .eq('cell_id', 5)
  .order('name');
```

### After (순수 SQL)
```typescript
const { data, error } = await executeSqlWithParams(`
  SELECT 
    p.user_id,
    p.name,
    p.email,
    g.id as group_id,
    g.name as group_name,
    c.id as cell_id,
    c.name as cell_name
  FROM profiles p
  LEFT JOIN hub_groups g ON p.group_id = g.id
  LEFT JOIN hub_cells c ON p.cell_id = c.id
  WHERE p.group_id = $1 AND p.cell_id = $2
  ORDER BY p.name
`, [1, 5]);
```

## 💡 장점

1. **직관적**: SQL을 그대로 작성
2. **유연함**: 복잡한 JOIN, 서브쿼리, CTE 자유롭게 사용
3. **성능**: 필요한 컬럼만 선택 가능
4. **디버깅**: SQL을 직접 테스트 가능 (Supabase SQL Editor)

## 📚 참고

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Supabase SQL Editor](https://app.supabase.com)



