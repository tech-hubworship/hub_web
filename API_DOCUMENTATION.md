# HUB Worship API 문서

## 📋 개요

HUB Worship 웹사이트의 REST API 문서입니다. 
모든 API는 JSON 형식으로 데이터를 주고받으며, 표준 HTTP 상태 코드를 사용합니다.
현재 프로젝트는 **일반 SQL 쿼리**를 사용하여 데이터베이스와 상호작용합니다.

## 🔗 기본 정보

- **Base URL**: `https://your-domain.com/api`
- **Content-Type**: `application/json`
- **인코딩**: UTF-8
- **데이터베이스**: Supabase PostgreSQL
- **쿼리 방식**: 일반 SQL 쿼리 (`execute_sql` 함수 사용)

## 📊 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 🔐 인증

현재 버전에서는 기본적인 인증만 구현되어 있습니다.
향후 JWT 기반 인증이 추가될 예정입니다.

## 📚 API 엔드포인트

### 1. 다운로드 관리 (Downloads)

#### GET /api/downloads/decrement
현재 남은 다운로드 수를 조회합니다.

**요청**
```http
GET /api/downloads/decrement
```

**응답**
```json
{
  "success": true,
  "data": {
    "remaining_count": 992
  }
}
```

**구현 방식**
- Supabase ORM 사용
- `downloads` 테이블에서 `key = 'wallpaper_downloads'` 조회
- 데이터가 없으면 초기값 1000으로 초기화

#### POST /api/downloads/decrement
다운로드 카운트를 차감합니다.

**요청**
```http
POST /api/downloads/decrement
Content-Type: application/json
```

**응답**
```json
{
  "success": true,
  "data": {
    "remaining_count": 991
  },
  "message": "다운로드 카운트가 차감되었습니다."
}
```

**에러 응답 (한도 초과)**
```json
{
  "success": false,
  "message": "다운로드 한도가 초과되었습니다.",
  "remaining_count": 0
}
```

**구현 방식**
- Supabase ORM 사용
- 현재 카운트 조회 후 차감
- 0 이하일 경우 차감 불가

### 2. 공지사항 (Announcements)

#### GET /api/announcements
활성화된 공지사항 목록을 조회합니다.

**요청**
```http
GET /api/announcements
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "공지사항 제목",
      "content": "공지사항 내용",
      "is_important": true,
      "is_active": true,
      "order_index": 0,
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**구현 방식**
- Supabase ORM 사용
- `is_active = true` 조건으로 필터링
- `order_index` 순으로 정렬

#### POST /api/announcements
새 공지사항을 생성합니다. (관리자만)

**요청**
```http
POST /api/announcements
Content-Type: application/json

{
  "title": "새 공지사항",
  "content": "공지사항 내용",
  "is_important": false,
  "order_index": 0,
  "created_by": 1
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "새 공지사항",
    "content": "공지사항 내용",
    "is_important": false,
    "is_active": true,
    "order_index": 0,
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. FAQ

#### GET /api/faqs
FAQ 목록을 조회합니다.

**요청**
```http
GET /api/faqs?category=general
```

**쿼리 매개변수**
- `category` (선택): FAQ 카테고리 필터

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "자주 묻는 질문",
      "answer": "답변 내용",
      "category": "general",
      "is_active": true,
      "order_index": 0,
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/faqs
새 FAQ를 생성합니다. (관리자만)

**요청**
```http
POST /api/faqs
Content-Type: application/json

{
  "question": "새로운 질문",
  "answer": "답변 내용",
  "category": "general",
  "order_index": 0,
  "created_by": 1
}
```

### 4. 문의사항 (Inquiries)

#### GET /api/inquiries
문의사항 목록을 조회합니다. (관리자만)

**요청**
```http
GET /api/inquiries
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "홍길동",
      "email": "hong@example.com",
      "phone": "010-1234-5678",
      "subject": "문의 제목",
      "message": "문의 내용",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/inquiries
새 문의사항을 등록합니다.

**요청**
```http
POST /api/inquiries
Content-Type: application/json

{
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678",
  "subject": "문의 제목",
  "message": "문의 내용"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-1234-5678",
    "subject": "문의 제목",
    "message": "문의 내용",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "문의사항이 성공적으로 등록되었습니다."
}
```

#### PUT /api/inquiries
문의사항 상태를 업데이트합니다. (관리자만)

**요청**
```http
PUT /api/inquiries
Content-Type: application/json

{
  "id": 1,
  "status": "in_progress"
}
```

### 5. 다운로드 통계 (Download Stats)

#### GET /api/downloads/stats
다운로드 통계를 조회합니다.

**요청**
```http
GET /api/downloads/stats
```

**응답**
```json
{
  "success": true,
  "data": {
    "total_downloads": 1250,
    "downloads_today": 45,
    "downloads_this_week": 320,
    "downloads_this_month": 980
  }
}
```

**구현 방식**
- 임시로 기본값 반환 (download_stats 테이블 미구현)
- 향후 `get_download_stats()` 함수 사용 예정

#### POST /api/downloads/stats
다운로드 기록을 추가합니다.

**요청**
```http
POST /api/downloads/stats
Content-Type: application/json

{
  "wallpaper_id": 1,
  "user_ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**응답**
```json
{
  "success": true,
  "message": "다운로드 기록이 추가되었습니다."
}
```

**구현 방식**
- 임시로 성공 처리 (download_stats 테이블 미구현)
- 향후 `record_download()` 함수 사용 예정

## 📊 데이터 모델

### DownloadsTable
```typescript
interface DownloadsTable {
  id: number;
  key: string;
  remaining_count: number;
  created_at: string;
  updated_at: string;
}
```

### AnnouncementTable
```typescript
interface AnnouncementTable {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  is_active: boolean;
  order_index: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}
```

### FAQTable
```typescript
interface FAQTable {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}
```

### InquiryTable
```typescript
interface InquiryTable {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### DownloadStats
```typescript
interface DownloadStats {
  total_downloads: number;
  downloads_today: number;
  downloads_this_week: number;
  downloads_this_month: number;
}
```

## 🔍 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 405 | 허용되지 않는 메서드 |
| 500 | 서버 오류 |

## 🚨 에러 처리

### 일반적인 에러 코드

- `VALIDATION_ERROR`: 입력 데이터 검증 실패
- `NOT_FOUND`: 요청한 리소스를 찾을 수 없음
- `UNAUTHORIZED`: 인증이 필요함
- `FORBIDDEN`: 접근 권한이 없음
- `INTERNAL_ERROR`: 서버 내부 오류
- `DOWNLOAD_LIMIT_EXCEEDED`: 다운로드 한도 초과

### 에러 응답 예시

```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다.",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "reason": "이메일 형식이 올바르지 않습니다."
  }
}
```

## 💡 일반 SQL 쿼리 사용

현재 프로젝트는 일반 SQL 쿼리를 사용합니다:

### 1. execute_sql 함수 사용

```sql
-- 직접 SQL 쿼리 실행
SELECT * FROM execute_sql('SELECT * FROM downloads WHERE key = ''wallpaper_downloads''');
```

### 2. 커스텀 함수 사용

```sql
-- 다운로드 수 조회
SELECT get_remaining_downloads();

