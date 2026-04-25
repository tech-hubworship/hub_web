"use client";
import HubUpClient from "./HubUpClient";

const DAYS = [
  {
    label: 'Day 1',
    sessions: [
      { title: 'Be Holy 1', name: '기도', speaker: '이서진 목사 여호수아 청년부' },
    ],
  },
  {
    label: 'Day 2',
    sessions: [
      { title: 'Be Holy 2', name: '동행', speaker: '연사 추후 공개' },
      { title: 'Be Holy 3', name: 'Hub Run!', speaker: '콘텐츠 추후 공개' },
      { title: 'Be Holy 4', name: '멘토 선택 특강', speaker: '연사 추후 공개' },
      { title: 'Be Holy 5', name: '말씀', speaker: '오현교 목사 허브 대학부' },
    ],
  },
  {
    label: 'Day 3',
    sessions: [
      { title: 'Be Holy 6', name: '전도', speaker: '이은호 목사 얼바인샤이닝헬로쉽교회 담임목사' },
      { title: 'Be Holy 7', name: '거룩', speaker: '연사 추후 공개' },
    ],
  },
];

const FAQS = [
  { cat: '접수', q: '허브업 신청을 취소하고 싶어요.', a: '5월 3일(일) 자정까지 환불 가능합니다.\n이후에는 예약금 지불로 인해 환불이 불가합니다.\n\n환불 문의 : https://open.kakao.com/o/s9CV4ipi', link: 'https://open.kakao.com/o/s9CV4ipi' },
  { cat: '차량', q: '차량 시간을 변경하고 싶어요.', a: '\'내 정보\' 메뉴에서 차량 변경 요청이 가능합니다.\n변경 기한은 5월 13일까지입니다.', link: '/hub_up/myinfo' },
  { cat: '접수', q: '부분 참석시 회비 할인이 되나요?', a: '부분 참석도 회비는 동일하게 적용됩니다.' },
];

// 날짜 계산 — 서버에서 한 번만 실행
function buildSchedule() {
  const now = new Date();
  const toKST = (d: string) => new Date(d + 'T00:00:00+09:00');
  const isPast = (t: Date) => now > t;
  const daysLeft = (t: Date) => {
    const diff = Math.ceil((t.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-Day';
    return `${diff}일 남음`;
  };

  const items = [
    { date: '04.12 - 18', label: '얼리버드 신청 기간',          target: toKST('2026-04-18') },
    { date: '04.26',      label: '참가 신청 및 티셔츠 예약 마감', target: toKST('2026-04-26') },
    { date: '05.13',      label: '차량 변경 마감',               target: toKST('2026-05-13') },
  ];

  return items.map(({ date, label, target }) => ({
    date,
    label,
    past: isPast(target),
    daysLeft: isPast(target) ? '마감' : daysLeft(target),
  }));
}

export default function HubUpPage() {
  const schedule = buildSchedule();
  return <HubUpClient days={DAYS} faqs={FAQS} schedule={schedule} />;
}
