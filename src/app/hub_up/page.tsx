"use client";

import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HubUpMainPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const now = new Date();
  const toKST = (dateStr: string) => new Date(dateStr + 'T00:00:00+09:00');
  const earlyBirdEnd = toKST('2026-04-18');
  const regDeadline  = toKST('2026-04-26');
  const busChangeEnd = toKST('2026-05-13');
  const daysLeft = (target: Date) => {
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-Day';
    return `${diff}일 남음`;
  };
  const isPast = (target: Date) => now > target;

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
        { title: 'Be Holy 7', name: '거룩', speaker: '오현교 목사 허브 대학부' },
      ],
    },
  ];

  const isAchachaVisible = now >= new Date('2026-04-19T00:00:00+09:00');

  const FAQS = [
    { cat: '접수', q: '허브업 신청을 취소하고 싶어요.', a: '5월 3일(일) 자정까지 환불 가능합니다.\n이후에는 예약금 지불로 인해 환불이 불가합니다.\n\n환불 문의 : https://open.kakao.com/o/s9CV4ipi', link: 'https://open.kakao.com/o/s9CV4ipi' },
    { cat: '차량', q: '차량 시간을 변경하고 싶어요.', a: '\'내 정보\' 메뉴에서 차량 변경 요청이 가능합니다.\n변경 기한은 5월 13일까지입니다.', link: '/hub_up/myinfo' },
    { cat: '접수', q: '부분 참석시 회비 할인이 되나요?', a: '부분 참석도 회비는 동일하게 적용됩니다.' },
    ...(isAchachaVisible ? [{ cat: '이벤트', q: '아차차 이벤트가 뭔가요?', a: '4월 19일 (하루) 1시 30분 ~ 1시 50분까지 성경책 지참 후 기쁨홀 앞 데스크에서 인증 받은 사람에 한하여 회비 8만원이 적용됩니다.' }] : []),
  ];

  return (
    <Wrap>
      <Nav scrolled={scrolled}>
        <HamburgerBtn onClick={() => setMenuOpen(!menuOpen)} scrolled={scrolled}>
          <span /><span /><span />
        </HamburgerBtn>
        <NavCta scrolled={scrolled} onClick={() => router.push('/hub_up/register')}>신청하기</NavCta>
      </Nav>

      {menuOpen && (
        <DropMenu>
          {session && (
            <DropItem onClick={() => { router.push('/hub_up/myinfo'); setMenuOpen(false); }}>내 정보</DropItem>
          )}
          <DropItem onClick={() => { router.push('/hub_up/tshirt'); setMenuOpen(false); }}>티셔츠 예약</DropItem>
          <DropItem onClick={() => { router.push('/hub_up/faq'); setMenuOpen(false); }}>FAQ</DropItem>
          <DropItem onClick={() => { router.push('/'); setMenuOpen(false); }} style={{ color: '#888' }}>홈으로 돌아가기</DropItem>
        </DropMenu>
      )}

      {/* 히어로 이미지 - 새 메인이미지 */}
      <HeroImgWrap>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hubup/hero_main_new.png"
          alt="2026 HUBUP Be Holy"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </HeroImgWrap>

      <MainCopy>
        돌아온 2026 허브업!<br />
        거룩하신 하나님과<br />
        동행할 준비되셨나요?
      </MainCopy>

      {/* 달력·위치 아이콘 포함 */}
      <VenueRow>
        <VenueIcon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2D478C"/>
          </svg>
        </VenueIcon>
        <VenueText>소망수양관</VenueText>
        <VenueSep />
        <VenueIcon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="#2D478C"/>
          </svg>
        </VenueIcon>
        <VenueText>2026.5.15-17</VenueText>
      </VenueRow>

      {/* Day 1/2/3 */}
      <DaySection>
        {DAYS.map((day, idx) => (
          <div key={day.label}>
            <DayRow onClick={() => setOpenDay(openDay === idx ? null : idx)}>
              <DayLabel>{day.label}</DayLabel>
              <DayToggle open={openDay === idx}>
                {openDay === idx ? '×' : '+'}
              </DayToggle>
            </DayRow>
            {openDay === idx && (
              <SessionList>
                {day.sessions.map((s) => (
                  <SessionItem key={s.title}>
                    <SessionTitle>{s.title}</SessionTitle>
                    <SessionName>{s.name}</SessionName>
                    <SessionSpeaker>{s.speaker}</SessionSpeaker>
                  </SessionItem>
                ))}
              </SessionList>
            )}
            <DayDivider />
          </div>
        ))}
      </DaySection>

      {/* Schedule 섹션 */}
      <ScheduleSection>
        <ScheduleLabel>Schedule</ScheduleLabel>
        <ScheduleTitle>주요 일정을<br />놓치지 마세요.</ScheduleTitle>

        <TimelineItem>
          <DateBadge past={isPast(earlyBirdEnd)}>04.12 - 18</DateBadge>
          <TimelineBottom>
            <TimelineText past={isPast(earlyBirdEnd)}>얼리버드 신청 기간</TimelineText>
            <TimelineRight past={isPast(earlyBirdEnd)}>
              {!isPast(earlyBirdEnd) && <ClockIcon />}
              {isPast(earlyBirdEnd) ? '마감' : daysLeft(earlyBirdEnd)}
            </TimelineRight>
          </TimelineBottom>
          <TimelineDivider />
        </TimelineItem>

        <TimelineItem>
          <DateBadge past={isPast(regDeadline)}>04.26</DateBadge>
          <TimelineBottom>
            <TimelineText past={isPast(regDeadline)}>참가 신청 및 티셔츠 예약 마감</TimelineText>
            <TimelineRight past={isPast(regDeadline)}>
              {!isPast(regDeadline) && <ClockIcon />}
              {isPast(regDeadline) ? '마감' : daysLeft(regDeadline)}
            </TimelineRight>
          </TimelineBottom>
          <TimelineDivider />
        </TimelineItem>

        <TimelineItem>
          <DateBadge past={isPast(busChangeEnd)}>05.13</DateBadge>
          <TimelineBottom>
            <TimelineText past={isPast(busChangeEnd)}>차량 변경 마감</TimelineText>
            <TimelineRight past={isPast(busChangeEnd)}>
              {!isPast(busChangeEnd) && <ClockIcon />}
              {isPast(busChangeEnd) ? '마감' : daysLeft(busChangeEnd)}
            </TimelineRight>
          </TimelineBottom>
          <TimelineDivider />
        </TimelineItem>

        <FaqPreviewRow onClick={() => window.open('https://link.inpock.co.kr/hubup26')}>
          <FaqPreviewQ>ⓘ 접수 및 차량 관련 문의가 있어요.</FaqPreviewQ>
        </FaqPreviewRow>
        <FaqPreviewRow onClick={() => router.push('/hub_up/myinfo')}>
          <FaqPreviewQ>ⓘ 차량 시간을 변경하고 싶어요.</FaqPreviewQ>
        </FaqPreviewRow>
      </ScheduleSection>

      {/* T-SHIRTS 배너 */}
      <TshirtBanner onClick={() => router.push('/hub_up/tshirt')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/tshirt/tshirt_banner.png"
          alt="T-SHIRTS"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </TshirtBanner>

      {/* 콘텐츠 섹션 - 배경 블랙 */}
      <BlackSection>
        <ClosingText>
          5월 15일,<br />
          소망수양관에서<br />
          만나요!
        </ClosingText>
        <ContentBtnWhite onClick={() => window.open('https://www.youtube.com/@hub_worship/videos', '_blank')}>
          홍보영상 보러가기 →
        </ContentBtnWhite>
        <ContentBtnNavy onClick={() => window.open('https://www.instagram.com/hub_worship/', '_blank')}>
          허브업 콘텐츠 보러가기 →
        </ContentBtnNavy>
        <ClosingDesc>
          출발 직전까지 볼 수 있는<br />
          유익한 콘텐츠도 만나보세요.
        </ClosingDesc>
      </BlackSection>

      {/* FAQ */}
      <FaqSection>
        <FaqTitle>FAQ</FaqTitle>
        {FAQS.map((faq, i) => (
          <div key={i}>
            <FaqItem onClick={() => setOpenFaq(openFaq === String(i) ? null : String(i))}>
              <FaqCat>{faq.cat}</FaqCat>
              <FaqQ>{faq.q}</FaqQ>
              <FaqToggle>{openFaq === String(i) ? '×' : '+'}</FaqToggle>
            </FaqItem>
            {openFaq === String(i) && (
              <FaqAnswer>
                {faq.a}
                {faq.link && (
                  <FaqLink
                    href={faq.link}
                    target={faq.link.startsWith('http') ? '_blank' : undefined}
                    rel={faq.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {faq.cat === '차량' ? '차량 변경하기 →' : '문의하기 →'}
                  </FaqLink>
                )}
              </FaqAnswer>
            )}
            <FaqDivider />
          </div>
        ))}
        <FaqMoreBtn onClick={() => router.push('/hub_up/faq')}>
          더 많은 FAQ 보기 →
        </FaqMoreBtn>
      </FaqSection>

      <Footer>
        <FooterText>개인정보 처리 방침</FooterText>
        <FooterText>@온누리교회 허브대학부</FooterText>
      </Footer>
    </Wrap>
  );
}

// ─── Styled Components ───────────────────

const Wrap = styled.div`
  width: 100%;
  background: #fff;
  font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Nav = styled.div<{ scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: ${p => p.scrolled ? '#fff' : 'transparent'};
  border-bottom: ${p => p.scrolled ? '1px solid #eee' : 'none'};
  z-index: 100;
  transition: background 0.3s;
`;

const NavLogo = styled.div`display: flex; align-items: center;`;

const HamburgerBtn = styled.button<{ scrolled: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  span {
    display: block;
    width: 18px;
    height: 2px;
    background: ${p => p.scrolled ? '#000' : '#fff'};
  }
`;

/* 처음엔 흰색(투명 배경 위), 스크롤 내리면 파란색 */
const NavCta = styled.button<{ scrolled: boolean }>`
  background: ${p => p.scrolled ? '#2D478C' : 'transparent'};
  color: #fff;
  border: 1px solid ${p => p.scrolled ? '#2D478C' : '#fff'};
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  line-height: 1;
  transition: background 0.3s, border-color 0.3s;
`;

const DropMenu = styled.div`
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-bottom: 1px solid #eee;
  z-index: 99;
`;

const DropItem = styled.div`
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #000;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
`;

/* 히어로 이미지 - aspect ratio 유지 */
const HeroImgWrap = styled.div`
  width: 100%;
  max-height: 100svh;
  overflow: hidden;
  img {
    width: 100%;
    height: 100svh;
    object-fit: cover;
    object-position: top center;
    display: block;
  }
`;

const MainCopy = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  text-align: center;
  line-height: 1.32;
  letter-spacing: -0.02em;
  margin: 0;
  padding: 40px 20px 20px;
`;

const VenueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px 40px;
`;

const VenueIcon = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const VenueText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #2D478C;
  line-height: 1;
`;

const VenueSep = styled.span`
  width: 1px;
  height: 14px;
  background: #2D478C;
  opacity: 0.4;
`;

const DaySection = styled.div`
  padding: 0 20px 40px;
  background: #fff;
`;

const DayRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  cursor: pointer;
`;

const DayLabel = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  line-height: 1.19;
`;

const DayToggle = styled.div<{ open: boolean }>`
  font-size: 24px;
  font-weight: 300;
  color: #000;
  line-height: 1;
`;

const DayDivider = styled.div`
  height: 1px;
  background: #2D478C;
`;

const SessionList = styled.div`
  padding: 8px 0 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SessionItem = styled.div``;

const SessionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #838383;
  margin-bottom: 2px;
`;

const SessionName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #2D478C;
  margin-bottom: 2px;
`;

const SessionSpeaker = styled.div`
  font-size: 12px;
  color: #838383;
`;

const ScheduleSection = styled.div`
  background: #F8F8F8;
  padding: 40px 20px;
`;

const ScheduleLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #2D478C;
  text-align: center;
  margin-bottom: 8px;
`;

const ScheduleTitle = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: #2D478C;
  text-align: center;
  line-height: 1.3;
  margin: 0 0 40px 0;
  letter-spacing: -0.02em;
`;

/* 각 타임라인 항목 - 배지 위, 텍스트 아래 2줄 구조 */
const TimelineItem = styled.div`
  padding: 16px 0 0;
`;

const DateBadge = styled.div<{ past?: boolean }>`
  display: inline-block;
  background: ${p => p.past ? '#C8C8C8' : '#2D478C'};
  color: ${p => p.past ? '#E8E8E8' : '#fff'};
  font-size: 14px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 2px;
  margin-bottom: 8px;
`;

const TimelineBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
`;

const TimelineText = styled.div<{ past?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${p => p.past ? '#C0C0C0' : '#2D478C'};
  line-height: 1.2;
`;

const TimelineRight = styled.div<{ past?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: ${p => p.past ? '#C0C0C0' : '#A1A1A1'};
  flex-shrink: 0;
`;

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke="#A1A1A1" strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke="#A1A1A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const TimelineDivider = styled.div`
  height: 1px;
  background: #D8D8D8;
`;

const FaqPreviewRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
  cursor: pointer;
`;

const FaqPreviewQ = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #2D478C;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-align: center;
`;

const FaqPreviewDivider = styled.div`
  height: 1px;
  background: #D8D8D8;
`;

/* T-SHIRTS 배너 - BG 화이트 */
const TshirtBanner = styled.div`
  width: 100%;
  cursor: pointer;
  overflow: hidden;
`;

const TshirtLabel = styled.div`
  font-size: 72px;
  font-weight: 700;
  color: #000;
  line-height: 1.19;
  letter-spacing: -0.02em;
`;

const TshirtSubLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  letter-spacing: -0.02em;
`;

const TshirtCta = styled.div`
  background: #000;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  letter-spacing: -0.02em;
`;

/* 콘텐츠 섹션 - 배경 블랙 */
const BlackSection = styled.div`
  background: #000;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ClosingText = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.32;
  margin: 0 0 24px 0;
`;

const ClosingDesc = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.43;
  margin: 8px 0 0 0;
`;

const FaqSection = styled.div`
  background: #fff;
  padding: 40px 20px;
`;

const FaqTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.19;
`;

const FaqItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 0;
  cursor: pointer;
`;

const FaqCat = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #838383;
  min-width: 28px;
  padding-top: 2px;
`;

const FaqQ = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  flex: 1;
  line-height: 1.19;
`;

const FaqToggle = styled.span`
  font-size: 20px;
  font-weight: 300;
  color: #000;
  flex-shrink: 0;
`;

const FaqAnswer = styled.div`
  font-size: 14px;
  color: #757575;
  line-height: 1.6;
  padding: 0 0 12px 36px;
  white-space: pre-line;
`;

const FaqLink = styled.a`
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2D478C;
  text-decoration: none;
`;

const FaqDivider = styled.div`
  height: 1px;
  background: rgba(0,0,0,0.5);
`;

const FaqMoreBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: none;
  border: 1px solid #E6E6E6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #838383;
  cursor: pointer;
  margin-top: 16px;
  font-family: inherit;
`;

const Footer = styled.div`
  background: #C5C5C5;
  padding: 20px;
`;

const FooterText = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: #000;
  margin: 0 0 4px 0;
  line-height: 1.67;
`;

/* 홍보영상 버튼 - 흰 배경, 검정 테두리 */
const ContentBtnWhite = styled.div`
  height: 51px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  background: #fff;
  cursor: pointer;
`;

/* 허브업 콘텐츠 버튼 - 네이비 배경 */
const ContentBtnNavy = styled.div`
  height: 51px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: #2D478C;
  cursor: pointer;
`;