-- 다운로드 카운트 차감
SELECT * FROM decrement_download_count();

-- 다운로드 통계 조회
SELECT * FROM get_download_stats();
```

### 3. API에서 사용 예시

```typescript
// Supabase ORM 사용 (현재 구현)
const { data, error } = await supabaseAdmin
  .from('downloads')
  .select('remaining_count')
  .eq('key', 'wallpaper_downloads')
  .single();

// 일반 SQL 쿼리 사용 (향후 구현 예정)
const { data, error } = await supabaseAdmin.rpc('execute_sql', {
  query: 'SELECT remaining_count FROM downloads WHERE key = $1',
  params: ['wallpaper_downloads']
});
```

## 🔄 Rate Limiting

현재 버전에서는 Rate Limiting이 구현되지 않았습니다.
향후 버전에서 구현 예정입니다.

## 📝 버전 관리

API 버전은 URL 경로에 포함됩니다:
- v1: `/api/v1/announcements`
- v2: `/api/v2/announcements` (향후)

현재는 버전 없이 `/api/` 경로를 사용합니다.

## 🧪 테스트

### cURL 예시

```bash
# 다운로드 수 조회
curl -X GET "http://localhost:3000/api/downloads/decrement"

# 다운로드 카운트 차감
curl -X POST "http://localhost:3000/api/downloads/decrement"

# 공지사항 조회
curl -X GET "http://localhost:3000/api/announcements"

# 문의사항 등록
curl -X POST "http://localhost:3000/api/inquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "hong@example.com",
    "message": "문의 내용입니다."
  }'
```

### JavaScript 예시

```javascript
// 다운로드 수 조회
const response = await fetch('/api/downloads/decrement');
const data = await response.json();
console.log('남은 다운로드 수:', data.data.remaining_count);

// 다운로드 카운트 차감
const downloadResponse = await fetch('/api/downloads/decrement', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
});
const downloadData = await downloadResponse.json();

// 공지사항 조회
const announcementsResponse = await fetch('/api/announcements');
const announcementsData = await announcementsResponse.json();

// 문의사항 등록
const inquiryResponse = await fetch('/api/inquiries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '홍길동',
    email: 'hong@example.com',
    message: '문의 내용입니다.'
  })
});
```

### API 테스트 결과

```bash
# GET 요청 결과
$ curl -X GET http://localhost:3000/api/downloads/decrement
{"success":true,"data":{"remaining_count":992}}

# POST 요청 결과
$ curl -X POST http://localhost:3000/api/downloads/decrement
{"success":true,"data":{"remaining_count":991},"message":"다운로드 카운트가 차감되었습니다."}
```

## 🔮 향후 계획

- [ ] JWT 기반 인증 시스템
- [ ] Rate Limiting 구현
- [ ] API 버전 관리
- [ ] GraphQL 지원
- [ ] WebSocket 실시간 알림
- [ ] 파일 업로드 API
- [ ] 관리자 대시보드 API
- [ ] 일반 SQL 쿼리 완전 전환
- [ ] download_stats 테이블 구현
- [ ] 실시간 다운로드 통계

## 🔧 개발자 도구

### 로그 확인

개발 서버 콘솔에서 다음 로그들을 확인하세요:

```
데이터베이스에서 다운로드 수 조회 시작...
데이터베이스 조회 성공: 992
일반 SQL 쿼리로 다운로드 카운트 차감 시작...
데이터베이스에서 카운트 차감 성공: 991
```

### 디버깅

```typescript
// API에서 상세한 로그 출력
console.log(`[${req.method}] /api/downloads/decrement 요청 받음`);
console.log('현재 카운트:', currentCount);
console.log('차감 결과:', result);
```

## 📞 지원

API 관련 문의사항이나 버그 리포트는 GitHub Issues를 통해 제출해 주세요.

---

**HUB Development Team** | 2024