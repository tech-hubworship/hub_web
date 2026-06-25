"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "@emotion/styled";

interface Season {
  id: number;
  year: number;
  period: "summer" | "winter";
  start_date: string | null;
  end_date: string | null;
  region: string | null;
  key_phrase: string | null;
  mission_field: string | null;
  theme_verse: string | null;
  ministry_content: string | null;
  leader_pastor: string | null;
  members: string[] | null;
  prayer_topics: string | null;
  team_prayer_topics: string | null;
  hero_image_url: string | null;
  gallery_urls: string[] | null;
  prayer_card_urls: string[] | null;
  description: string | null;
}

interface Country {
  id: number;
  name_ko: string;
  name_en: string;
  iso_code: string;
}

const PERIOD_KO = { summer: "여름", winter: "겨울" } as const;

/** 시즌 라벨: "2024년 겨울" */
function seasonLabel(s: Season) {
  return `${s.year}년 ${PERIOD_KO[s.period]}`;
}

/** YYYY-MM-DD → YYYY.MM.DD */
function fmtDate(d: string | null) {
  if (!d) return "";
  return d.slice(0, 10).replace(/-/g, ".");
}

// ISO 3166-1 alpha-3 → alpha-2 (국기 이모지용, 자주 가는 선교지 위주 + 확장 가능)
const ISO3_TO_2: Record<string, string> = {
  JPN: "JP", THA: "TH", KHM: "KH", VNM: "VN", LAO: "LA", MMR: "MM",
  PHL: "PH", IDN: "ID", MYS: "MY", IND: "IN", NPL: "NP", LKA: "LK",
  CHN: "CN", MNG: "MN", TWN: "TW", BGD: "BD", PAK: "PK", KAZ: "KZ",
  UZB: "UZ", KGZ: "KG", USA: "US", MEX: "MX", BRA: "BR", PER: "PE",
  KEN: "KE", ETH: "ET", TZA: "TZ", UGA: "UG", ZAF: "ZA", NGA: "NG",
  GHA: "GH", EGY: "EG", TUR: "TR", DEU: "DE", FRA: "FR", GBR: "GB",
  ITA: "IT", ESP: "ES", RUS: "RU", AUS: "AU", NZL: "NZ", KOR: "KR",
};

