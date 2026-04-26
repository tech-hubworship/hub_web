"use client";

import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ─── 정적 데이터 (서버에서 props로 전달) ───────────────────
interface Session {
  label: string;
  sessions: { title: string; name: string; speaker: string }[];
}
interface FaqItem {
  cat: string;
  q: string;
  a: string;
  link?: string;
}
interface ScheduleItem {
  date: string;
  label: string;
  past: boolean;
  daysLeft: string;
}

interface Props {
  days: Session[];
  faqs: FaqItem[];
  schedule: ScheduleItem[];
}

export default function HubUpClient({ days, faqs, schedule }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // 챌린지 오픈 카운트다운
  const CHALLENGE_OPEN = new Date('2026-04-26T23:59:59+09:00');
  const [now, setNow] = useState(() => new Date());
  const isOpen = now >= CHALLENGE_OPEN;

  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const countdown = (() => {
    const diff = CHALLENGE_OPEN.getTime() - now.getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

      {/* 히어로 이미지 */}
      <HeroImgWrap>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hubup/hero_main_new.png" alt="2026 HUBUP Be Holy" style={{ width: '100%', height: '100%', display: 'block' }} />
      </HeroImgWrap>

      {/* 챌린지 배너 */}
      <ChallengeBanner>
        <ChallengeLabel>허브업 챌린지</ChallengeLabel>
        <ChallengeTitle>레위기 19장 19일 실천</ChallengeTitle>
        {isOpen ? (
          <ChallengeBtn onClick={() => router.push('/hub_up/challenge')}>
            오늘의 실천 참여하기 →
          </ChallengeBtn>
        ) : (
          <ChallengeCountdownBtn disabled>
            <ChallengeCountdownTop>챌린지 오픈까지</ChallengeCountdownTop>
            <ChallengeCountdownTime>{countdown}</ChallengeCountdownTime>
          </ChallengeCountdownBtn>
        )}
      </ChallengeBanner>

      <MainCopy>
        돌아온 2026 허브업!<br />
        거룩하신 하나님과<br />
        동행할 준비되셨나요?
      </MainCopy>

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

      {/* Day 1/2/3 아코디언 */}
      <DaySection>
        {days.map((day, idx) => (
          <div key={day.label}>
            <DayRow onClick={() => setOpenDay(openDay === idx ? null : idx)}>
              <DayLabel>{day.label}</DayLabel>
              <DayToggle open={openDay === idx}>{openDay === idx ? '×' : '+'}</DayToggle>
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

      {/* Schedule */}
      <ScheduleSection>
        <ScheduleLabel>Schedule</ScheduleLabel>
        <ScheduleTitle>주요 일정을<br />놓치지 마세요.</ScheduleTitle>
        {schedule.map((item) => (
          <TimelineItem key={item.date}>
            <DateBadge past={item.past}>{item.date}</DateBadge>
            <TimelineBottom>
              <TimelineText past={item.past}>{item.label}</TimelineText>
              <TimelineRight past={item.past}>
                {!item.past && <ClockIcon />}
                {item.daysLeft}
              </TimelineRight>
            </TimelineBottom>
            <TimelineDivider />
          </TimelineItem>
        ))}
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
        <img src="/images/tshirt/tshirt_banner.png" alt="T-SHIRTS" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </TshirtBanner>

      {/* 콘텐츠 섹션 */}
      <BlackSection>
        <ClosingText>5월 15일,<br />소망수양관에서<br />만나요!</ClosingText>
        <ContentBtnWhite onClick={() => window.open('https://www.youtube.com/@hub_worship/videos', '_blank')}>
          홍보영상 보러가기 →
        </ContentBtnWhite>
        <ContentBtnNavy onClick={() => window.open('https://www.instagram.com/hub_worship/', '_blank')}>
          허브업 콘텐츠 보러가기 →
        </ContentBtnNavy>
        <ClosingDesc>출발 직전까지 볼 수 있는<br />유익한 콘텐츠도 만나보세요.</ClosingDesc>
      </BlackSection>

      {/* FAQ 미리보기 */}
      <FaqSection>
        <FaqTitle>FAQ</FaqTitle>
        {faqs.map((faq, i) => (
          <div key={i}>
            <FaqItemRow onClick={() => setOpenFaq(openFaq === String(i) ? null : String(i))}>
              <FaqCat>{faq.cat}</FaqCat>
              <FaqQ>{faq.q}</FaqQ>
              <FaqToggle>{openFaq === String(i) ? '×' : '+'}</FaqToggle>
            </FaqItemRow>
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
        <FaqMoreBtn onClick={() => router.push('/hub_up/faq')}>더 많은 FAQ 보기 →</FaqMoreBtn>
      </FaqSection>

      <Footer>
        <FooterText>개인정보 처리 방침</FooterText>
        <FooterText>@온누리교회 허브대학부</FooterText>
      </Footer>
    </Wrap>
  );
}

// ─── Styled Components ───────────────────

const Wrap = styled.div`width: 100%; background: #fff; font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;`;
const Nav = styled.div<{ scrolled: boolean }>`
  position: fixed; top: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; height: 60px;
  display: flex; align-items: center; justify-content: space-between; padding: 0 20px;
  background: ${p => p.scrolled ? '#fff' : 'transparent'};
  border-bottom: ${p => p.scrolled ? '1px solid #eee' : 'none'};
  z-index: 100; transition: background 0.3s;
`;
const HamburgerBtn = styled.button<{ scrolled: boolean }>`
  background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 4px; padding: 4px;
  span { display: block; width: 18px; height: 2px; background: ${p => p.scrolled ? '#000' : '#fff'}; }
`;
const NavCta = styled.button<{ scrolled: boolean }>`
  background: ${p => p.scrolled ? '#2D478C' : 'transparent'}; color: #fff;
  border: 1px solid ${p => p.scrolled ? '#2D478C' : '#fff'};
  padding: 8px 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; line-height: 1;
  transition: background 0.3s, border-color 0.3s;
`;
const DropMenu = styled.div`
  position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; background: #fff; border-bottom: 1px solid #eee; z-index: 99;
`;
const DropItem = styled.div`
  padding: 16px 20px; font-size: 16px; font-weight: 600; color: #000; cursor: pointer;
  border-bottom: 1px solid #f0f0f0; &:last-child { border-bottom: none; }
`;
const HeroImgWrap = styled.div`
  width: 100%; max-height: 100svh; overflow: hidden;
  img { width: 100%; height: 100svh; object-fit: cover; object-position: top center; display: block; }
`;
const MainCopy = styled.h1`
  font-size: 28px; font-weight: 700; color: #000; text-align: center;
  line-height: 1.32; letter-spacing: -0.02em; margin: 0; padding: 40px 20px 20px;
`;
const ChallengeBanner = styled.div`
  width: 100%;
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 20px 38px;
  gap: 0;
`;
const ChallengeLabel = styled.div`
  font-family: 'Wanted Sans', 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 37px;
  text-align: center;
  color: #2D478C;
  margin-bottom: 0;
`;
const ChallengeTitle = styled.h2`
  font-family: 'Wanted Sans', 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 37px;
  text-align: center;
  letter-spacing: -0.02em;
  color: #2D478C;
  margin: 0 0 14px 0;
  white-space: nowrap;
`;
const ChallengeBtn = styled.button`
  width: 100%;
  max-width: 320px;
  height: 51px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background: #2D478C;
  border: none;
  cursor: pointer;
  font-family: 'Wanted Sans', 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 21px;
  letter-spacing: -0.02em;
  color: #FFFFFF;
  &:active { opacity: 0.85; }
`;
const ChallengeCountdownBtn = styled.button`
  width: 100%;
  max-width: 320px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  background: #8DADFF;
  border: none;
  cursor: not-allowed;
  font-family: 'Wanted Sans', 'Pretendard', sans-serif;
`;
const ChallengeCountdownTop = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.02em;
`;
const ChallengeCountdownTime = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
`;
const VenueRow = styled.div`display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 20px 40px;`;
const VenueIcon = styled.span`display: flex; align-items: center; flex-shrink: 0;`;
const VenueText = styled.span`font-size: 16px; font-weight: 600; color: #2D478C; line-height: 1;`;
const VenueSep = styled.span`width: 1px; height: 14px; background: #2D478C; opacity: 0.4;`;
const DaySection = styled.div`padding: 0 20px 40px; background: #fff;`;
const DayRow = styled.div`display: flex; align-items: center; justify-content: space-between; padding: 16px 0; cursor: pointer;`;
const DayLabel = styled.div`font-size: 28px; font-weight: 700; color: #000; line-height: 1.19;`;
const DayToggle = styled.div<{ open: boolean }>`font-size: 24px; font-weight: 300; color: #000; line-height: 1;`;
const DayDivider = styled.div`height: 1px; background: #2D478C;`;
const SessionList = styled.div`padding: 8px 0 16px; display: flex; flex-direction: column; gap: 16px;`;
const SessionItem = styled.div``;
const SessionTitle = styled.div`font-size: 12px; font-weight: 600; color: #838383; margin-bottom: 2px;`;
const SessionName = styled.div`font-size: 20px; font-weight: 700; color: #2D478C; margin-bottom: 2px;`;
const SessionSpeaker = styled.div`font-size: 12px; color: #838383;`;
const ScheduleSection = styled.div`background: #F8F8F8; padding: 40px 20px;`;
const ScheduleLabel = styled.div`font-size: 16px; font-weight: 600; color: #2D478C; text-align: center; margin-bottom: 8px;`;
const ScheduleTitle = styled.h2`font-size: 32px; font-weight: 800; color: #2D478C; text-align: center; line-height: 1.3; margin: 0 0 40px 0; letter-spacing: -0.02em;`;
const TimelineItem = styled.div`padding: 16px 0 0;`;
const DateBadge = styled.div<{ past?: boolean }>`
  display: inline-block; background: ${p => p.past ? '#C8C8C8' : '#2D478C'};
  color: ${p => p.past ? '#E8E8E8' : '#fff'}; font-size: 14px; font-weight: 700;
  padding: 5px 10px; border-radius: 2px; margin-bottom: 8px;
`;
const TimelineBottom = styled.div`display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px;`;
const TimelineText = styled.div<{ past?: boolean }>`font-size: 24px; font-weight: 700; color: ${p => p.past ? '#C0C0C0' : '#2D478C'}; line-height: 1.2;`;
const TimelineRight = styled.div<{ past?: boolean }>`display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: ${p => p.past ? '#C0C0C0' : '#A1A1A1'}; flex-shrink: 0;`;
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke="#A1A1A1" strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke="#A1A1A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const TimelineDivider = styled.div`height: 1px; background: #D8D8D8;`;
const FaqPreviewRow = styled.div`display: flex; align-items: center; justify-content: center; padding: 14px 0; cursor: pointer;`;
const FaqPreviewQ = styled.div`font-size: 13px; font-weight: 500; color: #2D478C; text-decoration: underline; text-underline-offset: 3px; text-align: center;`;
const TshirtBanner = styled.div`width: 100%; cursor: pointer; overflow: hidden;`;
const BlackSection = styled.div`background: #000; padding: 40px 20px; display: flex; flex-direction: column; gap: 8px;`;
const ClosingText = styled.h2`font-size: 28px; font-weight: 700; color: #fff; text-align: center; line-height: 1.32; margin: 0 0 24px 0;`;
const ClosingDesc = styled.p`font-size: 14px; font-weight: 700; color: #fff; text-align: center; line-height: 1.43; margin: 8px 0 0 0;`;
const ContentBtnWhite = styled.div`height: 51px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #000; background: #fff; cursor: pointer;`;
const ContentBtnNavy = styled.div`height: 51px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; background: #2D478C; cursor: pointer;`;
const FaqSection = styled.div`background: #fff; padding: 40px 20px;`;
const FaqTitle = styled.h2`font-size: 28px; font-weight: 700; color: #000; text-align: center; margin: 0 0 24px 0; line-height: 1.19;`;
const FaqItemRow = styled.div`display: flex; align-items: flex-start; gap: 8px; padding: 12px 0; cursor: pointer;`;
const FaqCat = styled.span`font-size: 12px; font-weight: 600; color: #838383; min-width: 28px; padding-top: 2px;`;
const FaqQ = styled.span`font-size: 18px; font-weight: 700; color: #000; flex: 1; line-height: 1.19;`;
const FaqToggle = styled.span`font-size: 20px; font-weight: 300; color: #000; flex-shrink: 0;`;
const FaqAnswer = styled.div`font-size: 14px; color: #757575; line-height: 1.6; padding: 0 0 12px 36px; white-space: pre-line;`;
const FaqLink = styled.a`display: block; margin-top: 8px; font-size: 13px; font-weight: 600; color: #2D478C; text-decoration: none;`;
const FaqDivider = styled.div`height: 1px; background: rgba(0,0,0,0.5);`;
const FaqMoreBtn = styled.button`width: 100%; padding: 16px; background: none; border: 1px solid #E6E6E6; border-radius: 8px; font-size: 14px; font-weight: 600; color: #838383; cursor: pointer; margin-top: 16px; font-family: inherit;`;
const Footer = styled.div`background: #C5C5C5; padding: 20px;`;
const FooterText = styled.p`font-size: 12px; font-weight: 700; color: #000; margin: 0 0 4px 0; line-height: 1.67;`;
