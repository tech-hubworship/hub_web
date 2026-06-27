"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import {
  OutreachPage as Page,
  AppHeader,
  HeaderBtn,
  HeaderTitle,
  HeaderSpacer,
  LoadingPage,
  BG,
  TEXT,
  PRIMARY,
  BORDER,
  SUBTLE,
  SANS,
  SERIF,
} from "../_components/shared";

interface Season {
  id: number;
  year: number;
  period: "summer" | "winter";
  start_date: string | null;
  end_date: string | null;
  region_en: string | null;
  region_ko: string | null;
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

/** 폴라로이드 캡션: "Bangkok, Thailand, 2024" */
function captionText(country: Country, s: Season) {
  return [s.region_en, country.name_en, s.year].filter(Boolean).join(", ");
}

export default function CountryDetailClient({
  countryId,
  seasonId,
}: {
  countryId: string;
  seasonId?: string;
}) {
  const router = useRouter();

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
        // 경로의 시즌 id가 유효하면 사용, 없으면 최신 시즌 + 경로 정규화
        if (seasonId && list.some((s) => String(s.id) === seasonId)) {
          setSelectedId(Number(seasonId));
        } else if (list.length > 0) {
          setSelectedId(list[0].id);
          window.history.replaceState(null, "", `/outreach/${countryId}/${list[0].id}`);
        }
      })
      .finally(() => setLoading(false));
  }, [countryId]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectSeason(id: number) {
    setSelectedId(id);
    setSheetOpen(false);
    // 경로만 갱신 (리페치 없이 즉시 전환)
    window.history.replaceState(null, "", `/outreach/${countryId}/${id}`);
  }

  const selected = seasons.find((s) => s.id === selectedId) ?? null;

  if (loading) return <LoadingPage />;
  if (!country) return <LoadingPage>국가를 찾을 수 없습니다.</LoadingPage>;

  const albumUrls = selected?.gallery_urls ?? [];

  return (
    <PaperPage>
      {/* 고정 앱 헤더 (이 페이지에서만 불투명 — paper.png 상단 색상으로 채움) */}
      <PaperHeader>
        <HeaderBtn aria-label="뒤로가기" onClick={() => router.push("/outreach")}>
          <img src="/images/outreach/arrow_back.png" alt="" width={24} height={24} style={{ display: "block", objectFit: "contain" }} />
        </HeaderBtn>
        <HeaderTitle
          onClick={() => seasons.length > 1 && setSheetOpen(true)}
          role={seasons.length > 1 ? "button" : undefined}
        >
          {selected ? seasonLabel(selected) : country.name_ko}
          {seasons.length > 1 && <ChevronDown size={18} strokeWidth={2} aria-hidden />}
        </HeaderTitle>
        <HeaderSpacer />
      </PaperHeader>

      {selected && (
        <Content key={selected.id}>
          {/* 1) 폴라로이드 대표사진 */}
          <HeroWrap>
            <Polaroid>
              <PhotoWindow>
                {selected.hero_image_url ? (
                  <PhotoImg
                    src={selected.hero_image_url}
                    alt={`${country.name_ko} 대표사진`}
                    onClick={() => setLightboxUrl(selected.hero_image_url)}
                  />
                ) : (
                  <PhotoPlaceholder>사진 준비 중</PhotoPlaceholder>
                )}
              </PhotoWindow>
              <Caption>{captionText(country, selected)}</Caption>
              <Tape src="/images/outreach/tape.png" alt="" $pos="tl" />
              <Tape src="/images/outreach/tape.png" alt="" $pos="br" />
            </Polaroid>
          </HeroWrap>

          <Body>
            {/* 2) 팀 소개 카드 */}
            {(selected.key_phrase || selected.description) && (
              <IntroCard>
                {selected.key_phrase && <KeyPhrase>"{selected.key_phrase}"</KeyPhrase>}
                {selected.description && <IntroText>{selected.description}</IntroText>}
              </IntroCard>
            )}

            {/* 3) 상세 정보 */}
            <Fields>
              {selected.region_ko && (
                <Field>
                  <FieldLabel>방문 지역</FieldLabel>
                  <FieldValue>{selected.region_ko}</FieldValue>
                </Field>
              )}
              {selected.mission_field && (
                <Field>
                  <FieldLabel>선교지</FieldLabel>
                  <FieldValue>{selected.mission_field}</FieldValue>
                </Field>
              )}
              {selected.ministry_content && (
                <Field>
                  <FieldLabel>사역 내용</FieldLabel>
                  <FieldValue $multiline>{selected.ministry_content}</FieldValue>
                </Field>
              )}
              {selected.theme_verse && (
                <Field>
                  <FieldLabel>주제 말씀</FieldLabel>
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
                  <FieldValue>
                    {[selected.leader_pastor, ...selected.members].filter(Boolean).join(", ")}
                  </FieldValue>
                </Field>
              )}
            </Fields>

            {/* 4) 앨범 */}
            {albumUrls.length > 0 && (
              <AlbumSection>
                <AlbumHeader>
                  <AlbumTitle>앨범</AlbumTitle>
                  <AlbumMore aria-label="앨범 더보기" onClick={() => setLightboxUrl(albumUrls[0])}>
                    <ArrowRight size={20} strokeWidth={2} aria-hidden />
                  </AlbumMore>
                </AlbumHeader>
                <AlbumGrid>
                  {albumUrls.map((url, i) => (
                    <AlbumThumb
                      key={`${url}-${i}`}
                      src={url}
                      alt={`앨범 ${i + 1}`}
                      onClick={() => setLightboxUrl(url)}
                    />
                  ))}
                </AlbumGrid>
              </AlbumSection>
            )}
          </Body>
        </Content>
      )}

      {/* 시즌 선택 바텀시트 */}
      {sheetOpen && (
        <SheetOverlay onClick={() => setSheetOpen(false)}>
          <Sheet onClick={(e) => e.stopPropagation()}>
            <HandleBar>
              <DragHandle />
            </HandleBar>
            <SheetList>
              {seasons.map((s) => {
                const active = s.id === selectedId;
                return (
                  <SheetItem key={s.id} $active={active} onClick={() => selectSeason(s.id)}>
                    <Check size={20} strokeWidth={2.5} aria-hidden />
                    {seasonLabel(s)}
                  </SheetItem>
                );
              })}
            </SheetList>
            <SheetFade />
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
    </PaperPage>
  );
}

/** 줄바꿈(\n) 기준으로 분리해 글머리기호 + 행잉 인덴트로 렌더 */
function BulletText({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <BulletList>
      {lines.map((line, i) => (
        <BulletItem key={i}>
          <Bullet aria-hidden>•</Bullet>
          <span>{line}</span>
        </BulletItem>
      ))}
    </BulletList>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// 상세 페이지 배경: 종이 질감 이미지 (BG 색상 폴백). cover로 빈틈 없이 채움.
const PaperPage = styled(Page)`
  background: ${BG} url("/images/outreach/paper.png") top center / cover no-repeat;
`;

// 이 페이지 헤더만 불투명. paper.png 상단부가 균일 크림색이라 동일 색(#FBF4E6)으로 채움.
// (모바일/iOS에서 background-attachment:fixed 미지원 이슈를 피하면서 시각적으로 동일)
const PaperHeader = styled(AppHeader)`
  background: #fbf4e6;
`;

const Content = styled.div``;

const BulletList = styled.ul`
  margin: 0;
  padding: 0 0 0 2px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BulletItem = styled.li`
  display: flex;
  gap: 6px;
  font-family: ${SANS};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.28px;
  color: ${TEXT};
  word-break: keep-all;
`;

const Bullet = styled.span`
  flex-shrink: 0;
  color: ${PRIMARY};
`;

// ── 폴라로이드 ──
// frame.png = 외곽 골드 보더 + 사진영역(상단 77.3%) + 크림 캡션밴드(하단). 비율 654:572.
const HeroWrap = styled.div`
  padding: 16px 16px 22px;
  overflow: visible;
`;

const Polaroid = styled.div`
  position: relative;
  width: 88%;
  margin: 0 auto;
  aspect-ratio: 654 / 572;
  background: url("/images/outreach/frame.png") center / 100% 100% no-repeat;
  transform: rotate(-4.5deg);
`;

const PhotoWindow = styled.div`
  position: absolute;
  top: 0.4%;
  left: 0.35%;
  right: 0.35%;
  bottom: 23%;
  overflow: hidden;
  border-radius: 3px 3px 0 0;
  background: ${BG};
`;

const PhotoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
`;

const PhotoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${SUBTLE};
  font-size: 14px;
  font-family: ${SANS};
`;

const Caption = styled.p`
  position: absolute;
  left: 8%;
  right: 8%;
  top: 77%;
  bottom: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${SERIF};
  font-style: italic;
  font-size: 18px;
  line-height: 1.5;
  letter-spacing: -0.6px;
  text-align: center;
  color: ${PRIMARY};
`;

const Tape = styled.img<{ $pos: "tl" | "br" }>`
  position: absolute;
  width: 68px;
  height: auto;
  pointer-events: none;
  opacity: 0.92;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.12));
  ${({ $pos }) =>
    $pos === "tl"
      ? `top: -14px; left: -16px; transform: rotate(4.5deg);`
      : `bottom: -12px; right: -16px; transform: rotate(4.5deg);`}
`;

// ── 본문 ──
const Body = styled.div`
  padding: 16px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const IntroCard = styled.div`
  width: 100%;
  background: ${BORDER}0D;
  border: 1px solid ${BORDER}80;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const KeyPhrase = styled.p`
  margin: 0;
  font-family: ${SERIF};
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.28px;
  color: ${TEXT};
`;

const IntroText = styled.p`
  margin: 0;
  font-family: ${SANS};
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.28px;
  word-break: keep-all;
  color: ${TEXT};
  opacity: 0.7;
  white-space: pre-wrap;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.p`
  margin: 0;
  font-family: ${SANS};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.28px;
  color: ${PRIMARY};
`;

const FieldValue = styled.p<{ $multiline?: boolean }>`
  margin: 0;
  font-family: ${SANS};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.28px;
  color: ${TEXT};
  word-break: keep-all;
  white-space: ${({ $multiline }) => ($multiline ? "pre-wrap" : "normal")};
`;

// ── 앨범 ──
const AlbumSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AlbumHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AlbumTitle = styled.h2`
  margin: 0;
  font-family: ${SANS};
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.32px;
  color: ${TEXT};
`;

const AlbumMore = styled.button`
  border: none;
  background: none;
  color: ${TEXT};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
`;

const AlbumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

const AlbumThumb = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  background: #d3d3d3;
  cursor: pointer;
`;

// ── 시즌 선택 바텀시트 ──
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
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 60dvh;
  background: ${BG};
  border: 1px solid ${BORDER}33;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

const HandleBar = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px;
  flex-shrink: 0;
`;

const DragHandle = styled.div`
  width: 32px;
  height: 4px;
  border-radius: 100px;
  background: ${BORDER}66;
`;

const SheetList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SheetItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0 8px 0 16px;
  font-family: ${SANS};
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.32px;
  text-align: left;
  cursor: pointer;
  color: ${({ $active }) => ($active ? BORDER : SUBTLE)};

  & > svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    opacity: ${({ $active }) => ($active ? 1 : 0.45)};
  }
`;

const SheetFade = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  pointer-events: none;
  background: linear-gradient(to top, ${BG}, ${BG}00);
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
  color: ${BG};
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
`;
