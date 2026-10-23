"use client";

import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import {
  SONG_MOODS,
  SONGS,
  SONG_THEMES,
  SongMood,
  songYoutubeUrl,
} from "../data";
import { C, Section, Wrap, SectionHead, Kicker, H2, Small } from "../styles";

// 무드 탭 (플레이리스트 전환)
const Moods = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 14px 0 20px;

  button {
    border: 1px solid ${C.line};
    background: #fff;
    border-radius: 99px;
    padding: 9px 14px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    transition:
      background 0.15s,
      color 0.15s,
      border-color 0.15s;

    &.active {
      background: ${C.green};
      color: #fff;
      border-color: ${C.green};
      font-weight: 700;
    }
  }
`;

const Player = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

// --- Now Playing 카드 ---
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const NowPlaying = styled.div<{ gradient: string }>`
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  padding: 30px;
  color: #fff;
  background: ${(p) => p.gradient};
  display: flex;
  flex-direction: column;
  min-height: 420px;
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.45);

  @media (max-width: 768px) {
    padding: 22px 18px;
    min-height: unset;
    border-radius: 20px;
  }
`;

const NPLabel = styled.div`
  font-size: 11px;
  letter-spacing: 0.18em;
  font-weight: 800;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Disc = styled.div<{ playing: boolean }>`
  width: clamp(130px, 34vw, 180px);
  height: clamp(130px, 34vw, 180px);
  margin: 26px auto 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: clamp(42px, 10vw, 58px);
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 18%, transparent 19%),
    repeating-radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.12) 0 2px,
      rgba(0, 0, 0, 0.12) 2px 7px
    ),
    rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.25);
  animation: ${spin} 14s linear infinite;
  animation-play-state: ${(p) => (p.playing ? "running" : "paused")};

  @media (max-width: 768px) {
    width: clamp(110px, 40vw, 150px);
    height: clamp(110px, 40vw, 150px);
    margin: 18px auto 16px;
  }
`;

// 유튜브 임베드 영역
const EmbedWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 10px auto 18px;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const TrackTitle = styled.div`
  text-align: center;

  strong {
    display: block;
    font-size: clamp(20px, 3vw, 26px);
    letter-spacing: -0.03em;
    line-height: 1.3;
  }
  span {
    display: block;
    margin-top: 6px;
    font-size: 14px;
    opacity: 0.85;
  }
`;

const Counter = styled.div`
  text-align: center;
  font-size: 12px;
  opacity: 0.75;
  margin-top: 10px;
`;

const Controls = styled.div`
  margin-top: auto;
  padding-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const CtrlButton = styled.button`
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  border-radius: 50%;
  transition:
    transform 0.12s,
    background 0.15s;
  width: 48px;
  height: 48px;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;

  &:hover {
    transform: scale(1.06);
  }
  &:active {
    transform: scale(0.96);
  }
`;

// 재생(primary) 버튼
const PlayButton = styled.button<{ accent: string }>`
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  border-radius: 50%;
  transition:
    transform 0.12s,
    background 0.15s;
  width: 64px;
  height: 64px;
  font-size: 22px;
  background: ${(p) => p.accent};
  color: #1d2b25;

  &:hover {
    transform: scale(1.06);
  }
  &:active {
    transform: scale(0.96);
  }
`;

const ListenLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 18px auto 0;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1d2b25;
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;

  &:hover {
    background: #fff;
  }
`;

// --- 큐(플레이리스트) ---
const Queue = styled.div`
  border: 1px solid ${C.line};
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const QueueHead = styled.div`
  padding: 16px 18px;
  border-bottom: 1px solid ${C.line};
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: ${C.green2};
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-weight: 500;
    color: ${C.muted};
    letter-spacing: 0;
  }
`;

const QueueList = styled.div`
  overflow-y: auto;
  max-height: 520px;

  @media (max-width: 768px) {
    max-height: 340px;
    -webkit-overflow-scrolling: touch;
  }
