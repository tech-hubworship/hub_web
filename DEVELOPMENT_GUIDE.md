# HUB Worship 개발 가이드

## 📋 프로젝트 개요

HUB Worship 웹사이트는 Next.js 기반의 현대적인 웹 애플리케이션입니다. 
성능 최적화와 사용자 경험을 중시하는 설계로 구현되었으며, **일반 SQL 쿼리**를 사용하여 데이터베이스와 상호작용합니다.

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   │   ├── Carousel/   # 캐러셀 컴포넌트
│   │   ├── LoadingScreen/ # 로딩 화면
│   │   ├── RoundButton/   # 라운드 버튼
│   │   └── ScrollToTopButton/ # 스크롤 투 탑 버튼
│   ├── Header/         # 헤더 컴포넌트
│   │   ├── Desktop/    # 데스크톱 헤더
│   │   └── Mobile/     # 모바일 헤더
│   ├── Footer/         # 푸터 컴포넌트
│   │   ├── OriginFooter/   # 원본 푸터
│   │   └── MakersNForm/    # 메이커스 폼
│   └── Layout/         # 레이아웃 컴포넌트
├── views/              # 페이지별 뷰 컴포넌트
│   └── MainPage/       # 메인 페이지 (지연 로딩 최적화)
├── pages/              # Next.js 페이지 라우트
│   ├── api/            # API 라우트
│   │   ├── announcements/  # 공지사항 API
│   │   ├── faqs/           # FAQ API
│   │   ├── inquiries/      # 문의사항 API
│   │   └── downloads/      # 다운로드 API
│   ├── admin/          # 관리자 페이지
│   └── index.tsx       # 메인 페이지
├── lib/                # 유틸리티 및 설정
│   ├── database/       # 데이터베이스 스키마 및 SQL 함수
│   ├── api/            # API 클라이언트
│   ├── styles/         # 글로벌 스타일
│   └── supabase.ts     # Supabase 클라이언트 설정
├── hooks/              # 커스텀 훅
├── contexts/           # React 컨텍스트
├── store/              # 상태 관리 (Zustand)
└── assets/             # 정적 자산
```

## 🚀 개발 환경 설정

### 필수 요구사항
- Node.js 18.x 이상
- pnpm (권장 패키지 매니저)
- Supabase 계정

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (특정 IP로)
pnpm dev

# 개발 서버 실행 (localhost)
pnpm dev1

# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

### 환경 변수 설정

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

## 🗄️ 데이터베이스 설정

### Supabase 설정

1. **프로젝트 생성**: [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. **스키마 실행**: `src/lib/database/schema.sql` 파일을 SQL Editor에서 실행
3. **RLS 설정**: Row Level Security 정책 설정
4. **함수 생성**: `execute_sql` 및 기타 커스텀 함수 생성

### 스키마 구조

```sql
-- 핵심 테이블
CREATE TABLE downloads (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    remaining_count INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
```

## 🎨 컴포넌트 개발 가이드

### 컴포넌트 구조

각 컴포넌트는 다음 구조를 따릅니다:

```typescript
/**
 * 컴포넌트 설명
 * 
 * 상세 기능 설명
 * - 주요 기능 1
 * - 주요 기능 2
 * 
 * @author 개발자명
 * @version 버전
 */

import React from 'react';

interface ComponentProps {
  // Props 타입 정의
}

/**
 * 컴포넌트 설명
 */
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 컴포넌트 로직
  
  return (
    <div>
      {/* JSX 내용 */}
    </div>
  );
};

export default Component;
```

### 스타일링 가이드

- **Emotion**을 사용한 CSS-in-JS
- **styled-components** 패턴 사용
- 반응형 디자인 우선 고려
- 접근성(Accessibility) 준수
- **px 단위 사용** (rem 대신 px 사용)

```typescript
import styled from '@emotion/styled';

