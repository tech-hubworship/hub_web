"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HubUpMainPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 460);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Wrap>
      {/* 네비게이션 */}
      <Nav scrolled={scrolled}>
        <NavLogo>
          {/* 피그마: Group 2 (햄버거 아이콘) x:228 y:23 */}
          <HamburgerBtn onClick={() => setMenuOpen(!menuOpen)} scrolled={scrolled}>
            <span /><span /><span />
          </HamburgerBtn>
        </NavLogo>
        {/* 피그마: Group 37 - 신청하기 버튼 x:266 y:12 w:74 h:37 */}
        <NavCta scrolled={scrolled} onClick={() => router.push('/hub_up/register')}>신청하기</NavCta>
      </Nav>

      {menuOpen && (
        <DropMenu>
          {session && (
            <DropItem onClick={() => { router.push('/hub_up/myinfo'); setMenuOpen(false); }}>내 정보</DropItem>
          )}
          <DropItem onClick={() => { router.push('/hub_up/tshirt'); setMenuOpen(false); }}>티셔츠 예약</DropItem>
          <DropItem onClick={() => { router.push('/hub_up/faq'); setMenuOpen(false); }}>FAQ</DropItem>
        </DropMenu>
      )}

      {/* 피그마: image 1 - 히어로 이미지 x:0 y:0 w:360 h:509 */}
      <HeroImgWrap>
        <Image
          src="/images/hubup/hero_main.png"
          alt="2026 HUBUP Be Holy"
          width={360}
          height={509}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />
      </HeroImgWrap>

      {/* 피그마: 돌아온 2026 허브업! 텍스트 x:62 y:592 w:235 h:111
          fontFamily: Wanted Sans, fontWeight: 700, fontSize: 28, center */}
      <MainCopy>
        돌아온 2026 허브업!<br />
        거룩하신 하나님과<br />
        동행할 준비되셨나요?
      </MainCopy>

      {/* 피그마: Group 10 - 소망수양관 + 날짜 x:75 y:557 */}
      <VenueRow>
        <VenueText>소망수양관</VenueText>
        <VenueSep />
        <VenueText>2026.5.15-17</VenueText>
      </VenueRow>

      {/* 피그마: Day 1/2/3 + Line 구분선 y:743~944 */}
      <DaySection>
        <DayItem>
          <DayLabel>Day 1</DayLabel>
          <DayLine />
        </DayItem>
        <DayItem>
          <DayLabel>Day 2</DayLabel>
          <DayLine />
        </DayItem>
        <DayItem>
          <DayLabel>Day 3</DayLabel>
        </DayItem>
      </DaySection>

      {/* 피그마: Rectangle 10 (F8F8F8 배경) y:1003 h:654 */}
      <ScheduleSection>
        {/* 피그마: Group 9 - Schedule 텍스트 x:145 y:1051 */}
        <ScheduleLabel>Schedule</ScheduleLabel>
        {/* 피그마: 주요 일정을 놓치지 마세요. x:101 y:1088 */}
        <ScheduleTitle>주요 일정을<br />놓치지 마세요.</ScheduleTitle>

        {/* 피그마: Frame 2 (CDCDCD) + 얼리버드 신청 기간 y:1202~1246 */}
        <TimelineRow>
          <DateBadge gray>04.12 - 18</DateBadge>
          <TimelineConnector />
          <TimelineText gray>얼리버드 신청 기간</TimelineText>
          <TimelineRight gray>14일 남음</TimelineRight>
        </TimelineRow>

        {/* 피그마: Line 5 y:1292 */}
        <TimelineDivider />

        {/* 피그마: Frame 4 (2D478C) + 참가 신청 마감 y:1312~1356 */}
        <TimelineRow>
          <DateBadge navy>04.26</DateBadge>
          <TimelineConnector />
          <TimelineText>참가 신청 마감</TimelineText>
          <TimelineRight>마감</TimelineRight>
        </TimelineRow>

        <TimelineDivider />

        {/* 피그마: Frame 5 (2D478C) + 차량 변경 마감 y:1422~1466 */}
        <TimelineRow>
          <DateBadge navy>05.13</DateBadge>
          <TimelineConnector />
          <TimelineText>차량 변경 마감</TimelineText>
          <TimelineRight>17일 남음</TimelineRight>
        </TimelineRow>

        <TimelineDivider />

        {/* 피그마: FAQ 미리보기 y:1560~1609 */}
        <FaqPreviewRow>
          <FaqPreviewQ>기한 내 참가 신청을 하지 못하면 어떻게 되나요?</FaqPreviewQ>
        </FaqPreviewRow>
        <FaqPreviewDivider />
        <FaqPreviewRow>
          <FaqPreviewQ>차량 시간을 변경하고 싶어요.</FaqPreviewQ>
        </FaqPreviewRow>
      </ScheduleSection>

      {/* 피그마: Group 36 - T-SHIRTS 배너 y:1657 h:228 */}
      <TshirtBanner onClick={() => router.push('/hub_up/tshirt')}>
        <TshirtLabel>T-SHIRTS</TshirtLabel>
      </TshirtBanner>

      {/* 피그마: Group 35 - 티셔츠 구매하기 → y:1885 h:52 */}
      <TshirtCta onClick={() => router.push('/hub_up/tshirt')}>
        티셔츠 구매하기 →
      </TshirtCta>

      {/* 피그마: Rectangle 11 (흰색) + 5월 15일 카피 + 콘텐츠 버튼 */}
      <WhiteSection>
        <ClosingText>
          5월 15일,<br />
          소망수양관에서<br />
          만나요!
        </ClosingText>
        <ContentBtnWhite onClick={() => {}}>홍보영상 보러가기 →</ContentBtnWhite>
        <ContentBtnNavy onClick={() => {}}>허브업 콘텐츠 보러가기 →</ContentBtnNavy>
        <ClosingDesc>
          출발 직전까지 볼 수 있는<br />
          유익한 콘텐츠도 만나보세요.
        </ClosingDesc>
      </WhiteSection>

      {/* 피그마: FAQ 섹션 y:1985~2244 */}
      <FaqSection>
        <FaqTitle>FAQ</FaqTitle>
        <FaqItem onClick={() => router.push('/hub_up/faq')}>
          <FaqCat>접수</FaqCat>
          <FaqQ>허브업 신청을 취소하고 싶어요.</FaqQ>
        </FaqItem>
        <FaqDivider />
        <FaqItem onClick={() => router.push('/hub_up/faq')}>
          <FaqCat>차량</FaqCat>
          <FaqQ>차량 시간을 변경하고 싶어요.</FaqQ>
        </FaqItem>
        <FaqDivider />
        <FaqItem onClick={() => router.push('/hub_up/faq')}>
          <FaqCat>접수</FaqCat>
          <FaqQ>부분 참석시 회비 할인이 되나요?</FaqQ>
        </FaqItem>
      </FaqSection>

      {/* 피그마: 푸터 Rectangle 12 (C5C5C5) y:2700 h:84 */}
      <Footer>
        <FooterText>개인정보 처리 방침</FooterText>
        <FooterText>@온누리교회 허브대학부</FooterText>
      </Footer>
    </Wrap>
  );
}

