// 말씀카드 일정 설정 (클라이언트/서버 공용)
// 시즌이 바뀌면 이 파일의 값만 수정하면 된다.

export const BIBLE_CARD_CONFIG = {
  /** 배너/페이지에 표시되는 이름 */
  title: '신년 말씀카드',
  /** 신청(기도제목 접수) 시작 (KST) */
  applicationOpen: '2026-11-22T00:00:00+09:00',
  /** 신청 마감 (KST). 12월 6일 23:59:59까지 접수 */
  applicationClose: '2026-12-07T00:00:00+09:00',
  /** 말씀카드 공개/다운로드 시작 (KST) */
  distribution: '2027-01-01T00:00:00+09:00',
  /** 사람이 읽는 표기 */
  applicationPeriodLabel: '11월 22일 ~ 12월 6일',
  distributionLabel: '2027년 1월 1일',
} as const;

export const BIBLE_CARD_OPEN_DATE = new Date(BIBLE_CARD_CONFIG.applicationOpen);
export const BIBLE_CARD_CLOSE_DATE = new Date(BIBLE_CARD_CONFIG.applicationClose);
export const BIBLE_CARD_DISTRIBUTION_DATE = new Date(BIBLE_CARD_CONFIG.distribution);

export type BibleCardPhase = 'before_open' | 'open' | 'closed' | 'distributed';

export function getBibleCardPhase(now: Date = new Date()): BibleCardPhase {
  if (now < BIBLE_CARD_OPEN_DATE) return 'before_open';
  if (now < BIBLE_CARD_CLOSE_DATE) return 'open';
  if (now < BIBLE_CARD_DISTRIBUTION_DATE) return 'closed';
  return 'distributed';
}

export function isBibleCardApplicationOpen(now: Date = new Date()): boolean {
  return getBibleCardPhase(now) === 'open';
}

// ── 사전 테스트 (/test) ─────────────────────────────────────────
/** 사전 테스트에 들어올 수 있는 admin_roles 역할 */
export const BIBLE_CARD_TESTER_ROLES = ['MC', '목회자', '마스터'] as const;
/** 테스터 신청 가능 시작 (KST). 마감은 일반 신청과 동일 */
export const BIBLE_CARD_TEST_OPEN_DATE = new Date('2026-11-21T00:00:00+09:00');

export function isBibleCardTester(roles: readonly string[] | null | undefined): boolean {
  return !!roles?.some((r) => (BIBLE_CARD_TESTER_ROLES as readonly string[]).includes(r));
}

export function isBibleCardTestApplicationOpen(now: Date = new Date()): boolean {
  return now >= BIBLE_CARD_TEST_OPEN_DATE && now < BIBLE_CARD_CLOSE_DATE;
}
