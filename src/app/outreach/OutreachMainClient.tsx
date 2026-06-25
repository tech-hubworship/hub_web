"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styled from "@emotion/styled";
import {
  OutreachPage as _OutreachPage,
  AppHeader,
  HeaderBtn,
  HeaderSpacer,
  LoadingPage,
  TEXT,
  MUTED,
  SANS,
  SERIF,
  BG,
} from "./_components/shared";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

interface Country {
  id: number;
  name_ko: string;
  iso_code: string;
  lat: number;
  lng: number;
  season_count: number;
}

interface Season {
  id: number;
  year: number;
  period: "summer" | "winter";
  start_date: string | null;
  end_date: string | null;
  region: string | null;
}

// alpha-3 코드 중 앞 2글자 ≠ alpha-2인 경우만 명시
const ISO3_FIX: Record<string, string> = {
  TUR: "TR", POL: "PL", DEU: "DE", CHE: "CH", NLD: "NL", AUT: "AT",
  BEL: "BE", SWE: "SE", NOR: "NO", DNK: "DK", FIN: "FI", PRT: "PT",
  GBR: "GB", IRL: "IE", CZE: "CZ", HUN: "HU", BGR: "BG", HRV: "HR",
  UKR: "UA", KAZ: "KZ", UZB: "UZ", TJK: "TJ", TKM: "TM", KGZ: "KG",
  AZE: "AZ", ARM: "AM", GEO: "GE", MYS: "MY", KOR: "KR", KWT: "KW",
  QAT: "QA", BHR: "BH", OMN: "OM", YEM: "YE", AFG: "AF", SEN: "SN",
  NGA: "NG", ETH: "ET", KEN: "KE", TZA: "TZ", UGA: "UG", MOZ: "MZ",
  ZMB: "ZM", ZWE: "ZW", ZAF: "ZA", NAM: "NA", MDG: "MG", MWI: "MW",
  RWA: "RW", BEN: "BJ", TCD: "TD", CAF: "CF", COD: "CD", COG: "CG",
  NZL: "NZ", PRY: "PY", CHL: "CL", URY: "UY", GUY: "GY", SUR: "SR",
  SSD: "SS", CRI: "CR", DOM: "DO", JAM: "JM", ECU: "EC",
};

function toAlpha2(iso: string): string {
  const u = iso.toUpperCase();
  if (u.length === 2) return u;
  return ISO3_FIX[u] ?? u.substring(0, 2);
}

function flagUrl(iso: string) {
  return `/images/outreach/flags/${toAlpha2(iso).toLowerCase()}.png`;
}

function fmtDate(d: string | null) {
  if (!d) return "";
  const parts = d.split("-");
  return `${parts[1]}.${parts[2]}`;
}