// ─── Styled Components (피그마 스펙 기반) ───────────────────

const Wrap = styled.div`
  width: 100%;
  background: #fff;
  font-family: 'Wanted Sans', 'Pretendard', -apple-system, sans-serif;
`;

/* 네비게이션 - 피그마: Rectangle 1 y:0 h:60 */
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

/* 피그마: Group 37 - 신청하기 버튼 w:74 h:37 */
const NavCta = styled.button<{ scrolled: boolean }>`
  background: ${p => p.scrolled ? '#000' : '#2D478C'};
  color: #fff;
  border: none;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  line-height: 1;
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

/* 피그마: image 1 - w:360 h:509, 최상단부터 시작 */
const HeroImgWrap = styled.div`
  width: 100%;
`;

/* 피그마: 메인 카피 fontFamily: Wanted Sans, 700, 28px, center, color:#000 */
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

/* 피그마: Group 10 - 소망수양관 + 날짜, fontWeight:600, fontSize:16, color:#2D478C */
const VenueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px 40px;
`;

const VenueText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #2D478C;
  line-height: 2.3;
`;

const VenueSep = styled.span`
  width: 1px;
  height: 16px;
  background: #2D478C;
  opacity: 0.4;
`;

/* 피그마: Day 1/2/3 - fontSize:28, fontWeight:700, color:#000 */
const DaySection = styled.div`
  display: flex;
  padding: 0 20px;
  border-top: 1px solid #2D478C;
