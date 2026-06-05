# HUB Worship 웹 플랫폼

HUB Worship 공동체를 위한 올인원 웹 플랫폼입니다. 수련회 신청부터 출석 관리, 챌린지, 미디어 콘텐츠, 커뮤니티 앱까지 교회 공동체 운영에 필요한 기능을 통합 제공합니다.

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [기능 상세](#-기능-상세)
  - [HUB-UP 수련회 시스템](#1-hub-up-수련회-시스템)
  - [출석 관리 시스템](#2-출석-관리-시스템)
  - [HUB 챌린지](#3-hub-챌린지)
  - [영상 이벤트 (대강절 / 사순절)](#4-영상-이벤트-대강절--사순절)
  - [말씀카드](#5-말씀카드)
  - [커뮤니티 앱](#6-커뮤니티-앱)
  - [미디어 / 콘텐츠](#7-미디어--콘텐츠)
  - [관리자 시스템](#8-관리자-시스템)
- [API 엔드포인트](#-api-엔드포인트)
- [데이터베이스](#-데이터베이스)
- [환경 변수](#-환경-변수)
- [개발 명령어](#-개발-명령어)
- [배포](#-배포)
- [보안](#-보안)

---

## 🚀 주요 기능

| 기능 | 설명 |
|------|------|
| 🏕️ **HUB-UP 수련회** | 신청, 정원 관리, 대기자 명단, 버스 배정, 티셔츠 주문 |
| ✅ **출석 관리** | QR 체크인, 지각비 자동 계산, OD 리더십 출석, 전체 통계 |
| 🔥 **HUB 챌린지** | 레위기 19장 기반 19일 실천 챌린지 + 나눔 게시판 |
| 🎬 **영상 이벤트** | 대강절/사순절 영상 + 댓글 + 출석 (시즌별 슬러그 재사용) |
| 📖 **말씀카드** | 신청 → 목회자 검토 → 개인화 카드 다운로드 |
| 🙏 **기도 시간** | 기도 세션 트래킹, 개인/커뮤니티 통계 |
| 📚 **신앙 용어 사전** | 교회 용어 검색 및 관리 |
| 🖼️ **미디어 갤러리** | 사진 폴더별 갤러리, 배경화면 다운로드 |
| 🔧 **통합 어드민** | MDI 탭 방식 관리자 대시보드 |

---

## 🛠️ 기술 스택

### Frontend
- **Next.js 15.2.6** — App Router + Turbopack
- **React 18** — UI 라이브러리
- **TypeScript 5.8.2** — 타입 안전성
- **Emotion** — CSS-in-JS 스타일링
- **Ant Design 5** — UI 컴포넌트
- **Framer Motion** — 애니메이션
- **Recharts** — 통계 차트

### 상태 관리 / 데이터 페칭
- **TanStack React Query v5** — 서버 상태 관리
- **Zustand** — 클라이언트 상태 관리
- **Recoil** — 전역 상태 (일부 사용)

### 인증
- **NextAuth v4** — 소셜 로그인 + 세션 관리
- **@next-auth/supabase-adapter** — Supabase 연동

### Backend / DB
- **Next.js API Routes** — 서버리스 API
- **Supabase** — PostgreSQL 데이터베이스 + Auth
- **pg** — 직접 DB 연결 (일부 API)

### QR / 외부 연동
- **html5-qrcode**, **qrcode.react**, **@zxing/library** — QR 코드 생성·스캔
- **Google APIs** — 캘린더 연동
- **Cloudinary** — 이미지 업로드/관리
- **Amplitude** — 사용자 행동 분석
- **Vercel Analytics + Speed Insights** — 성능 모니터링

### 개발 도구
- **pnpm** — 패키지 매니저 (npm/yarn 사용 불가)
- **ESLint + Prettier** — 코드 품질
- **Husky + lint-staged** — Git 훅
- **dayjs** — 날짜 처리 (KST 기준)

---

## 📋 시작하기

### 필수 요구사항

- **Node.js** >= 20.0.0
- **pnpm** (npm, yarn 사용 금지)
- **Supabase** 프로젝트

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/hub_web.git
cd hub_web

# 의존성 설치 (반드시 pnpm 사용)
pnpm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 아래 변수를 설정합니다.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# Google (캘린더 연동, 선택)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary (이미지 업로드, 선택)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 데이터베이스 초기화

```bash
# Supabase 대시보드 > SQL Editor에서 실행
src/lib/database/schema.sql

# 이후 추가 마이그레이션 순서대로 실행
migrations/add_bible_indexes.sql
migrations/add_tech_inquiries_feedback.sql
migrations/add_tshirt_received_at.sql
migrations/add_admin_deposit_confirm.sql
migrations/fix_volunteer_team_dash.sql
```

### 개발 서버 실행

```bash
# 로컬 네트워크 공개 (모바일 테스트용)
pnpm dev

# localhost 전용
pnpm dev1
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 📁 프로젝트 구조

```
hub_web/
├── @types/                    # 전역 타입 정의
│   ├── index.d.ts
│   └── next-auth.d.ts
├── migrations/                # DB 마이그레이션 SQL
├── public/                    # 정적 에셋
│   ├── icons/                 # SVG 아이콘
│   └── images/                # 이미지 (수련회, 챌린지, 티셔츠 등)
└── src/
    ├── app/                   # Next.js App Router 페이지
    │   ├── (사용자 페이지)/
    │   ├── hub_up/            # 수련회 관련 페이지
    │   ├── attendance/        # 출석 페이지
    │   ├── apps/              # 커뮤니티 앱 페이지
    │   ├── admin/             # 관리자 페이지
    │   └── api/               # API Routes
    ├── components/            # 재사용 컴포넌트
    │   ├── common/            # 공통 UI (Button, Modal, Loading 등)
    │   ├── Header/            # 반응형 헤더
    │   ├── Footer/            # 푸터 + 문의 폼
    │   └── Layout/            # 레이아웃 래퍼
    ├── views/                 # 페이지별 뷰 컴포넌트
    │   ├── MainPage/
    │   ├── AdminPage/
    │   └── ...
    ├── lib/                   # 유틸리티 및 설정
    │   ├── supabase.ts        # Supabase 클라이언트
    │   ├── auth.ts            # NextAuth 설정
    │   ├── attendance/        # 지각비 계산 로직
    │   ├── hub-challenge/     # 챌린지 데이터 + 헬퍼
    │   ├── video-event/       # 이벤트 설정 + 타입
    │   ├── calendar/          # 캘린더 유틸
    │   ├── database/          # SQL 스키마, 쿼리
    │   ├── styles/            # 글로벌 스타일
    │   └── utils/             # 날짜, 권한 등 유틸
    ├── hooks/                 # 커스텀 훅
    ├── store/                 # Zustand 스토어
    └── contexts/              # React Context
```

---

## 🔍 기능 상세

### 1. HUB-UP 수련회 시스템

수련회 참가 신청부터 현장 운영까지 전 과정을 지원합니다.

#### 사용자 기능
| 경로 | 기능 |
|------|------|
| `/hub_up` | 수련회 메인 — 신청 현황, 공지, 배너 |
| `/hub_up/register` | 신청서 작성 (개인정보, 버스/자동차, 봉사팀, 선택강의, 입금 확인) |
| `/hub_up/myinfo` | 내 신청 정보 확인 및 수정 |
| `/hub_up/tshirt` | 티셔츠 사이즈 주문 |
| `/hub_up/faq` | 자주 묻는 질문 |
| `/hub_up/challenge` | HUB 챌린지 참여 |

#### 신청 로직
- 정원(기본 700명) 이하: 정식 명단 (`is_waitlist = false`)
- 정원 초과: 대기자 명단 (`is_waitlist = true`) 자동 전환
- 중복 신청 방지 (user_id 기준)
- 정원 수는 `hub_up_config` 테이블에서 동적 조정 가능

#### 신청 항목
- 공동체, 그룹, 리더 이름
- 개인정보 (이름, 성별, 생년월일, 연락처)
- 개인정보 동의
- 버스 슬롯 (출발/귀환) 또는 자동차 정보 (역할, 탑승인원, 차량번호 등)
- 선택 강의
- 봉사팀, 중보기도팀 참여 여부
- 입금 확인 여부

#### 티셔츠 관리
- 사이즈별 주문 접수
- 관리자 수령 처리 (`received_at` 타임스탬프 기록)
- 수령 현황 통계

---

### 2. 출석 관리 시스템

QR 코드 기반 실시간 출석 체크 시스템입니다.

#### 사용자 기능
| 경로 | 기능 |
|------|------|
| `/attendance/my` | 내 출석 이력 및 지각비 현황 |
| `/attendance/check-OD` | OD(리더십) 출석 QR 스캔 |

#### 출석 체크 흐름
1. 관리자가 QR 토큰 생성 (카테고리 + 지각 기준 시각 포함)
2. 사용자가 QR 스캔 → `/api/attendance/check-in` 호출
3. 토큰 유효성 검증 (만료 후 2분 Grace Period 적용)
4. 지각 여부 자동 판정 및 지각비 계산
5. `weekly_attendance` 테이블에 결과 저장

#### 지각비 정책
- 지각 기준 시각 기준으로 자동 계산
- 지각비 면제(`late_fee_excused`) / OD 보고서 면제(`report_excused`) 개별 적용 가능
- 이미 출석된 경우 면제 상태 보존하면서 재출석 처리

#### OD 출석 제한
- `attendance_od_targets` 명단에 없는 사용자 접근 제한
- 리더십 권한(`admin_roles`) 보유 시 자동 허용
- 비대상자 접근 시 소속 정보(공동체, 그룹, 셀) 포함 에러 반환

#### 관리자 기능
| 경로 | 기능 |
|------|------|
| `/admin/attendance/qr` | QR 토큰 생성 |
| `/admin/attendance/late-fees` | 지각비 관리 및 면제 처리 |
| `/admin/attendance/od-roster` | OD 명단 관리 |
| `/admin/attendance/overall-stats` | 전체 출석 통계 (Recharts 차트) |

---

### 3. HUB 챌린지

레위기 19장을 기반으로 한 19일 실천 챌린지입니다.

- **기간**: 2026.04.27(월) ~ 2026.05.15(목)
- **내용**: 매일 말씀 + 2~3가지 실천 항목
- **나눔**: 하루 1회 나눔 작성 (익명화, 페이지네이션)
- **진행도**: 개인별 챌린지 참여 이력 추적

#### API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/hub-challenge/shares` | 일별 나눔 목록 조회 (no-store 캐시) |
| `POST` | `/api/hub-challenge/shares` | 나눔 작성 (하루 1회 제한) |
| `PATCH` | `/api/hub-challenge/shares` | 내 나눔 수정 |
| `GET` | `/api/hub-challenge/my-progress` | 내 진행도 조회 |

---

### 4. 영상 이벤트 (대강절 / 사순절)

시즌별 영상 이벤트를 슬러그 방식으로 재사용 가능하게 설계되었습니다.

- **현재 이벤트**: 사순절 (`EVENT_SLUG: "lent"`)
- **지원 슬러그**: `advent`, `lent`
- **이벤트 전환 시**: `src/lib/video-event/constants.ts`의 `EVENT_SLUG`, `BASE_DATE`, `END_DATE`, `DISPLAY_NAME`만 변경

#### 기능
- 날짜별 영상 게시물 조회
- 댓글 작성/조회
- 영상 출석 체크
- 관리자 통계 (참여율, 날짜별 현황)

#### 관리자 기능
| 경로 | 기능 |
|------|------|
| `/admin/video-event` | 게시물 관리, 댓글 관리, 출석 현황, 통계 |

---

### 5. 말씀카드

개인화 말씀카드 신청 및 발급 시스템입니다.

#### 플로우
1. 사용자 신청 (`/bible-card`)
2. 목회자 검토 및 확인
3. 카드 생성 후 다운로드 (`/bible-card/download`)

#### 관리자 기능
| 경로 | 기능 |
|------|------|
| `/admin/bible-card` | 신청 목록 관리 |
| `/admin/bible-card/pastor` | 목회자 전용 검토 페이지 |
| `/admin/bible-card/completed` | 완료 목록 |

---

### 6. 커뮤니티 앱

교회 생활을 돕는 소형 앱들의 모음입니다.

#### 기도 시간 트래커 (`/apps/prayer-time`)
- 기도 세션 시작/종료 기록
- 개인 누적 기도 시간 통계
- 커뮤니티 전체 기도 현황

#### 신앙 용어 사전 (`/apps/glossary`)
- 교회/신학 용어 검색
- 관리자 용어 추가/수정/삭제

#### 분실물 게시판 (`/apps/lost-found`)
- 분실물 등록 및 조회
- 상태 관리 (미수령 / 수령 완료)

#### 식당 추천 (`/apps/restaurant`)
- 주변 식당 목록 및 정보
- 카테고리별 필터

#### Q&A (`/apps/qa`)
- 질문 등록 및 답변

#### 다락방 그룹 앱 (`/apps/[groups]/[darakbang]`)
- 그룹/다락방별 전용 앱 페이지

---

### 7. 미디어 / 콘텐츠

#### 사진 갤러리
- 폴더 구조로 사진 관리
- `/media-gallery/[folderId]` — 폴더별 사진 갤러리
- 관리자: 폴더/사진 업로드, 예약 업로드 기능

#### 배경화면 다운로드
- 남은 다운로드 수 실시간 표시
- 다운로드 통계 기록

#### Hub 4컷 (`/hub4cut`)
- 4컷 사진 이벤트 페이지

#### 캘린더 (`/calendar`)
- Google Calendar 연동 일정 조회
- 공개 일정 API (`/api/public/calendar-events`)

---

### 8. 관리자 시스템

MDI(Multi Document Interface) 탭 방식의 통합 관리자 대시보드입니다.

#### 접근 제어
- `admin_roles` + `roles` 테이블 기반 RBAC
- 역할: 리더십, MC, 목회자, 그룹장, 다락방장 등
- `lib/utils/menu-permission.ts`로 메뉴별 권한 제어

#### 관리 영역

| 영역 | 경로 | 주요 기능 |
|------|------|-----------|
| 출석 | `/admin/attendance/*` | QR 생성, 지각비 관리, OD 명단, 전체 통계 |
| 수련회 | `/admin/hub-up` | 신청자 목록, 입금 확인, 대기자 처리 |
| 티셔츠 | `/admin/hub-up/tshirt-pickup` | 수령 처리 |
| 말씀카드 | `/admin/bible-card/*` | 신청 관리, 목회자 검토 |
| 영상 이벤트 | `/admin/video-event` | 게시물·댓글·출석·통계 관리 |
| 사진 | `/admin/photos` | 업로드, 폴더 관리, 예약 관리 |
| 회원 | `/admin/users` | 회원 목록 및 정보 |
| 권한 | `/admin/roles` | 역할 및 권한 관리 |
| 앱 | `/admin/apps/*` | 용어집, 분실물, 기도시간, 식당 관리 |
| 총무 | `/admin/secretary` | 총무 기능 |
| 캘린더 | `/admin/calendar` | 일정 관리 |
| 디자인 | `/admin/design` | 디자인 에셋 관리 |

---

## 🔌 API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/auth/[...nextauth]` | 소셜 로그인 (NextAuth) |
| `POST` | `/api/auth/complete-profile` | 최초 로그인 후 프로필 완성 |
| `GET` | `/api/auth/validate-admin` | 관리자 권한 검증 |

### HUB-UP 수련회
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/hub-up/register` | 수련회 신청 |
| `GET/PUT` | `/api/hub-up/myinfo` | 내 신청 정보 |
| `GET/PUT` | `/api/hub-up/tshirt` | 티셔츠 주문 |
| `GET` | `/api/hub-up/config` | 수련회 설정 (s-maxage 300) |
| `GET` | `/api/hub-up/form-data` | 신청 폼 데이터 (s-maxage 30) |
| `POST` | `/api/hub-up/bus-change-token` | 버스 변경 토큰 발급 |
| `GET` | `/api/admin/hub-up/unpaid-tracker` | 미입금 현황 (관리자) |

### 출석
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/attendance/check-in` | QR 출석 체크 |
| `GET` | `/api/attendance/my` | 내 출석 이력 |
| `GET` | `/api/attendance/list` | 출석 목록 (관리자) |
| `POST` | `/api/attendance/generate-qr` | QR 토큰 생성 |

### HUB 챌린지
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/hub-challenge/shares` | 나눔 목록 (no-store) |
| `POST` | `/api/hub-challenge/shares` | 나눔 작성 |
| `PATCH` | `/api/hub-challenge/shares` | 나눔 수정 |
| `GET` | `/api/hub-challenge/my-progress` | 내 진행도 |

### 영상 이벤트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/video-event/posts` | 날짜별 게시물 (캐시 1시간) |
| `GET` | `/api/video-event/comments` | 댓글 목록 |
| `POST` | `/api/video-event/attendance` | 영상 출석 체크 |
| `GET` | `/api/video-event/stats` | 통계 |

### 말씀카드
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/bible-card/apply` | 신청 |
| `GET` | `/api/bible-card/my-application` | 내 신청 현황 |
| `GET` | `/api/bible-card/download` | 카드 다운로드 |

### 기도 시간
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/prayer-time/start` | 기도 시작 |
| `POST` | `/api/prayer-time/stop` | 기도 종료 |
| `GET` | `/api/prayer-time/my-stats` | 내 통계 |
| `GET` | `/api/prayer-time/community` | 커뮤니티 통계 |

### 공개 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/public/calendar-events` | 공개 일정 |
| `GET` | `/api/public/photos` | 공개 사진 |
| `GET` | `/api/public/restaurant` | 식당 목록 |
| `GET` | `/api/public/lost-found` | 분실물 목록 |

### 기타
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/glossary/search` | 용어 검색 |
| `POST` | `/api/inquiries` | 문의 등록 |
| `GET/POST` | `/api/tech-inquiries` | 기술 문의 (관리자 답변 포함) |
| `GET` | `/api/survey/check-submission` | 설문 중복 제출 확인 |

---

## 🗄️ 데이터베이스

Supabase(PostgreSQL)를 사용합니다. 주요 테이블 목록입니다.

### 사용자 / 권한
| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (이름, 공동체, 그룹, 셀) |
| `hub_groups` | 그룹 계층 |
| `hub_cells` | 셀 계층 |
| `admin_roles` | 사용자-역할 매핑 |
| `roles` | 역할 정의 |

### HUB-UP 수련회
| 테이블 | 설명 |
|--------|------|
| `hub_up_registrations` | 수련회 신청서 (버스, 자동차, 봉사팀, 대기자 여부, 입금 확인) |
| `hub_up_tshirt_orders` | 티셔츠 주문 (사이즈, 수령 시각) |
| `hub_up_config` | 수련회 설정 (정원, 버스 슬롯) |

### 출석
| 테이블 | 설명 |
|--------|------|
| `weekly_attendance` | 주간 출석 기록 (status, late_fee, is_excused) |
| `qr_tokens` | QR 출석 토큰 (유효시간, 지각 기준) |
| `attendance_od_targets` | OD 출석 대상 명단 |

### 이벤트
| 테이블 | 설명 |
|--------|------|
| `video_event_posts` | 영상 이벤트 게시물 |
| `video_event_comments` | 댓글 |
| `video_event_attendance` | 영상 출석 기록 |
| `hub_challenge_shares` | 챌린지 나눔 게시물 |

### 말씀카드
| 테이블 | 설명 |
|--------|------|
| `bible_card_applications` | 말씀카드 신청 (pending → 검토 → 완료) |

### 커뮤니티 앱
| 테이블 | 설명 |
|--------|------|
| `prayer_time_sessions` | 기도 시간 세션 |
| `lost_found_items` | 분실물 |
| `restaurant_places` | 식당 정보 |
| `glossary_terms` | 신앙 용어 사전 |

### 기타
| 테이블 | 설명 |
|--------|------|
| `tech_inquiries` | 기술 문의 + 관리자 답변 |
| `photo_folders` | 사진 폴더 |
| `photos` | 사진 |
| `downloads` | 배경화면 다운로드 카운터 |
| `download_stats` | 다운로드 통계 |
| `announcements` | 공지사항 |
| `faqs` | FAQ |
| `inquiries` | 문의사항 |

---

## 🔧 개발 명령어

```bash
# 개발 서버 (로컬 네트워크 공개, 모바일 테스트용)
pnpm dev

# 개발 서버 (localhost 전용)
pnpm dev1

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 코드 린팅
pnpm lint

# 코드 포맷팅 (ESLint + Prettier)
pnpm format

# DB 백업
pnpm backup:db
```

---

## 🚀 배포

### Vercel (권장)

1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정 (`.env.local` 참조)
3. 빌드 명령어: `pnpm build`
4. 출력 디렉토리: `.next`

### 캐시 전략 (next.config.js)

| 대상 | Cache-Control |
|------|---------------|
| 정적 에셋 (`_next/static`) | `immutable, max-age=31536000` |
| 이미지 (`_next/image`) | `s-maxage=86400, SWR=604800` |
| 아이콘 / 파비콘 | `immutable, max-age=31536000` |
| hub_up 페이지 | `s-maxage=60, SWR=300` |
| hub_up FAQ | `s-maxage=3600, SWR=86400` |
| hub_up config API | `s-maxage=300, SWR=600` |
| 챌린지 API / 페이지 | `no-store` (실시간) |

---

## 🔒 보안

- **Row Level Security (RLS)**: Supabase 테이블별 접근 제어
- **서비스 역할 키 격리**: 서버 사이드 API에서만 `supabaseAdmin` 사용
- **세션 기반 인증**: 모든 뮤테이션 API는 `getServerSession` 검증
- **역할 기반 접근 제어 (RBAC)**: `admin_roles` 테이블로 메뉴/기능별 권한 분리
- **QR 토큰 만료**: 출석 QR은 짧은 유효 시간 + 2분 Grace Period

---

## 📚 추가 문서

- [개발 가이드](./DEVELOPMENT_GUIDE.md)
- [API 문서](./API_DOCUMENTATION.md)
- [앱 기획](./APPS_PLANNING.md)
- [App Router 마이그레이션 현황](./APP_ROUTER_MIGRATION_TRACKER.md)
- [출석 전체 통계 설계](./docs/attendance-overall-stats-design.md)
- [마이그레이션 가이드](./migrations/)

---

**HUB Development Team** | 2026
