/**
 * 허브업 챌린지 상수
 * 레위기 19장 19일 실천 챌린지
 * 2026.04.27(월) ~ 2026.05.15(목)
 */

export const HUB_CHALLENGE = {
  /** DB 테이블명 */
  TABLE_SHARES: "hub_challenge_shares",

  /** 챌린지 식별자 */
  SLUG: "hubup2026",

  /** 챌린지 시작일 (YYYYMMDD) — Day1 = 4/27 월요일 */
  START_DATE: "20260427",

  /** 챌린지 종료일 (YYYYMMDD) — Day19 = 5/15 목요일 */
  END_DATE: "20260515",

  /** 총 일수 */
  TOTAL_DAYS: 19,

  /** 캐시 태그 */
  CACHE_TAG_SHARES: "hub-challenge-shares",
} as const;

/** 챌린지 일별 데이터 (PDF 기반) */
export interface ChallengeDayData {
  day: number;       // 1~19
  dDay: string;      // "D-19" ~ "D-1"
  date: string;      // "4/26 일" 형식
  dateStr: string;   // YYYYMMDD
  verse: string;     // "레위기 19:2"
  practices: string[]; // 실천 항목들
}

export const CHALLENGE_DAYS: ChallengeDayData[] = [
  {
    day: 1,
    dDay: "Day 1",
    date: "4/27 월",
    dateStr: "20260427",
    verse: "레위기 19:2",
    practices: [
      '오늘 3번 "하나님이라면 어떤 선택을 하셨을까?" 질문하기',
      "하루 1가지 하나님 기준으로 선택한 순간 기록",
    ],
  },
  {
    day: 2,
    dDay: "Day 2",
    date: "4/28 화",
    dateStr: "20260428",
    verse: "레위기 19:3",
    practices: [
      "부모/권위자에게 감사 표현하기",
      "30분 하나님께 구별된 시간 갖기",
    ],
  },
  {
    day: 3,
    dDay: "Day 3",
    date: "4/29 수",
    dateStr: "20260429",
    verse: "레위기 19:4",
    practices: [
      "내 삶의 우상 3가지 적고 기도하기",
      "그 중 1가지 내려놓는 구체적인 행동 1가지 실행하기",
    ],
  },
  {
    day: 4,
    dDay: "Day 4",
    date: "4/30 목",
    dateStr: "20260430",
    verse: "레위기 19:5-6",
    practices: [
      "감사 3가지 고백하기",
      "5분 동안 간구 없이 하나님 앞에 머물기",
    ],
  },
  {
    day: 5,
    dDay: "Day 5",
    date: "5/1 금",
    dateStr: "20260501",
    verse: "레위기 19:9",
    practices: [
      "오늘 일부러 포기할 것 1가지 정하기",
      "그것을 누군가를 위해 사용해보기",
    ],
  },
  {
    day: 6,
    dDay: "Day 6",
    date: "5/2 토",
    dateStr: "20260502",
    verse: "레위기 19:10",
    practices: [
      "오늘 주변에서 도움이 필요한 사람 한 번 더 유심히 살펴보기",
      "작은 배려 1가지 실천하기",
    ],
  },
  {
    day: 7,
    dDay: "Day 7",
    date: "5/3 일",
    dateStr: "20260503",
    verse: "레위기 19:11",
    practices: [
      "과장하거나 핑계 대지 않고 정직하게 말하기",
    ],
  },
  {
    day: 8,
    dDay: "Day 8",
    date: "5/4 월",
    dateStr: "20260504",
    verse: "레위기 19:12",
    practices: [
      "가볍게 말했던 표현 점검하기",
      "말에 책임을 가지고 말하기",
    ],
  },
  {
    day: 9,
    dDay: "Day 9",
    date: "5/5 화",
    dateStr: "20260505",
    verse: "레위기 19:15",
    practices: [
      "오늘 한 사람을 선택해 하나님 시선으로 바라보기",
      "평소 거리감이나 편견이 있었던 사람에게 마음으로라도 이해하려는 시선 + 축복하는 기도 해보기",
    ],
  },
  {
    day: 10,
    dDay: "Day 10",
    date: "5/6 수",
    dateStr: "20260506",
    verse: "레위기 19:16",
    practices: [
      "오늘 하루 험담/뒷말 완전 금지",
      "누군가를 말하고 싶을 때 → 그 사람의 좋은 점 1가지 말로 바꾸기",
    ],
  },
  {
    day: 11,
    dDay: "Day 11",
    date: "5/7 목",
    dateStr: "20260507",
    verse: "레위기 19:17-18",
    practices: [
      "마음에 걸렸던 사람 한 명 떠올리고 짧게라도 연락 or 표현 하나 하기 (사과, 감사 등)",
      "사랑하는 허브의 동역자에게 익명으로 사랑의 편지 써보기",
    ],
  },
  {
    day: 12,
    dDay: "Day 12",
    date: "5/8 금",
    dateStr: "20260508",
    verse: "레위기 19:19",
    practices: [
      "내가 타협하고 있는 영역 1가지 적기",
      '오늘 그 영역에서 "하나님 방식" 선택하기',
    ],
  },
  {
    day: 13,
    dDay: "Day 13",
    date: "5/9 토",
    dateStr: "20260509",
    verse: "레위기 19:26",
    practices: [
      "반복되는 습관 1가지 선택 (예: 미디어, 말투, 소비 등)",
      "오늘 하루 그 행동을 완전히 끊고 그 시간에 짧은 말씀 읽고 기도하기",
    ],
  },
  {
    day: 14,
    dDay: "Day 14",
    date: "5/10 일",
    dateStr: "20260510",
    verse: "레위기 19:30",
    practices: [
      "예배 전 10분 미리 준비하기",
      "예배 중 붙잡을 말씀 한 문장 기록하기",
    ],
  },
  {
    day: 15,
    dDay: "Day 15",
    date: "5/11 월",
    dateStr: "20260511",
    verse: "레위기 19:31",
    practices: [
      "하나님보다 더 의지하는 것 1가지 적어보기",
      "운세, 타로, 사람 말 등 → 하나님보다 먼저 찾던 습관 멈추기",
    ],
  },
  {
    day: 16,
    dDay: "Day 16",
    date: "5/12 화",
    dateStr: "20260512",
    verse: "레위기 19:32-34",
    practices: [
      "어른/선배에게 존중 표현하기",
      "공동체(가정, 학교, 직장, 교회 등) 평소 덜 챙겼던 사람 1명에게 먼저 다가가기",
    ],
  },
  {
    day: 17,
    dDay: "Day 17",
    date: "5/13 수",
    dateStr: "20260513",
    verse: "레위기 19:35-36",
    practices: [
      "작은 부분에서도 정직하게 행동하기",
      '"이 정도는 괜찮겠지" 생각 멈추기',
    ],
  },
  {
    day: 18,
    dDay: "Day 18",
    date: "5/14 목",
    dateStr: "20260514",
    verse: "레위기 19:37",
    practices: [
      "오늘 말씀/묵상 중 떠오른 행동 1가지 정하기",
      "10분 안에 바로 실행하거나 첫 행동 시작하기",
    ],
  },
  {
    day: 19,
    dDay: "Day 19",
    date: "5/15 목",
    dateStr: "20260515",
    verse: "레위기 19:2",
    practices: [
      "19일 동안 변화 3가지 기록",
      "계속 이어갈 거룩의 습관 1가지 정하기",
      "그 결단을 가지고 짧게라도 기도하기",
    ],
  },
];

/**
 * 오늘 날짜(YYYYMMDD)로 해당 챌린지 day 데이터 반환
 * 챌린지 기간 전이면 null, 기간 후면 마지막 날 반환
 */
export function getTodayChallengeDay(todayStr: string): ChallengeDayData | null {
  const today = CHALLENGE_DAYS.find((d) => d.dateStr === todayStr);
  if (today) return today;

  // 기간 전
  if (todayStr < HUB_CHALLENGE.START_DATE) return null;

  // 기간 후 → 마지막 날 반환
  if (todayStr > HUB_CHALLENGE.END_DATE) return CHALLENGE_DAYS[CHALLENGE_DAYS.length - 1];

  return null;
}

/**
 * YYYYMMDD → day number (1~19), 챌린지 기간 외면 null
 */
export function getChallengeDayNumber(dateStr: string): number | null {
  const found = CHALLENGE_DAYS.find((d) => d.dateStr === dateStr);
  return found ? found.day : null;
}

/** KST 기준 오늘 날짜 YYYYMMDD */
export function getKSTDateStr(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}