`;

const DayItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  position: relative;
`;

const DayLabel = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  line-height: 1.19;
`;

const DayLine = styled.div`
  position: absolute;
  right: 0;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: #2D478C;
`;

/* 피그마: Rectangle 10 (F8F8F8) y:1003 h:654 */
const ScheduleSection = styled.div`
  background: #F8F8F8;
  padding: 40px 20px;
`;

/* 피그마: Schedule - fontWeight:600, fontSize:16, color:#2D478C, center */
const ScheduleLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #2D478C;
  text-align: center;
  line-height: 2.3;
  margin-bottom: 4px;
`;

/* 피그마: 주요 일정을 놓치지 마세요. - 700, 28px, color:#2D478C, center */
const ScheduleTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #2D478C;
  text-align: center;
  line-height: 1.32;
  margin: 0 0 32px 0;
`;

const TimelineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
`;

/* 피그마: Frame 2 (CDCDCD gray) / Frame 4,5 (2D478C navy) - w:92/64 h:32 */
const DateBadge = styled.div<{ gray?: boolean; navy?: boolean }>`
  padding: 6px 10px;
  background: ${p => p.gray ? '#CDCDCD' : '#2D478C'};
  color: ${p => p.gray ? '#E6E6E6' : '#fff'};
  font-size: 16px;
  font-weight: 700;
  min-width: 64px;
  text-align: center;
  line-height: 1.19;
`;

const TimelineConnector = styled.div`
  flex: 1;
  height: 1px;
  background: #B5B5B5;
`;

const TimelineText = styled.div<{ gray?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.gray ? '#CDCDCD' : '#2D478C'};
  line-height: 1.19;
  flex: 1;
`;

const TimelineRight = styled.div<{ gray?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: #A1A1A1;
  min-width: 54px;
  text-align: right;
`;

const TimelineDivider = styled.div`
  height: 1px;
  background: #B5B5B5;
  margin: 4px 0;
`;

const FaqPreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 0;
  cursor: pointer;
`;

const FaqPreviewQ = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #2D478C;
  flex: 1;
`;

const FaqPreviewDivider = styled.div`
  height: 1px;
  background: #2D478C;
`;

/* 피그마: Group 36 - T-SHIRTS 배너 y:1657 h:228, 배경은 티셔츠 이미지 */
const TshirtBanner = styled.div`
  background: #000;
  height: 228px;
  display: flex;
  align-items: flex-end;
  padding: 8px 20px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
`;

const TshirtLabel = styled.div`
  font-size: 72px;
  font-weight: 700;
  color: #fff;
  line-height: 1.19;
  letter-spacing: -0.02em;
`;

/* 피그마: Group 35 - 티셔츠 구매하기 → y:1885 h:52, 배경:#000 */
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

/* 피그마: Rectangle 11 (흰색) y:2287 h:413 */
const WhiteSection = styled.div`
  background: #fff;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ClosingText = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  text-align: center;
  line-height: 1.32;
  margin: 0 0 24px 0;
`;

const ClosingDesc = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: #000;
  text-align: center;
  line-height: 1.43;
  margin: 8px 0 0 0;
`;

/* 피그마: FAQ 섹션 */
const FaqSection = styled.div`
  background: #fff;
  padding: 40px 20px;
`;

/* 피그마: FAQ - 700, 28px, center, color:#000 */
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

/* 피그마: 접수/차량 - 600, 12px, color:#838383 */
const FaqCat = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #838383;
  min-width: 28px;
  padding-top: 2px;
`;

/* 피그마: FAQ 질문 - 700, 18px, color:#000 */
const FaqQ = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  flex: 1;
  line-height: 1.19;
`;

const FaqDivider = styled.div`
  height: 1px;
  background: rgba(0,0,0,0.5);
`;

/* 피그마: 푸터 Rectangle 12 (C5C5C5) y:2700 h:84 */
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

/* 피그마: Frame 7 - 홍보영상 보러가기 → h:51, 배경:#fff, 테두리:#000 */
const ContentBtnWhite = styled.div`
  height: 51px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  border: 1px solid #000;
`;

/* 피그마: Frame 6 - 허브업 콘텐츠 보러가기 → h:51, 배경:#2D478C */
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
