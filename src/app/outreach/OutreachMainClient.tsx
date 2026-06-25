"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styled from "@emotion/styled";
import { Footprints, Sun, Snowflake } from "lucide-react";
import {
  OutreachPage as _OutreachPage,
  AppHeader,
  HeaderBtn,
  HeaderSpacer,
  LoadingPage,
  MUTED,
  SANS,
  SERIF,
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
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

// 같은 해에서는 여름 → 겨울 순. 내림차순 정렬 시 첫번째가 최신 시즌
function seasonRank(s: Season) {
  return s.year * 10 + (s.period === "winter" ? 1 : 0);
}

export default function OutreachMainClient() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

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
    setSelectedSeasonId(null);
    setSeasons([]);
    setSheetLoading(true);
    const res = await fetch(`/api/outreach/countries/${id}`);
    const data = await res.json();
    const list: Season[] = [...(data.seasons ?? [])].sort(
      (a, b) => seasonRank(b) - seasonRank(a)
    );
    setSeasons(list);
    setSelectedSeasonId(list.length ? list[0].id : null);
    setSheetLoading(false);
  };

  const selectedCountry = countries.find((c) => c.id === selectedId) ?? null;
  const countryCount = countries.length;
  const seasonCount = countries.reduce((sum, c) => sum + c.season_count, 0);
  const selectedSeason =
    seasons.find((s) => s.id === selectedSeasonId) ?? seasons[0] ?? null;

  if (loading) return <LoadingPage />;

  return (
    <MapPage>
      <MapHeader>
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
      </MapHeader>

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
              <StepCount>
                <Footprints size={15} strokeWidth={2} aria-hidden />
                {selectedCountry.season_count}번의 발걸음
              </StepCount>
            </SheetHeader>

            {seasons.length > 0 && (
              <SeasonTimeline>
                <TimelineScroll>
                <TimelineTrack>
                {seasons.map((s) => (
                  <TimelineItem
                    key={s.id}
                    data-active={selectedSeasonId === s.id ? "true" : "false"}
                    onClick={() => setSelectedSeasonId(s.id)}
                  >
                    <TimelineDotSlot>
                      <TimelineDot>
                        <Footprints size={15} strokeWidth={2} aria-hidden />
                      </TimelineDot>
                    </TimelineDotSlot>
                    <TimelineLabel>
                      {s.year % 100}' {s.period === "winter" ? "겨울" : "여름"}
                    </TimelineLabel>
                  </TimelineItem>
                ))}
                </TimelineTrack>
                </TimelineScroll>
              </SeasonTimeline>
            )}

            <SeasonList>
              {sheetLoading ? (
                <SheetLoadingText>불러오는 중...</SheetLoadingText>
              ) : selectedSeason ? (
                <SeasonCard onClick={() => router.push(`/outreach/${selectedCountry.id}/${selectedSeason.id}`)}>
                  <SeasonCardLeft>
                    <SeasonEmoji>
                      {selectedSeason.period === "winter" ? (
                        <Snowflake size={18} strokeWidth={2} color="#5B9BD5" aria-hidden />
                      ) : (
                        <Sun size={18} strokeWidth={2} color="#E8843E" aria-hidden />
                      )}
                    </SeasonEmoji>
                    <SeasonInfo>
                      <SeasonTitle>
                        {selectedSeason.year}년 {selectedSeason.period === "winter" ? "겨울" : "여름"}
                      </SeasonTitle>
                      {(selectedSeason.start_date || selectedSeason.end_date) && (
                        <SeasonDate>
                          {fmtDate(selectedSeason.start_date)} ~ {fmtDate(selectedSeason.end_date)}
                        </SeasonDate>
                      )}
                    </SeasonInfo>
                  </SeasonCardLeft>
                  <SeasonArrow>→</SeasonArrow>
                </SeasonCard>
              ) : null}
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
  color: #513400;
`;

const MapHeader = styled(AppHeader)`
  background: #FFFAF0;
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
  background: #FFFAF0;
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
  padding: 12px 24px;
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
  color: #513400;
  font-family: ${SANS};
  letter-spacing: -0.02em;
`;

const StepCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid rgba(160, 53, 24, 0.4);
  border-radius: 99px;
  background: rgba(160, 53, 24, 0.06);
  font-size: 13px;
  font-family: ${SANS};
  font-weight: 500;
  color: #a03518;
  letter-spacing: -0.26px;
  white-space: nowrap;

  & > svg {
    width: 14px;
    height: 14px;
  }
`;

// 같은 폭(56px) 안에서 천천히 차오르는 concave 램프 → 가장자리 아이템이 더 강하게 흐려짐
const TIMELINE_MASK = `linear-gradient(
  to right,
  transparent 0,
  rgba(0, 0, 0, 0.03) 14px,
  rgba(0, 0, 0, 0.18) 28px,
  rgba(0, 0, 0, 0.55) 42px,
  #000 56px,
  #000 calc(100% - 56px),
  rgba(0, 0, 0, 0.55) calc(100% - 42px),
  rgba(0, 0, 0, 0.18) calc(100% - 28px),
  rgba(0, 0, 0, 0.03) calc(100% - 14px),
  transparent 100%
)`;

const SeasonTimeline = styled.div`
  position: relative;
  padding: 16px 24px;
  -webkit-mask-image: ${TIMELINE_MASK};
  mask-image: ${TIMELINE_MASK};

  &::before {
    content: '';
    position: absolute;
    left: 24px;
    right: 24px;
    top: 30px;
    height: 1px;
    border-top: 1px dashed #a03518;
    opacity: 0.5;
    pointer-events: none;
  }
`;

const TimelineScroll = styled.div`
  display: flex;
  justify-content: safe center;
  overflow-x: auto;
  &::-webkit-scrollbar { display: none; }
`;

const TimelineTrack = styled.div`
  display: flex;
  gap: 24px;
  width: max-content;
  padding: 0 30px;
`;

const TimelineItem = styled.button`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  opacity: 0.8;
  transition: opacity 0.15s;

  &[data-active="true"] {
    opacity: 1;
  }

  &[data-active="true"] > div:first-child > div {
    width: 28px;
    height: 28px;
  }

  &[data-active="true"] > div:first-child > div > svg {
    opacity: 1;
  }

  &[data-active="true"] > span:last-child {
    font-weight: 500;
    color: #a9381a;
  }
`;

const TimelineDotSlot = styled.div`
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TimelineDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: #a03518;
  color: #fff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: width 0.15s, height 0.15s;

  & > svg {
    width: 15px;
    height: 15px;
    opacity: 0;
    transition: opacity 0.15s;
  }
`;

const TimelineLabel = styled.span`
  font-size: 14px;
  font-family: ${SANS};
  color: #513400;
  letter-spacing: -0.28px;
  white-space: nowrap;
  transition: font-weight 0.15s, color 0.15s;
`;

const SeasonList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 8px 24px max(16px, env(safe-area-inset-bottom));
  &::-webkit-scrollbar { display: none; }
`;

const SeasonCard = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(160, 112, 24, 0.2);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: ${SANS};
  box-shadow: 0px 10px 30px rgba(78, 89, 104, 0.05),
    0px 15px 80px rgba(78, 89, 104, 0.08);
`;

const SeasonCardLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
`;

const SeasonEmoji = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 0;
  flex-shrink: 0;
`;

const SeasonInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const SeasonTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #513400;
  letter-spacing: -0.28px;
`;

const SeasonDate = styled.span`
  font-size: 12px;
  color: #575757;
  opacity: 0.7;
  letter-spacing: -0.24px;
`;

const SeasonArrow = styled.span`
  font-size: 16px;
  color: #513400;
  flex-shrink: 0;
`;

const SheetLoadingText = styled.p`
  padding: 24px 0;
  text-align: center;
  color: ${MUTED};
  font-size: 14px;
  font-family: ${SANS};
`;
