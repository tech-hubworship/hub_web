# HUB Worship 웹사이트

HUB Worship 웹사이트는 Next.js 기반의 현대적인 웹 애플리케이션입니다. 성능 최적화와 사용자 경험을 중시하는 설계로 구현되었으며, **일반 SQL 쿼리**를 사용하여 데이터베이스와 상호작용합니다.

## 🚀 주요 기능

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **성능 최적화**: 지연 로딩, 코드 분할, 이미지 최적화
- **현대적인 UI/UX**: Emotion을 활용한 CSS-in-JS 스타일링
- **SEO 최적화**: Next.js의 SSR/SSG 기능 활용
- **관리자 기능**: 공지사항, FAQ, 문의사항 관리
- **배경화면 다운로드**: 통계 기능이 포함된 다운로드 시스템
- **일반 SQL 쿼리**: Supabase ORM 대신 순수 SQL 쿼리 사용

## 🛠️ 기술 스택

### Frontend
- **Next.js 15.2.3** - React 프레임워크
- **React 19.0.0** - UI 라이브러리
- **TypeScript 5.8.2** - 타입 안전성
- **Emotion** - CSS-in-JS 스타일링
- **Framer Motion** - 애니메이션
- **React Query** - 데이터 페칭 및 캐싱
- **React Intersection Observer** - 뷰포트 기반 지연 로딩

### Backend
- **Next.js API Routes** - 서버리스 API
- **Supabase** - 백엔드 서비스 및 PostgreSQL 데이터베이스
- **일반 SQL 쿼리** - `execute_sql` 함수를 통한 순수 SQL 실행

### 개발 도구
- **ESLint** - 코드 품질 관리
- **Prettier** - 코드 포맷팅
- **Husky** - Git 훅 관리
- **pnpm** - 패키지 매니저

## 📋 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- pnpm (권장)
- Supabase 계정

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/your-username/hub_web.git
cd hub_web
```

2. **의존성 설치**
```bash
pnpm install
```

3. **환경 변수 설정**
```bash
# .env.local 파일을 생성하고 다음 변수들을 설정하세요:
# Supabase 설정 (필수)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

4. **Supabase 데이터베이스 설정**
```bash
# Supabase 프로젝트에서 다음을 설정하세요:
# 1. 스키마 파일 실행: src/lib/database/schema.sql
# 2. RLS 정책 설정
# 3. execute_sql 함수 생성
# 자세한 내용은 SUPABASE_SETUP.md 참조
```

5. **개발 서버 실행**
```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트 (Carousel, LoadingScreen, RoundButton 등)
│   ├── Header/         # 헤더 컴포넌트 (Desktop, Mobile)
│   ├── Footer/         # 푸터 컴포넌트 (OriginFooter, MakersNForm)
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
│   ├── login.tsx       # 로그인 페이지
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
    ├── icons/          # SVG 아이콘
    ├── images/         # 이미지 파일
    └── mainLogo/       # 메인 로고
```

## 🔧 개발 명령어

```bash
# 개발 서버 실행 (특정 IP로)
pnpm dev

# 개발 서버 실행 (localhost)
pnpm dev1

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 코드 린팅
pnpm lint

# 코드 포맷팅
pnpm format

# Vercel 배포용 빌드
pnpm vercel-deploy
```

## 📚 문서

- [개발 가이드](./DEVELOPMENT_GUIDE.md) - 상세한 개발 가이드
- [API 문서](./API_DOCUMENTATION.md) - REST API 문서
- [프로젝트 구조](./PROJECT_STRUCTURE.md) - 프로젝트 구조 설명
- [협업 가이드](./COLLABORATION_GUIDE.md) - 팀 협업 가이드
- [Supabase 설정](./SUPABASE_SETUP.md) - Supabase 설정 가이드

## 🎯 주요 컴포넌트

### MainPage
- **지연 로딩**: `useInView`를 통한 뷰포트 기반 컴포넌트 로딩
- **동적 import**: 코드 분할을 통한 성능 최적화
- **배경화면 다운로드**: 실시간 카운트 관리

### Header
- **반응형 네비게이션**: 모바일/데스크톱 대응
- **스크롤 효과**: 스크롤 시 투명도 변경
- **햄버거 메뉴**: 모바일 네비게이션

### Footer
- **문의사항 폼**: 실시간 폼 처리
- **소셜 미디어 링크**: 외부 링크 통합
- **저작권 정보**: 법적 고지사항

## 🗄️ 데이터베이스

Supabase PostgreSQL을 사용하며, 다음 테이블들을 포함합니다:

### 핵심 테이블
- `downloads` - 다운로드 제한 관리
- `download_stats` - 다운로드 통계
- `announcements` - 공지사항
- `faqs` - 자주 묻는 질문
- `inquiries` - 문의사항

### 사용자 관련 테이블
- `users` - 사용자 정보
- `admins` - 관리자 정보
- `tshirt_orders` - 티셔츠 주문
- `meal_applications` - 식사 신청
- `accommodation_applications` - 숙소 신청
- `lost_items` - 분실물

### SQL 함수
- `execute_sql()` - 일반 SQL 쿼리 실행
- `get_remaining_downloads()` - 다운로드 수 조회
- `decrement_download_count()` - 다운로드 카운트 차감
- `get_download_stats()` - 다운로드 통계 조회
- `record_download()` - 다운로드 기록 추가

## 🔌 API 엔드포인트

### 다운로드 관련
- `GET /api/downloads/decrement` - 남은 다운로드 수 조회
- `POST /api/downloads/decrement` - 다운로드 카운트 차감

### 콘텐츠 관리
- `GET /api/announcements` - 공지사항 목록 조회
- `POST /api/announcements` - 공지사항 생성 (관리자)
- `GET /api/faqs` - FAQ 목록 조회
- `POST /api/faqs` - FAQ 생성 (관리자)

### 문의 관리
- `GET /api/inquiries` - 문의사항 목록 조회 (관리자)
- `POST /api/inquiries` - 문의사항 등록
- `PUT /api/inquiries` - 문의사항 상태 업데이트 (관리자)

## 🚀 배포

### Vercel (권장)

1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
3. 빌드 명령어: `pnpm build`
4. 자동 배포 완료

### Docker

```bash
# Docker 이미지 빌드
docker build -t hub-worship .

# 컨테이너 실행
docker run -p 3000:3000 hub-worship
```

## 🧪 테스트

### API 테스트

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

### 웹 인터페이스 테스트

1. 개발 서버 실행: `pnpm dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 배경화면 다운로드 섹션에서 카운트 확인
4. 다운로드 버튼 클릭하여 카운트 차감 테스트

## 🔒 보안

- **Row Level Security (RLS)**: Supabase에서 테이블별 접근 제어
- **서비스 역할 키**: 서버 사이드 API에서 사용
- **환경 변수**: 민감한 정보 보호
- **SQL 인젝션 방지**: 매개변수화된 쿼리 사용

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

---

**HUB Development Team** | 2024