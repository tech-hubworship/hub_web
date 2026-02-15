/**
 * 영상 이벤트 고정 설정 (다양한 시즌에 재사용)
 * - video_event_* 테이블 + event_slug 로 통일 관리
 * - 이벤트 전환 시 EVENT_SLUG, BASE_DATE, END_DATE, DISPLAY_NAME 만 변경
 */

export const VIDEO_EVENT = {
  /** DB 테이블명 (고정) */
  TABLE_POSTS: "video_event_posts",
  TABLE_COMMENTS: "video_event_comments",
  TABLE_ATTENDANCE: "video_event_attendance",

  /** Supabase RPC 함수 접두사 (고정) */
  RPC_PREFIX: "get_video_event",

  /** 현재 이벤트 식별자 — 이벤트 전환 시 이 값만 변경 (예: "advent", "lent") */
  EVENT_SLUG: "lent",

  /** 이벤트 시작일 (YYYYMMDD) — N일차 계산 기준. 2026 재의 수요일 */
  BASE_DATE: "20260218",
  /** 이벤트 종료일 (YYYYMMDD) — 2026 부활절 전일 */
  END_DATE: "20260404",

  /** 캐시 태그 (revalidateTag용) */
  CACHE_TAG_POSTS: "video-event-posts",
  CACHE_TAG_POSTS_LIST: "video-event-posts-list",
  CACHE_TAG_COMMENTS: "video-event-comments",

  /** 이벤트 로고/아이콘 경로 (public 기준). 사순절 전용 로고 추가 시 /icons/lent_logo.svg 로 변경 가능 */
  EVENT_LOGO_PATH: "/icons/advent_logo.svg?v=2",

  /** UI 표시명 — 사순절 이벤트 */
  DISPLAY_NAME: "사순절",
  DISPLAY_NAME_ADMIN: "사순절 관리",
  DISPLAY_NAME_POSTS: "사순절 게시물",
  DISPLAY_NAME_STATS: "사순절 통계",
  DISPLAY_NAME_ATTENDANCE: "사순절 출석",
} as const;

/** 이벤트 페이지 경로 (URL에 슬러그 사용, 예: /advent, /lent) */
export function getVideoEventPath(): string {
  return `/${VIDEO_EVENT.EVENT_SLUG}`;
}

/** 허용된 이벤트 슬러그 목록 — 이 목록에 있는 경로만 [eventSlug] 페이지로 처리 */
export const ALLOWED_EVENT_SLUGS = ["advent", "lent"] as const;

/** 이벤트 기간 표시용 (YYYYMMDD → YYYY.MM.DD) */
export function formatEventDateRange(start: string, end: string): string {
  if (!start || start.length !== 8 || !end || end.length !== 8) return "";
  return `${start.slice(0, 4)}.${start.slice(4, 6)}.${start.slice(6, 8)} - ${end.slice(0, 4)}.${end.slice(4, 6)}.${end.slice(6, 8)}`;
}
