"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import {
  OutreachPage,
  AppHeader,
  HeaderBtn,
  HeaderSpacer,
  HeaderTitle,
  TEXT,
  BG,
  PRIMARY,
  SANS,
  SERIF,
} from "../_components/shared";

const CTA_COLOR = PRIMARY;

interface Country {
  season_count: number;
}

export default function OnboardingClient() {
  const router = useRouter();
  const [countryCount, setCountryCount] = useState(0);
  const [seasonCount, setSeasonCount] = useState(0);

  useEffect(() => {
    fetch("/api/outreach/countries")
      .then((r) => r.json())
      .then((d) => {
        const countries: Country[] = d.countries ?? [];
        setCountryCount(countries.length);
        setSeasonCount(
          countries.reduce((sum, c) => sum + (c.season_count ?? 0), 0)
        );
      })
      .catch(() => {});
  }, []);

  return (
    <OnboardingPage>
      <AppHeader>
        <BackBtn aria-label="뒤로가기">
          <img src="/images/outreach/arrow_back.png" alt="" />
        </BackBtn>
        <HeaderTitle as="span"></HeaderTitle>
        <HeaderSpacer />
      </AppHeader>

      <Main>

        <TitleSection>
          <Title>HUB 허브<br/>해외 아웃리치 아카이브</Title>
          <Subtitle>허브가 세계 곳곳에 남긴 복음의 발자취를<br/>지도 위에서 만나보세요</Subtitle>
        </TitleSection>

        <GlobeIcon src="/images/outreach/globe.png" alt="" />

        <BottomCluster>
          {countryCount > 0 && (
            <StatsRow>
              <Stat>
                <StatNum>{countryCount}</StatNum>
                <StatLabel>개국</StatLabel>
              </Stat>
              <Stat>
                <StatNum>{seasonCount}</StatNum>
                <StatLabel>시즌</StatLabel>
              </Stat>
            </StatsRow>
          )}

          <VerseSection>
            <VerseText>
              보내심을 받지 아니하였으면 어찌 전파하리요.<br/>
              기록된 바 아름답도다 좋은 소식을 전하는 자들의<br/>
              발이여 함과 같으니라.
            </VerseText>
            <VerseRef>[ 로마서 10 : 15 ]</VerseRef>
          </VerseSection>
        </BottomCluster>

      </Main>

      <Footer>
        <CTAButton onClick={() => router.push("/outreach")}>
          발자취 따라가기
        </CTAButton>
      </Footer>
    </OnboardingPage>
  );
}

const OnboardingPage = styled(OutreachPage)`
  background-image: url("/images/outreach/onboarding.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const GlobeIcon = styled.img`
  width: calc(100% - 96px);
  height: auto;
  object-fit: contain;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 8px;
  width: 100%;
`;

const BottomCluster = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 32px 24px 8px;
`;

const BackBtn = styled(HeaderBtn)`
  color: ${TEXT};
  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
`;

const Title = styled.h1`
  font-family: ${SERIF};
  font-size: 24px;
  font-weight: 700;
  color: ${TEXT};
  line-height: 1.35;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-family: ${SERIF};
  font-size: 14px;
  font-weight: 300;
  color: ${TEXT};
  white-space: pre-wrap;
  line-height: 1.5;
  letter-spacing: -0.02em;
  margin: 0;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 4px 0;
`;

const Stat = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const StatNum = styled.span`
  font-family: ${SERIF};
  font-weight: 700;
  font-size: 20px;
  line-height: 1.1;
  color: ${PRIMARY};
  letter-spacing: -0.02em;
`;

const StatLabel = styled.span`
  font-family: ${SANS};
  font-weight: 600;
  font-size: 12px;
  color: ${TEXT};
  opacity: 0.7;
  letter-spacing: -0.02em;
`;

const VerseSection = styled.div`
  padding: 0 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const VerseText = styled.p`
  font-size: 13px;
  color: rgba(81, 52, 0, 0.7);
  line-height: 1.5;
  letter-spacing: -0.02em;
  margin: 0;
`;

const VerseRef = styled.p`
  font-size: 13px;
  color: rgba(81, 52, 0, 0.7);
  line-height: 1.5;
  letter-spacing: -0.02em;
  margin: 0;
`;

const Footer = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 10;
  padding: 24px 24px max(24px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CTAButton = styled.button`
  width: 100%;
  height: 52px;
  background: ${CTA_COLOR};
  color: ${BG};
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