export default function OutreachMainClient() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/outreach/countries")
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []))
      .finally(() => setLoading(false));
  }, []);

  const selectCountry = async (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    setActiveYear(null);
    setSeasons([]);
    setSheetLoading(true);
    const res = await fetch(`/api/outreach/countries/${id}`);
    const data = await res.json();
    setSeasons(data.seasons ?? []);
    setSheetLoading(false);
  };

  const selectedCountry = countries.find((c) => c.id === selectedId) ?? null;
  const countryCount = countries.length;
  const seasonCount = countries.reduce((sum, c) => sum + c.season_count, 0);
  const uniqueYears = [...new Set(seasons.map((s) => s.year))].sort((a, b) => b - a);
  const uniqueRegions = [
    ...new Set(seasons.map((s) => s.region).filter(Boolean)),
  ] as string[];
  const filteredSeasons =
    activeYear !== null ? seasons.filter((s) => s.year === activeYear) : seasons;

  if (loading) return <LoadingPage />;

  return (
    <MapPage>
      <AppHeader>
        <HeaderBtn aria-label="뒤로가기" onClick={() => router.back()}>←</HeaderBtn>
        {countryCount > 0 ? (
          <HeaderStats>
            <Stat>
              <StatNum>{countryCount}</StatNum>
              <StatLabel>개국</StatLabel>
            </Stat>
            <Stat>
              <StatNum>{seasonCount}</StatNum>
              <StatLabel>시즌</StatLabel>
            </Stat>
          </HeaderStats>
        ) : (
          <HeaderSpacer />
        )}
      </AppHeader>

      <MapArea onClick={() => selectedId !== null && setSelectedId(null)}>
        <WorldMap
          countries={countries}
          selectedId={selectedId}
          onCountryClick={selectCountry}
        />
        <ChipArea>
          <ChipRow>
            {countries.map((c) => (
              <Chip
                key={c.id}
                data-active={selectedId === c.id ? "true" : "false"}
                onClick={() => selectCountry(c.id)}
              >
                <ChipFlag src={flagUrl(c.iso_code)} alt="" />
                {c.name_ko}
              </Chip>
            ))}
          </ChipRow>
        </ChipArea>
      </MapArea>

      <Sheet data-open={selectedId !== null ? "true" : "false"} onClick={(e) => e.stopPropagation()}>
        <DragHandle />
        {selectedCountry && (
          <>
            <SheetHeader>
              <SheetLeft>
                <CountryFlag src={flagUrl(selectedCountry.iso_code)} alt="" />
                <CountryName>{selectedCountry.name_ko}</CountryName>
              </SheetLeft>
              {uniqueRegions.length > 0 && (
                <RegionRow>
                  {uniqueRegions.map((r) => (
                    <RegionTag key={r}>{r}</RegionTag>
                  ))}
                </RegionRow>
              )}
            </SheetHeader>

            <YearRow>
              <YearTab
                data-active={activeYear === null ? "true" : "false"}
                onClick={() => setActiveYear(null)}
              >
                전체
              </YearTab>
              {uniqueYears.map((y) => (
                <YearTab
                  key={y}
                  data-active={activeYear === y ? "true" : "false"}
                  onClick={() => setActiveYear(y)}
                >
                  {y}
                </YearTab>
              ))}
            </YearRow>

            <SeasonList>
              {sheetLoading ? (
                <SheetLoadingText>불러오는 중...</SheetLoadingText>
              ) : (
                filteredSeasons.map((s) => (
                  <SeasonCard
                    key={s.id}
                    onClick={() => router.push(`/outreach/${selectedCountry.id}`)}
                  >
                    <SeasonEmoji>
                      {s.period === "winter" ? "❄️" : "☀️"}
                    </SeasonEmoji>
                    <SeasonInfo>
                      <SeasonTitle>
                        {s.year}년 {s.period === "winter" ? "겨울" : "여름"}
                      </SeasonTitle>
                      {(s.start_date || s.end_date) && (
                        <SeasonDate>
                          {fmtDate(s.start_date)}~{fmtDate(s.end_date)}
                        </SeasonDate>
                      )}
                    </SeasonInfo>
                    <SeasonArrow>→</SeasonArrow>
                  </SeasonCard>
                ))
              )}
            </SeasonList>
          </>
        )}
      </Sheet>
    </MapPage>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
`;

const Stat = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
`;

const StatNum = styled.span`
  font-family: ${SERIF};
  font-weight: 700;
  font-size: 20px;
  line-height: 1.5;
  color: #A03518;
  letter-spacing: -0.02em;
`;

const StatLabel = styled.span`
  font-family: ${SANS};
  font-size: 12px;
  color: #513400;
  opacity: 0.7;
  padding: 3px 0;
  letter-spacing: -0.02em;
`;

const ChipArea = styled.div`
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  z-index: 1100;
  overflow-x: auto;
  padding: 0 16px;
  &::-webkit-scrollbar { display: none; }
`;

const ChipRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
  width: max-content;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: #FFFCF5;
  font-size: 14px;
  font-family: ${SANS};
  color: #513400;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: -0.28px;
  box-shadow: 0px 4px 8px rgba(78, 89, 104, 0.05),
    0px 15px 40px rgba(78, 89, 104, 0.2);
  transition: background 0.15s, border-color 0.15s;

  &[data-active="true"] {
    background: #FFF7F5;
    border-color: #A03518;
    color: #A03518;
    font-weight: 500;
  }
`;

const ChipFlag = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 99px;
  border: 0.5px solid #E6E6E6;
  object-fit: cover;
  flex-shrink: 0;
`;

const MapPage = styled(_OutreachPage)`
  height: 100dvh;
  overflow: hidden;
`;

const MapArea = styled.div`
  flex: 1;
  position: relative;
  background: #EDE8DE;
  min-height: 200px;
`;


const Sheet = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  background: ${BG};
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 1200;
  max-height: 60dvh;
  display: flex;
  flex-direction: column;

  &[data-open="true"] {
    transform: translateY(0);
  }
`;

const DragHandle = styled.div`
  width: 36px;
  height: 4px;
  background: #E0D9CF;
  border-radius: 2px;
  margin: 12px auto 16px;
  flex-shrink: 0;
`;

const SheetHeader = styled.div`
  padding: 0 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 8px;
`;

const SheetLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const CountryFlag = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 99px;
  border: 0.5px solid #E6E6E6;
  object-fit: cover;
  flex-shrink: 0;
`;

const CountryName = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: ${TEXT};
  font-family: ${SANS};
  letter-spacing: -0.02em;
`;

const RegionRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 0;
`;

const RegionTag = styled.span`
  padding: 4px 10px;
  border: 1px solid #DDD6C8;
  border-radius: 12px;
  font-size: 12px;
  color: #6B5E4E;
  font-family: ${SANS};
  background: #F8F5F0;
  white-space: nowrap;
  letter-spacing: -0.02em;
`;

const YearRow = styled.div`
  display: flex;
  padding: 0 12px 8px;
  overflow-x: auto;
  flex-shrink: 0;
  &::-webkit-scrollbar { display: none; }
`;

const YearTab = styled.button`
  padding: 6px 10px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  font-size: 14px;
  font-family: ${SANS};
  color: ${MUTED};
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: -0.02em;
  transition: color 0.15s, border-color 0.15s;

  &[data-active="true"] {
    color: #A07018;
    border-bottom-color: #A07018;
    font-weight: 600;
  }
`;

const SeasonList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 0 20px max(16px, env(safe-area-inset-bottom));
  &::-webkit-scrollbar { display: none; }
`;

const SeasonCard = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border: none;
  background: none;
  border-bottom: 1px solid #F0EAE0;
  cursor: pointer;
  text-align: left;
  font-family: ${SANS};

  &:last-of-type {
    border-bottom: none;
  }
`;

const SeasonEmoji = styled.span`
  font-size: 22px;
  flex-shrink: 0;
`;

const SeasonInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SeasonTitle = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${TEXT};
  letter-spacing: -0.02em;
`;

const SeasonDate = styled.span`
  font-size: 12px;
  color: ${MUTED};
`;

const SeasonArrow = styled.span`
  font-size: 16px;
  color: ${MUTED};
  flex-shrink: 0;
`;

const SheetLoadingText = styled.p`
  padding: 24px 0;
  text-align: center;
  color: ${MUTED};
  font-size: 14px;
  font-family: ${SANS};
`;
