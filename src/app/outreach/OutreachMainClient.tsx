"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styled from "@emotion/styled";

// react-simple-maps SSR 불가 → dynamic import
const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

interface Country {
  id: number;
  name_ko: string;
  name_en: string;
  iso_code: string;
  lat: number;
  lng: number;
  season_count: number;
}

export default function OutreachMainClient() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [totalSeasons, setTotalSeasons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/outreach/countries")
      .then((r) => r.json())
      .then((d) => {
        setCountries(d.countries ?? []);
        setTotalSeasons((d.countries ?? []).reduce((s: number, c: Country) => s + c.season_count, 0));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page>
      <TopBar>OUTREACH ARCHIVE · 1985 — PRESENT</TopBar>

      <Inner>
        <Hero>
          <HeroTitle>
            우리가 다녀온 <em>발자취</em>
          </HeroTitle>
          <HeroMeta>V1.0 · PROTOTYPE &nbsp;&nbsp; UPDATED 2026.04.27</HeroMeta>
        </Hero>

        <Section>
          <SectionLabel>── WORLD ATLAS</SectionLabel>
          <Headline>
            매년 우리는 어디론가 <em>떠났습니다</em>
          </Headline>
          <Desc>
            매년 여름과 겨울, 우리 교회는 세계 곳곳으로 아웃리치를 떠나왔습니다.
            흩어졌던 단체사진과 기도카드, 함께한 이름들을 한 곳에 모았습니다.
            지도 위 표식을 따라가 보세요.
          </Desc>

          <StatsRow>
            <StatBox>
              <StatNum>{loading ? "—" : countries.length}</StatNum>
              <StatLabel>COUNTRIES</StatLabel>
            </StatBox>
            <StatBox>
              <StatNum>{loading ? "—" : totalSeasons}</StatNum>
              <StatLabel>SEASONS</StatLabel>
            </StatBox>
          </StatsRow>

          <MapWrapper>
            <MapInner>
              <MapHeader>— MISSION FIELD ATLAS —</MapHeader>
              {loading ? (
                <MapPlaceholder />
              ) : (
                <WorldMap
                  countries={countries}
                  onCountryClick={(id) => router.push(`/outreach/${id}`)}
                />
              )}
            </MapInner>
          </MapWrapper>
        </Section>
      </Inner>

      <Footer>
        <FooterText>MISSION OUTREACH ARCHIVE</FooterText>
        <FooterText>— MADE WITH CARE —</FooterText>
        <FooterText>V1.0 · PROTOTYPE</FooterText>
      </Footer>
    </Page>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CREAM   = "#F5F0E8";
const BEIGE   = "#D9CEBC";
const TERRA   = "#C45C3A";
const DARK    = "#2D2A24";
const MUTED   = "#8C7F6E";
const BORDER  = "#BFB8A8";

const Page = styled.div`
  min-height: 100vh;
  background: ${CREAM};
  color: ${DARK};
  font-family: "Noto Serif KR", "Noto Serif", Georgia, serif;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
`;

const Inner = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px;
`;

const TopBar = styled.div`
  padding: 8px 20px;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: ${MUTED};
  border-bottom: 1px solid ${BORDER};
  font-family: "Cormorant Garamond", "Times New Roman", serif;
`;

const Hero = styled.div`
  padding: 20px 0 0;
`;

const HeroTitle = styled.h1`
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px;
  line-height: 1.2;
  color: ${MUTED};
  em {
    font-style: italic;
    color: ${TERRA};
  }
`;

const HeroMeta = styled.p`
  font-size: 9px;
  letter-spacing: 0.12em;
  color: ${MUTED};
  margin: 0;
  font-family: "Cormorant Garamond", serif;
`;

const Section = styled.section`
  padding: 24px 0 0;
`;

const SectionLabel = styled.p`
  font-size: 9px;
  letter-spacing: 0.15em;
  color: ${MUTED};
  margin: 0 0 10px;
  font-family: "Cormorant Garamond", serif;
`;

const Headline = styled.h2`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  color: ${MUTED};
  margin: 0 0 10px;
  em {
    font-style: italic;
    color: ${TERRA};
  }
`;

const Desc = styled.p`
  font-size: 12px;
  line-height: 1.8;
  color: ${MUTED};
  margin: 0 0 16px;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid ${BORDER};
  margin-bottom: 16px;
`;

const StatBox = styled.div`
  padding: 12px 16px;
  &:first-of-type { border-right: 1px solid ${BORDER}; }
`;

const StatNum = styled.div`
  font-size: 28px;
  font-weight: 300;
  color: ${TERRA};
  line-height: 1;
  font-family: "Cormorant Garamond", serif;
`;

const StatLabel = styled.div`
  font-size: 9px;
  letter-spacing: 0.15em;
  color: ${MUTED};
  margin-top: 2px;
  font-family: "Cormorant Garamond", serif;
`;

const MapWrapper = styled.div`
  border: 1px solid ${BORDER};
  border-radius: 2px;
  overflow: hidden;
  background: ${BEIGE};
  background-image:
    linear-gradient(${BORDER}55 1px, transparent 1px),
    linear-gradient(90deg, ${BORDER}55 1px, transparent 1px);
  background-size: 24px 24px;
  height: 220px;
`;

const MapInner = styled.div`
  padding: 0;
`;

const MapHeader = styled.div`
  text-align: center;
  font-size: 8px;
  letter-spacing: 0.2em;
  color: ${MUTED};
  padding: 8px 0 4px;
  font-family: "Cormorant Garamond", serif;
`;

const MapPlaceholder = styled.div`
  height: 220px;
`;

const Footer = styled.footer`
  margin-top: 40px;
  padding: 16px 20px;
  border-top: 1px solid ${BORDER};
  text-align: center;
`;

const FooterText = styled.p`
  font-size: 9px;
  letter-spacing: 0.15em;
  color: ${MUTED};
  margin: 3px 0;
  font-family: "Cormorant Garamond", serif;
`;
