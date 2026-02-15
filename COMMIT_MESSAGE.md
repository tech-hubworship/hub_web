fix: 말씀카드 다운로드 파일명 확장자 중복 문제 해결

## 주요 변경사항

### 버그 수정
- **파일명 확장자 중복 문제 해결**
  - 다운로드 시 `.jpg.png`처럼 확장자가 중복되는 문제 해결
  - 서버에서 실제 이미지 Content-Type에 맞는 확장자를 동적으로 결정
  - 클라이언트에서 서버의 Content-Disposition 헤더에서 파일명을 추출하여 사용

### 서버 측 (download-proxy.ts)
- Content-Type에 따라 확장자 자동 결정 (PNG, JPG, WEBP, GIF 지원)
- filename에서 기존 확장자를 제거하고 올바른 확장자 추가
- Content-Disposition 헤더에 정확한 파일명 설정

### 클라이언트 측 (DownloadPage.tsx)
- 확장자 없이 기본 파일명만 서버에 전송
- 서버 응답의 Content-Disposition 헤더에서 파일명 추출
- 추출한 파일명을 `link.download`에 사용하여 브라우저 다운로드 시 올바른 파일명 적용

## 파일 변경 내역

### 수정된 파일
- `src/pages/api/bible-card/download-proxy.ts`
  - Content-Type 기반 확장자 결정 로직 추가
  - filename에서 확장자 제거 및 재설정 로직 추가

- `src/views/BibleCardPage/DownloadPage.tsx`
  - 확장자 없이 기본 파일명만 전송하도록 변경
  - Content-Disposition 헤더에서 파일명 추출 로직 추가

## 사용자 경험 개선
- 이미지 형식에 맞는 정확한 확장자로 파일 다운로드
- 중복 확장자로 인한 혼란 제거
- 다양한 이미지 포맷(PNG, JPG, WEBP, GIF) 지원
