# App Router 이관 트래커 (pages → app)

이 문서는 **pages router → app router**를 “기능(페이지+API) 묶음” 단위로 순차 이관하기 위한 체크리스트입니다.  
각 PR은 아래 체크리스트 중 **1개 묶음**만 다루는 것을 권장합니다.

## 공통 수동 스모크 체크(모든 PR 공통)

- [ ] **페이지 접근**: 대상 URL 1~2개 진입(데스크탑/모바일 뷰 1회)
- [ ] **인증/권한**: 로그인 필요 시 리다이렉트/세션 반영 확인
- [ ] **API**: 네트워크 탭에서 핵심 `/api/*` 3~5개 상태코드/응답 JSON shape 확인
- [ ] **에러**: 최소 1개 케이스(401/403/500)를 의도적으로 재현해 메시지/shape 유지 확인
- [ ] **콘솔 경고**: hydration / duplicate meta / next/head 관련 경고 없는지 확인

---

## 라우트 인벤토리(현 `src/pages` 기준)

### Public (메인/일반)

- **UI**
  - `/` → `src/pages/index.tsx` (view alias)
  - `/update` → `src/pages/update/index.tsx`
  - `/login` → `src/pages/login/index.tsx`
  - `/signup` → `src/pages/signup/index.tsx`
  - `/myinfo` → `src/pages/myinfo/index.tsx`
  - `/survey` → `src/pages/survey/index.tsx`
  - `/tech-inquiry-feedback` → `src/pages/tech-inquiry-feedback.tsx`
  - `/law/intro` → `src/pages/law/intro.tsx`
  - `/law/privacy` → `src/pages/law/privacy.tsx`
  - `/law/terms` → `src/pages/law/terms.tsx`
  - `/404` → `src/pages/404.tsx`
  - `/500` → `src/pages/500.tsx`
- **API**
  - `/api/inquiries` → `src/pages/api/inquiries/index.ts`
  - `/api/downloads/decrement` → `src/pages/api/downloads/decrement.ts`
  - `/api/tech-inquiries/*` → `src/pages/api/tech-inquiries/*`
  - `/api/survey/*` → `src/pages/api/survey/*`
  - `/api/user/*` → `src/pages/api/user/*`
  - `/api/common/{cells,groups}` → `src/pages/api/common/*`

### Apps

- **UI**
  - `/apps` → `src/pages/apps/index.tsx`
  - `/apps/prayer-time` → `src/pages/apps/prayer-time/index.tsx`
- **API**
  - `/api/prayer-time/{active,community,daily,my-stats,start,stop}` → `src/pages/api/prayer-time/*`

### Advent

- **UI**
  - `/advent` → `src/pages/advent/index.tsx` (query: `?date=YYYYMMDD`)
- **API (public)**
  - `/api/advent/posts` → `src/pages/api/advent/posts.ts`
  - `/api/advent/posts-list` → `src/pages/api/advent/posts-list.ts`
  - `/api/advent/comments` → `src/pages/api/advent/comments.ts.backup` (백업 파일 존재)
  - `/api/advent/user-comments` → `src/pages/api/advent/user-comments.ts`
  - `/api/advent/attendance` → `src/pages/api/advent/attendance.ts`
  - `/api/advent/attendance-weekly` → `src/pages/api/advent/attendance-weekly.ts`
  - `/api/advent/attendance-by-week` → `src/pages/api/advent/attendance-by-week.ts`
- **API (admin)**
  - `/api/admin/advent/*` → `src/pages/api/admin/advent/*`

### Media Gallery

- **UI**
  - `/media-gallery` → `src/pages/media-gallery/index.tsx`
  - `/media-gallery/[folderId]` → `src/pages/media-gallery/[folderId].tsx`
  - `/media-gallery/[folderId]/[photoId]` → `src/pages/media-gallery/[folderId]/[photoId].tsx`