`;

const QueueItem = styled.button<{ active: boolean; accent: string }>`
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border: none;
  border-left: 3px solid
    ${(p) => (p.active ? C.green : "transparent")};
  background: ${(p) => (p.active ? "#f3f7f2" : "#fff")};
  font: inherit;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: #f6f8f5;
  }

  @media (max-width: 768px) {
    padding: 14px 16px;
  }

  .idx {
    width: 22px;
    flex: 0 0 22px;
    text-align: center;
    font-size: 12px;
    color: ${C.muted};
  }
  .bars {
    width: 22px;
    flex: 0 0 22px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    height: 16px;
  }
  .meta {
    min-width: 0;
    flex: 1;
  }
  strong {
    display: block;
    font-size: 14px;
    letter-spacing: -0.01em;
    color: ${C.ink};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .artist {
    font-size: 12px;
    color: ${C.muted};
  }
`;

const eq = keyframes`
  0%,100% { height: 4px; }
  50% { height: 15px; }
`;

const Bar = styled.span<{ delay: number }>`
  width: 3px;
  background: ${C.green};
  border-radius: 2px;
  animation: ${eq} 0.9s ease-in-out infinite;
  animation-delay: ${(p) => p.delay}s;
`;

// --- 플레이어 아이콘 (깔끔한 인라인 SVG) ---
const IconPrev = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 5a1 1 0 0 1 2 0v5.2l9.4-5.6A1 1 0 0 1 19 5.4v13.2a1 1 0 0 1-1.6.8L8 13.8V19a1 1 0 0 1-2 0V5Z" />
  </svg>
);
const IconNext = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18 5a1 1 0 0 0-2 0v5.2L6.6 4.6A1 1 0 0 0 5 5.4v13.2a1 1 0 0 0 1.6.8L16 13.8V19a1 1 0 0 0 2 0V5Z" />
  </svg>
);
const IconPlay = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
  </svg>
);
const IconPause = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export default function Songs() {
  const [mood, setMood] = useState<SongMood>("comfort");
  const [index, setIndex] = useState(0);
  // 사용자가 ▶를 눌러 "재생"을 시작했는지 (브라우저 자동재생 정책상 클릭 후에만 소리 재생)
  const [playing, setPlaying] = useState(false);

  const list = SONGS[mood];
  const theme = SONG_THEMES[mood];
  const current = list[index];
  const canEmbed = Boolean(current.youtubeID);

  // 무드 바뀌면 큐 처음부터 + 재생 중지
  const prevMood = useRef(mood);
  useEffect(() => {
    if (prevMood.current !== mood) {
      prevMood.current = mood;
      setIndex(0);
      setPlaying(false);
    }
  }, [mood]);

  // 곡 이동: 대상 곡에 ID가 있으면 바로 재생 유지(없으면 멈춤 상태)
  const go = (dir: number) => {
    setIndex((i) => {
      const next = (i + dir + list.length) % list.length;
      setPlaying(Boolean(list[next].youtubeID));
      return next;
    });
  };

  // 큐에서 곡 선택: ID 있으면 바로 재생, 없으면 멈춤
  const selectSong = (i: number) => {
    setIndex(i);
    setPlaying(Boolean(list[i].youtubeID));
  };

  // ▶/⏸ 토글: ID 있으면 재생 ↔ 멈춤, 없으면 유튜브 검색 새 탭
  const handlePlay = () => {
    if (canEmbed) {
      setPlaying((p) => !p);
    } else if (typeof window !== "undefined") {
      window.open(songYoutubeUrl(current), "_blank", "noopener");
    }
  };

  const embedSrc = current.youtubeID
    ? `https://www.youtube.com/embed/${current.youtubeID}?autoplay=1&rel=0`
    : null;

  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>WORSHIP & SONGS</Kicker>
            <H2>지금 필요한 찬양 추천</H2>
          </div>
          <p>마음에 가까운 주제를 골라, 한 곡씩 들어보세요.</p>
        </SectionHead>

        <Moods role="group" aria-label="찬양 주제">
          {SONG_MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={m.key === mood ? "active" : undefined}
              onClick={() => setMood(m.key)}
            >
              {SONG_THEMES[m.key].emoji} {m.label}
            </button>
          ))}
        </Moods>

        <Player>
          <NowPlaying gradient={theme.gradient}>
            <NPLabel>
              <span>NOW PLAYING</span>
            </NPLabel>

            {playing && embedSrc ? (
              <EmbedWrap>
                <iframe
                  key={embedSrc}
                  src={embedSrc}
                  title={`${current.title} - ${current.artist}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </EmbedWrap>
            ) : (
              <Disc playing={false} aria-hidden>
                {theme.emoji}
              </Disc>
            )}

            <TrackTitle>
              <strong>{current.title}</strong>
              <span>{current.artist}</span>
            </TrackTitle>
            <Counter>
              {index + 1} / {list.length} ·{" "}
              {SONG_MOODS.find((m) => m.key === mood)?.label}
            </Counter>

            <ListenLink
              href={songYoutubeUrl(current)}
              target="_blank"
              rel="noopener"
            >
              유튜브에서 열기 ↗
            </ListenLink>

            <Controls>
              <CtrlButton
                type="button"
                aria-label="이전 곡"
                onClick={() => go(-1)}
              >
                <IconPrev />
              </CtrlButton>
              <PlayButton
                type="button"
                accent={theme.accent}
                onClick={handlePlay}
                aria-label={
                  !canEmbed ? "유튜브에서 재생" : playing ? "멈춤" : "재생"
                }
              >
                {canEmbed && playing ? <IconPause /> : <IconPlay />}
              </PlayButton>
              <CtrlButton
                type="button"
                aria-label="다음 곡"
                onClick={() => go(1)}
              >
                <IconNext />
              </CtrlButton>
            </Controls>
          </NowPlaying>

          <Queue>
            <QueueHead>
              재생목록
              <span>{list.length}곡</span>
            </QueueHead>
            <QueueList>
              {list.map((song, i) => {
                const active = i === index;
                return (
                  <QueueItem
                    key={`${song.title}-${i}`}
                    type="button"
                    active={active}
                    accent={theme.accent}
                    onClick={() => selectSong(i)}
                  >
                    {active ? (
                      <span className="bars" aria-hidden>
                        <Bar delay={0} />
                        <Bar delay={0.2} />
                        <Bar delay={0.4} />
                      </span>
                    ) : (
                      <span className="idx">{i + 1}</span>
                    )}
                    <span className="meta">
                      <strong>{song.title}</strong>
                      <span className="artist">{song.artist}</span>
                    </span>
                  </QueueItem>
                );
              })}
            </QueueList>
          </Queue>
        </Player>

        <Small style={{ marginTop: 16 }}>
          곡을 선택하고 ▶를 누르면 ‘지금 재생 중’에서 바로 들을 수 있어요.
          아직 연결되지 않은 곡은 ▶를 누르면 유튜브 검색이 새 탭으로 열립니다.
          공식 음원·영상 여부는 링크에서 확인해 주세요.
        </Small>
      </Wrap>
    </Section>
  );
}
