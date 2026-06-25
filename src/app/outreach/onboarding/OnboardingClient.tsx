"use client";

import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import {
  OutreachPage,
  AppHeader,
  HeaderBtn,
  HeaderSpacer,
  HeaderTitle,
  TEXT,
  TEXT2,
  MUTED,
  SANS,
} from "../_components/shared";

const CTA_COLOR = "#A07018";

export default function OnboardingClient() {
  const router = useRouter();

  return (
    <OutreachPage>
      <AppHeader>
        <HeaderBtn aria-label="뒤로가기">←</HeaderBtn>
        <HeaderTitle as="span"></HeaderTitle>
        <HeaderSpacer />
      </AppHeader>

      <Main>

        <TitleSection>
          <Title>HUB 허브<br/>해외 아웃리치 아카이브</Title>
          <Subtitle>허브가 세계 곳곳에 남긴 복음의 발자취를<br/>지도 위에서 만나보세요</Subtitle>
        </TitleSection>

        <GlobeIcon>🌍</GlobeIcon>

        <VerseSection>
          <VerseText>
            보내심을 받지 아니하였으면 어찌 전파하리요<br/>
            기록된 바 아름답도다 좋은 소식을<br/>
            전하는 자들의 발이여 함과 같으니라
          </VerseText>
          <VerseRef>[ 로마서 10:15 ]</VerseRef>
        </VerseSection>

      </Main>

      <Footer>
        <CTAButton onClick={() => router.push("/outreach")}>
          탐방 시작하기
        </CTAButton>
      </Footer>
    </OutreachPage>
  );
}

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 24px;
  text-align: center;
`;

const GlobeIcon = styled.div`
  font-size: 180px;
  margin: 24px;
  line-height: 1;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 8px;
  width: 100%;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${TEXT};
  line-height: 1.35;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${MUTED};
  white-space: pre-wrap;
  margin: 0;
`;

const VerseSection = styled.div`
  padding: 16px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const VerseText = styled.p`
  font-size: 12px;
  color: ${TEXT2};
  margin: 0;
`;

const VerseRef = styled.p`
  font-size: 12px;
  color: ${MUTED};
  margin: 0;
`;

const Footer = styled.div`
  padding: 12px 24px max(24px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CTAButton = styled.button`
  width: 100%;
  max-width: 320px;
  height: 52px;
  background: ${CTA_COLOR};
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  font-family: ${SANS};
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: opacity 0.15s;
  &:active {
    opacity: 0.85;
  }
`;
