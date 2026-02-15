# 영상 이벤트(범용) 마이그레이션

대림절 전용 기능을 **영상 이벤트**로 범용화했습니다. 사순절, 대림절 등 여러 시즌에 같은 코드베이스를 사용할 수 있습니다.

## 변경 사항 요약

- **경로**: 이벤트 페이지 URL이 **이벤트 슬러그**로 노출됩니다. 예: `/advent`, `/lent` (`constants.EVENT_SLUG` 기준). `/video-event` 접속 시 현재 슬러그 경로로 리다이렉트됩니다.
- **관리 메뉴**: "영상 이벤트 관리"
- **API**: `/api/video-event/*`, `/api/admin/video-event/*`
- **테이블·이벤트**: `video_event_*` 테이블 + `event_slug` 로 고정. 설정은 **환경 변수 없이** `src/lib/video-event/constants.ts` 에서만 관리합니다.

## 설정 (고정 — constants 만)

`src/lib/video-event/constants.ts` 에서 다음을 **고정값**으로 관리합니다. 이벤트 전환 시 이 파일만 수정하면 됩니다.

| 항목 | constants 키 | 현재값 | 설명 |
|------|--------------|--------|------|
| 게시물 테이블 | `TABLE_POSTS` | `video_event_posts` | 고정 |
| 댓글 테이블 | `TABLE_COMMENTS` | `video_event_comments` | 고정 |
| 출석 테이블 | `TABLE_ATTENDANCE` | `video_event_attendance` | 고정 |
| 이벤트 식별자 | `EVENT_SLUG` | `advent` | 이벤트 전환 시 여기만 변경 (예: `lent`) |
| RPC 접두사 | `RPC_PREFIX` | `get_video_event` | 고정 |
| 이벤트 시작일 | `BASE_DATE` | `20251130` | 이벤트별로 변경 |
| 이벤트 종료일 | `END_DATE` | `20251225` | 이벤트별로 변경 |
| UI 표시명 | `DISPLAY_NAME` 등 | 영상 이벤트 | 이벤트별로 변경 가능 |

## DB 마이그레이션

1. `migrations/DDL_VIDEO_EVENT_TABLES.sql` 로 `video_event_*` 테이블 생성 (event_slug 포함)
2. 기존 데이터가 있으면 이관 후 `constants.EVENT_SLUG` 에 맞춰 `event_slug` 값 설정
3. 통계용 RPC는 `get_video_event_*` 형태로 생성 (constants 의 `RPC_PREFIX` 와 일치)

## 테이블 DDL (event_slug 포함)

- `migrations/DDL_VIDEO_EVENT_TABLES.sql` — `video_event_posts`, `video_event_comments`, `video_event_attendance` 생성  
  - 세 테이블 모두 **event_slug** 컬럼으로 이벤트 구분 (예: `advent`, `lent`). 복합 PK/UNIQUE 사용.
- `migrations/DDL_VIDEO_EVENT_FUNCTIONS.sql` — 트리거용 함수 `update_video_event_updated_at()` 및 트리거 부착

실행 순서: 1) 테이블 DDL → 2) 함수·트리거 DDL. 테이블 DDL 안에 주석 처리된 트리거가 있으면, 함수 생성 후 `DDL_VIDEO_EVENT_FUNCTIONS.sql`로 한 번에 부착하면 됩니다.

## 통계용 RPC (필수)

관리자 통계 페이지(`/admin?tab=video-event-stats`)에서 사용하는 RPC는 **반드시** 아래와 같은 시그니처여야 합니다.

- **`migrations/DDL_VIDEO_EVENT_STATS_FUNCTIONS.sql`** 실행으로 5개 함수 생성/교체.

| RPC 이름 | 인자 | 용도 |
|----------|------|------|
| `get_video_event_today_stats` | `today_date`(YYYYMMDD), `p_event_slug` | 오늘 출석/묵상 수 |
| `get_video_event_daily_stats` | `start_date`, `end_date`(YYYY-MM-DD), `p_event_slug`, `p_base_date` | 일별 통계 |
| `get_video_event_streak_stats` | 위와 동일 | 연속 일수별 통계 |
| `get_video_event_cumulative_stats` | 위와 동일 | 누적 통계 |
| `get_video_event_hourly_cumulative` | 위와 동일 | 시간대별 누적 |

앱은 `constants.EVENT_SLUG`, `constants.BASE_DATE`에 맞춰 위 인자를 넘깁니다. **통계가 안 나오면** 이 DDL을 Supabase SQL Editor에서 실행했는지 확인하세요.

## 관리자 메뉴

- 새 메뉴 ID: `video-event-posts`, `video-event-attendance`, `video-event-stats`
- 기존 `advent-posts` 등도 그대로 두면 같은 영상 이벤트 관리 화면으로 연결됩니다.