- **API**
  - `/api/public/photos` → `src/pages/api/public/photos.ts`
  - `/api/public/photo-folders` → `src/pages/api/public/photo-folders.ts`
  - `/api/public/photo-folders/[folderId]` → `src/pages/api/public/photo-folders/[folderId].ts`
  - `/api/public/photo-reservations` → `src/pages/api/public/photo-reservations.ts`
  - `/api/photos/folders` → `src/pages/api/photos/folders.ts`
  - `/api/photos/folder-path` → `src/pages/api/photos/folder-path.ts`
  - `/api/admin/photos/*` → `src/pages/api/admin/photos/*`

### Bible Card

- **UI**
  - `/bible-card` → `src/pages/bible-card/index.tsx`
  - `/bible-card/download` → `src/pages/bible-card/download.tsx`
  - `/admin/bible-card/applications` → `src/pages/admin/bible-card/applications.tsx`
- **API**
  - `/api/bible-card/*` → `src/pages/api/bible-card/*`
  - `/api/bible-card/admin/*` → `src/pages/api/bible-card/admin/*`
  - `/api/bible-card/pastor/*` → `src/pages/api/bible-card/pastor/*`

### Attendance / Ice-breaking / Hub4cut

- **UI**
  - `/attendance/check-OD` → `src/pages/attendance/check-OD.tsx`
  - `/attendance/verify-leadership` → `src/pages/attendance/verify-leadership.tsx`
  - `/ice-breaking` → `src/pages/ice-breaking/index.tsx`
  - `/hub4cut` → `src/pages/hub4cut/index.tsx`
  - `/hub4cut/[url]` → `src/pages/hub4cut/[url].tsx`
- **API**
  - `/api/attendance/*` → `src/pages/api/attendance/*`
  - `/api/ice-breaking/draw` → `src/pages/api/ice-breaking/draw.ts`
  - `/api/admin/ice-breaking/*` → `src/pages/api/admin/ice-breaking/*`

### Admin (UI)

- `/admin` → `src/pages/admin/index.tsx`
- `/admin/users` → `src/pages/admin/users.tsx`
- `/admin/roles` → `src/pages/admin/roles.tsx`
- `/admin/tech-inquiries` → `src/pages/admin/tech-inquiries.tsx`
- `/admin/secretary` → `src/pages/admin/secretary/index.tsx`
- `/admin/design` → `src/pages/admin/design/index.tsx`
- `/admin/ice-breaking` → `src/pages/admin/ice-breaking/index.tsx`
- `/admin/attendance/qr` → `src/pages/admin/attendance/qr.tsx`
- `/admin/advent` → `src/pages/admin/advent/index.tsx`
- `/admin/advent/attendance` → `src/pages/admin/advent/attendance.tsx`
- `/admin/advent/stats` → `src/pages/admin/advent/stats.tsx`
- `/admin/photo` → `src/pages/admin/photo/index.tsx`
- `/admin/photos` → `src/pages/admin/photos/index.tsx`
- `/admin/photos/manage` → `src/pages/admin/photos/manage.tsx`
- `/admin/photos/reservations` → `src/pages/admin/photos/reservations.tsx`
- `/admin/photos/upload` → `src/pages/admin/photos/upload.tsx`

---

## 이관 순서(권장)

1. **기반 공사**: `app/layout` + providers + error/not-found + 공용 head
2. **인증**: NextAuth `app/api/auth/[...nextauth]`
3. **Apps 묶음**: `/apps` + `/apps/prayer-time` + `/api/prayer-time/*`
4. **Advent 묶음**: `/advent` + `/api/advent/*` + `/api/admin/advent/*`
5. **Media Gallery 묶음**
6. **Bible Card 묶음**(download-proxy/CSV 등 응답 타입 주의)
7. **Attendance/Ice-breaking/Hub4cut 묶음**
8. **Admin UI + 나머지 admin API**
9. **마무리**: `src/pages`/`src/pages/api` 제거