/** alpha-2 → 국기 이모지 (regional indicator) */
function flagEmoji(iso3: string | null | undefined) {
  if (!iso3) return "🌍";
  const a2 = ISO3_TO_2[iso3.toUpperCase()];
  if (!a2) return "🌍";
  return a2
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function CountryDetailClient({ countryId }: { countryId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [country, setCountry] = useState<Country | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/outreach/countries/${countryId}`)
      .then((r) => r.json())
      .then((d) => {
        setCountry(d.country ?? null);
        const list: Season[] = d.seasons ?? [];
        setSeasons(list);
        const qSeason = searchParams?.get("season");
        if (qSeason && list.some((s) => String(s.id) === qSeason)) {
          setSelectedId(Number(qSeason));
        } else if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [countryId]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectSeason(id: number) {
    setSelectedId(id);
    setSheetOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("season", String(id));
    window.history.replaceState(null, "", url.toString());
  }

  const selected = seasons.find((s) => s.id === selectedId) ?? null;

  if (loading) return <LoadingPage />;
  if (!country) return <LoadingPage>국가를 찾을 수 없습니다.</LoadingPage>;

  const countryLine = selected?.region
    ? `${country.name_ko} (${selected.region})`
    : country.name_ko;

  const dateRange =
    selected?.start_date || selected?.end_date
      ? `${fmtDate(selected.start_date)} ~ ${fmtDate(selected.end_date)}`
      : "";

  const albumUrls = selected?.gallery_urls ?? [];

  return (
    <Page>
      {/* 고정 앱 헤더 */}
      <AppHeader>
        <HeaderBtn aria-label="뒤로가기" onClick={() => router.push("/outreach")}>
          ←
        </HeaderBtn>
        <HeaderTitle
          onClick={() => seasons.length > 1 && setSheetOpen(true)}
          role={seasons.length > 1 ? "button" : undefined}
        >
          {selected ? seasonLabel(selected) : country.name_ko}
          {seasons.length > 1 && <Caret>⌄</Caret>}
        </HeaderTitle>
        <HeaderSpacer />
      </AppHeader>

      {selected && (
        <Content key={selected.id}>
          {/* 1) 대표사진 */}
          <Hero>
            {selected.hero_image_url ? (
              <HeroImg
                src={selected.hero_image_url}
                alt={`${countryLine} 대표사진`}
                onClick={() => setLightboxUrl(selected.hero_image_url)}
              />
            ) : (
              <HeroPlaceholder>대표 사진</HeroPlaceholder>
            )}
          </Hero>

          <Body>
            {/* 2) 국가 + 방문일자 */}
            <CountryRow>
              <Flag>{flagEmoji(country.iso_code)}</Flag>
              <div>
                <CountryName>{countryLine}</CountryName>
                {dateRange && <DateRange>{dateRange}</DateRange>}
              </div>
            </CountryRow>

            {/* 3) 팀 소개 섹션 (선택) */}
            {(selected.key_phrase || selected.description) && (
              <IntroCard>
                {selected.key_phrase && <KeyPhrase>"{selected.key_phrase}"</KeyPhrase>}
                {selected.description && <IntroText>{selected.description}</IntroText>}
              </IntroCard>
            )}

            {/* 4) 상세정보 섹션 */}
            <Fields>
              {selected.mission_field && (
                <Field>
                  <FieldLabel>선교지</FieldLabel>
                  <FieldValue>{selected.mission_field}</FieldValue>
                </Field>
              )}

              {selected.ministry_content && (
                <Field>
                  <FieldLabel>사역내용</FieldLabel>
                  <FieldValue $multiline>{selected.ministry_content}</FieldValue>
                </Field>
              )}

              {selected.theme_verse && (
                <Field>
                  <FieldLabel>주제말씀</FieldLabel>
                  <FieldValue $multiline>{selected.theme_verse}</FieldValue>
                </Field>
              )}

              {selected.prayer_topics && (
                <Field>
                  <FieldLabel>선교사 기도 제목</FieldLabel>
                  <BulletText text={selected.prayer_topics} />
                </Field>
              )}

              {selected.team_prayer_topics && (
                <Field>
                  <FieldLabel>팀 기도 제목</FieldLabel>
                  <BulletText text={selected.team_prayer_topics} />
                </Field>
              )}

              {selected.members && selected.members.length > 0 && (
                <Field>
                  <FieldLabel>참여 인원</FieldLabel>
                  <FieldValue>{selected.leader_pastor}, {selected.members.join(", ")}</FieldValue>
                </Field>
              )}
            </Fields>
          </Body>

          {/* 5) 앨범 */}
          {albumUrls.length > 0 && (
            <AlbumSection>
              <AlbumHeader>
                <AlbumTitle>앨범</AlbumTitle>
                <AlbumMore
                  aria-label="앨범 더보기"
                  onClick={() => setLightboxUrl(albumUrls[0])}
                >
                  →
                </AlbumMore>
              </AlbumHeader>
              <AlbumScroll>
                {albumUrls.map((url, i) => (
                  <AlbumThumb
                    key={`${url}-${i}`}
                    src={url}
                    alt={`앨범 ${i + 1}`}
                    onClick={() => setLightboxUrl(url)}
                  />
                ))}
              </AlbumScroll>
            </AlbumSection>
          )}
        </Content>
      )}

      {/* 시즌 선택 바텀시트 */}
      {sheetOpen && (
        <SheetOverlay onClick={() => setSheetOpen(false)}>
          <Sheet onClick={(e) => e.stopPropagation()}>
            <SheetHandle />
            <SheetList>
              {seasons.map((s) => {
                const active = s.id === selectedId;
                return (
                  <SheetItem key={s.id} $active={active} onClick={() => selectSeason(s.id)}>
                    <Check $active={active}>✓</Check>
                    {seasonLabel(s)}
                  </SheetItem>
                );
              })}
            </SheetList>
          </Sheet>
        </SheetOverlay>
      )}

      {/* 라이트박스 */}
      {lightboxUrl && (
        <Lightbox onClick={() => setLightboxUrl(null)}>
          <LightboxImg src={lightboxUrl} alt="확대 이미지" onClick={(e) => e.stopPropagation()} />
          <LightboxClose onClick={() => setLightboxUrl(null)}>✕</LightboxClose>
        </Lightbox>
      )}
    </Page>
  );
}

function BulletText({ text }: { text: string }) {
  return (
    <BulletList>
      {text.split("\n").filter((l) => l.trim()).map((line, i) => (
        <BulletLine key={i}>
          <BulletDot>•</BulletDot>
          <span>{line.trim()}</span>
        </BulletLine>
      ))}
    </BulletList>
  );
}

function LoadingPage({ children }: { children?: React.ReactNode }) {
  return (
    <Page>
      <AppHeader>
        <HeaderSpacer />
        <HeaderTitle as="span">아웃리치</HeaderTitle>
        <HeaderSpacer />
      </AppHeader>
      <LoadingText>{children ?? "불러오는 중..."}</LoadingText>
    </Page>
  );
}

// ─── Theme ──────────────────────────────────────────────────────────────────
const BG = "#FFFFFF";
const TEXT = "#1A1A1A";
const MUTED = "#9A9A9A";
const SUBTLE = "#B5B5B5";
const CARD = "#F7F7F7";
const PH = "#D9D9D9";
const ACCENT = "#B08433"; // 선택 시즌 강조 (gold/ochre)
const SANS = `-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${BG};
  color: ${TEXT};
  font-family: ${SANS};
  line-height: 1.5;
  letter-spacing: -0.02em;
  max-width: 480px;
  margin: 0 auto;
  :where(h1, h2, h3, h4, h5, h6, p) { color: inherit; }
`;

const AppHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: ${BG};
`;

const HeaderBtn = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 22px;
  color: ${TEXT};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderSpacer = styled.div`
  width: 40px;
  height: 40px;
`;

const HeaderTitle = styled.div`
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: ${TEXT};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: ${({ role }) => (role === "button" ? "pointer" : "default")};
`;

const Caret = styled.span`
  font-size: 13px;
  color: ${MUTED};
`;

const Content = styled.div``;

const Hero = styled.div`
  width: 100%;
  height: 200px;
  background: ${PH};
  overflow: hidden;
`;

const HeroImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
`;

const HeroPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${MUTED};
  font-size: 15px;
`;

const Body = styled.div`
  padding: 24px;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const CountryRow = styled.div`
  display: flex;
  align-items: top;
  gap: 12px;
  margin-bottom: 16px;
`;

const Flag = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  overflow: hidden;
  flex-shrink: 0;
`;

const CountryName = styled.div`
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 2px;
`;

const DateRange = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
  color: ${SUBTLE};
`;

const IntroCard = styled.div`
  background: ${CARD};
  border-radius: 12px;
  padding: 18px 20px;
  text-align: center;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const KeyPhrase = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: ${TEXT};
`;

const IntroText = styled.p`
  font-size: 14px;
  color: #6e6e6e;
  margin: 0;
  white-space: pre-wrap;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FieldLabel = styled.div`
  font-size: 14px;
  color: ${MUTED};
`;

const FieldValue = styled.p<{ $multiline?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${TEXT};
  margin: 0;
  word-break: keep-all;
  white-space: ${({ $multiline }) => ($multiline ? "pre-wrap" : "normal")};
`;

const BulletList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 4px;
`;

const BulletLine = styled.div`
  display: flex;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${TEXT};
  word-break: keep-all;
`;

const BulletDot = styled.span`
  flex-shrink: 0;
  color: ${MUTED};
`;

const AlbumSection = styled.div`
  padding: 16px 0 60px;
`;

const AlbumHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 14px;
`;

const AlbumTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  margin: 0;
`;

const AlbumMore = styled.button`
  border: none;
  background: none;
  font-size: 20px;
  color: ${TEXT};
  cursor: pointer;
  padding: 4px;
`;

const AlbumScroll = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 20px;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const AlbumThumb = styled.img`
  width: 30%;
  flex: 0 0 auto;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  background: ${PH};
  cursor: pointer;
`;

// ── 바텀시트 ──
const SheetOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const Sheet = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${BG};
  border-radius: 20px 20px 0 0;
  padding: 12px 0 max(24px, env(safe-area-inset-bottom));
  animation: slideUp 0.22s ease;
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const SheetHandle = styled.div`
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #d0d0d0;
  margin: 0 auto 12px;
`;

const SheetList = styled.div`
  display: flex;
  flex-direction: column;
`;

const SheetItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: none;
  background: none;
  padding: 16px 24px;
  font-size: 17px;
  font-family: ${SANS};
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active }) => ($active ? ACCENT : "#555")};
  cursor: pointer;
  text-align: left;
`;

const Check = styled.span<{ $active: boolean }>`
  font-size: 16px;
  color: ${({ $active }) => ($active ? ACCENT : SUBTLE)};
  width: 18px;
`;

// ── 라이트박스 ──
const Lightbox = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LightboxImg = styled.img`
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
`;

const LightboxClose = styled.button`
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
`;

const LoadingText = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: ${MUTED};
  font-size: 14px;
`;