const StyledComponent = styled.div`
  width: 100%;
  padding: 16px;
  font-size: 14px; /* px 단위 사용 */
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 12px;
  }
`;
```

## 🔌 API 개발 가이드

### API 라우트 구조

```typescript
/**
 * API 엔드포인트 설명
 * GET: 조회 기능
 * POST: 생성 기능
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';

// GET: 데이터 조회
export async function getData(): Promise<DataType[]> {
  const { data, error } = await supabaseAdmin
    .from('table_name')
    .select('*')
    .eq('condition', value);
    
  if (error) throw error;
  return data;
}

// POST: 데이터 생성
export async function createData(input: CreateDataInput): Promise<DataType> {
  const { data, error } = await supabaseAdmin
    .from('table_name')
    .insert(input)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// API 핸들러
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const data = await getData();
        res.status(200).json({ success: true, data });
        break;
        
      case 'POST':
        const newData = await createData(req.body);
        res.status(201).json({ success: true, data: newData });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
```

### 일반 SQL 쿼리 사용법

현재 프로젝트는 Supabase ORM 대신 일반 SQL 쿼리를 사용합니다:

```typescript
// 1. execute_sql 함수 사용
const { data, error } = await supabaseAdmin.rpc('execute_sql', {
  query: 'SELECT * FROM downloads WHERE key = $1',
  params: ['wallpaper_downloads']
});

// 2. 커스텀 함수 사용
const { data, error } = await supabaseAdmin.rpc('get_remaining_downloads');

// 3. Supabase ORM 사용 (fallback)
const { data, error } = await supabaseAdmin
  .from('downloads')
  .select('*')
  .eq('key', 'wallpaper_downloads');
```

### 데이터베이스 쿼리 가이드

- **매개변수화된 쿼리** 사용 (SQL 인젝션 방지)
- **트랜잭션** 활용 (데이터 일관성 보장)
- **인덱스** 최적화 고려
- **에러 핸들링** 필수

```typescript
// 올바른 쿼리 작성
const { data, error } = await supabaseAdmin.rpc('execute_sql', {
  query: `
    SELECT u.*, p.title 
    FROM users u 
    LEFT JOIN posts p ON u.id = p.user_id 
    WHERE u.status = $1 AND u.created_at > $2
    ORDER BY u.created_at DESC
    LIMIT $3 OFFSET $4
  `,
  params: ['active', '2024-01-01', 10, 0]
});
```

## 🎯 성능 최적화

### 지연 로딩 (Lazy Loading)

```typescript
import dynamic from 'next/dynamic';

// 컴포넌트 지연 로딩
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
```

### 뷰포트 기반 로딩

```typescript
import { useInView } from 'react-intersection-observer';

const LazySection = ({ children }: { children: React.ReactNode }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '200px 0px'
  });

  return (
    <div ref={ref}>
      {inView && children}
    </div>
  );
};
```

### 이미지 최적화

```typescript
import Image from 'next/image';

// Next.js Image 컴포넌트 사용
<Image
  src="/images/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority // 중요 이미지는 우선 로딩
  placeholder="blur" // 블러 플레이스홀더
/>
```

### MainPage 지연 로딩 구현

```typescript
// MainPage/index.tsx에서 사용하는 패턴
const LazyLoadSection = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '200px 0px'
  });

  return (
    <div ref={ref} className={className}>
      {inView && children}
    </div>
  );
};

// 사용 예시
<LazyLoadSection>
  <WallpaperDownload />
</LazyLoadSection>
```

## 🧪 테스트 가이드

### 단위 테스트

```typescript
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop1="test" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### API 테스트

```typescript
import { createMocks } from 'node-mocks-http';
import handler from './api/endpoint';

describe('/api/endpoint', () => {
  it('returns data successfully', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### 다운로드 API 테스트

```bash
# 다운로드 수 조회 테스트
curl -X GET http://localhost:3000/api/downloads/decrement

# 다운로드 카운트 차감 테스트
curl -X POST http://localhost:3000/api/downloads/decrement

# 응답 확인
{"success":true,"data":{"remaining_count":999}}
```

## 📱 반응형 디자인

### 브레이크포인트

```typescript
const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
};

// 미디어 쿼리 사용
const ResponsiveComponent = styled.div`
  padding: 16px;
  font-size: 14px;
  
  @media (min-width: ${breakpoints.tablet}) {
    padding: 24px;
    font-size: 16px;
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    padding: 32px;
    font-size: 18px;
  }
`;
```

### 모바일 최적화

```typescript
// Header/Mobile/index.tsx에서 사용하는 패턴
const MobileHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  
  @media (min-width: 768px) {
    display: none; // 데스크톱에서는 숨김
  }
`;
```

## 🔒 보안 가이드

### 인증 및 인가

```typescript
// JWT 토큰 검증 (향후 구현 예정)
import jwt from 'jsonwebtoken';

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 입력 검증

```typescript
// 문의사항 폼 검증 예시
const validateInquiry = (data: any) => {
  if (!data.message || data.message.trim().length < 10) {
    throw new Error('문의 내용은 10자 이상 입력해주세요.');
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('올바른 이메일 형식을 입력해주세요.');
  }
};
```

### RLS (Row Level Security)

```sql
-- Supabase에서 RLS 설정
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- 서비스 역할 키로 모든 작업 허용
CREATE POLICY "Service role access" ON downloads FOR ALL USING (auth.role() = 'service_role');

-- 공개 읽기 정책
CREATE POLICY "Public read access" ON announcements FOR SELECT USING (is_active = true);
```

## 🚀 배포 가이드

### Vercel 배포

1. GitHub 저장소 연결
2. 환경 변수 설정:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
3. 빌드 명령어 설정: `pnpm build`
4. 배포

### Docker 배포

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## 🔍 디버깅 가이드

### 로그 확인

```typescript
// API에서 상세한 로그 출력
console.log('데이터베이스에서 다운로드 수 조회 시작...');
console.log('SQL 조회 성공:', data.remaining_count);
console.log('데이터베이스에서 카운트 차감 성공:', updateData.remaining_count);
```

### 일반적인 문제 해결

1. **Supabase 연결 오류**
   - 환경 변수 확인
   - API 키 유효성 검증
   - 네트워크 연결 확인

2. **SQL 함수 오류**
   - `execute_sql` 함수가 생성되었는지 확인
   - 함수 실행 권한 확인
   - SQL 문법 오류 확인

3. **RLS 정책 오류**
   - 서비스 역할 키 사용 확인
   - 정책 설정 확인
   - 권한 매트릭스 확인

## 📚 추가 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev/)
- [Emotion 공식 문서](https://emotion.sh/docs/introduction)
- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

## 🤝 기여 가이드

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

---

**HUB Development Team** | 2024