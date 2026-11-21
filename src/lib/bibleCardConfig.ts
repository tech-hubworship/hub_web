// 말씀카드 일정 설정 (클라이언트/서버 공용)
// 시즌이 바뀌면 이 파일의 값만 수정하면 된다.

export const BIBLE_CARD_CONFIG = {
  /** 배너/페이지에 표시되는 이름 */
  title: '신년 말씀카드',
  /** 신청(기도제목 접수) 시작 (KST) */
  applicationOpen: '2026-11-21T00:00:00+09:00',
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
