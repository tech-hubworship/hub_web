"use client";

import React from "react";
import styled from "@emotion/styled";
import { EXPLORE_ITEMS, CGN_PLAYLISTS, CGN_CHANNEL_URL } from "../data";
import type { TabKey } from "../data";
import {
  C,
  Section,
  Wrap,
  SectionHead,
  Kicker,
  H2,
  Panel,
  Btn,
  Small,
} from "../styles";

// ---------- Explore ----------
// 둘러보기 탭: Welcome 인사말 + 주제 카드(클릭 시 해당 탭으로 이동)
// 둘러보기 주제 리스트 (한 줄짜리 행)
const ExploreList = styled.div`
  border: 1px solid ${C.line};
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
`;

const ExploreRow = styled.button`
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: none;
  border-top: 1px solid ${C.line};
  background: #fff;
  font: inherit;
  cursor: pointer;
  transition: background 0.14s;

  &:first-of-type {
    border-top: none;
  }
  &:hover {
    background: #f6f8f5;
  }

  .ico {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: ${C.sage};
    display: grid;
    place-items: center;
    font-size: 22px;
  }
  .meta {
    min-width: 0;
    flex: 1;
  }
  strong {
    display: block;
    font-size: 16px;
    letter-spacing: -0.02em;
    color: ${C.ink};
  }
  .desc {
    font-size: 13px;
    color: ${C.muted};
    margin-top: 2px;
    line-height: 1.5;
  }
  .chev {
    flex: 0 0 auto;
    color: ${C.green2};
    font-size: 18px;
    font-weight: 700;
  }
`;

const WelcomePanel = styled(Panel)`
  max-width: 860px;
  margin: 0 auto 24px;

  p {
    margin: 9px 0;
    line-height: 1.85;
    color: #56645b;
    font-size: 14px;
  }
`;

export function Explore({
  onSelectTab,
}: {
  onSelectTab: (tab: TabKey) => void;
}) {
  return (
    <Section>
      <Wrap>
        <WelcomePanel>
          <Kicker>WELCOME</Kicker>
          <H2>반갑습니다!</H2>
          <p>저희는 양재온누리교회 허브대학부 청년들입니다.</p>
          <p>이곳에 오신 여러분들을 모두 환영하고 축복합니다.</p>
          <p>교회를 다니고 계시지 않아도, 당장 믿어지지 않아도 괜찮습니다!</p>
          <p>
            하나님이 어떤 분이신지, 교회는 어떤 곳인지 궁금했던 부분들을 하나씩
            알아가면 됩니다.
          </p>
          <p>오늘은 편하게 구경만 하고 가셔도 좋습니다. 감사합니다.</p>
        </WelcomePanel>

        <SectionHead>
          <div>
            <Kicker>EXPLORE</Kicker>
            <H2>무엇이 궁금하신가요?</H2>
          </div>
          <p>원하는 주제를 골라 살펴보세요.</p>
        </SectionHead>
        <ExploreList>
          {EXPLORE_ITEMS.map((item) => (
            <ExploreRow
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
            >
              <span className="ico" aria-hidden>
                {item.icon}
              </span>
              <span className="meta">
                <strong>{item.title}</strong>
                <span className="desc">{item.desc}</span>
              </span>
              <span className="chev" aria-hidden>
                →
              </span>
            </ExploreRow>
          ))}
        </ExploreList>
      </Wrap>
    </Section>
  );
}

// ---------- Why ----------
const WhyPanel = styled(Panel)`
  .quote {
    font-size: 21px;
    color: ${C.green};
    font-weight: 650;
    letter-spacing: -0.03em;
    margin: 0 0 12px;
  }
`;

export function Why() {
  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>WHY WE SHARE</Kicker>
            <H2>우리가 전도하는 이유</H2>
          </div>
        </SectionHead>
        <WhyPanel dark>
          <p className="quote">
            여러분은 맛있는 음식을 먹거나 좋은 무언가를 발견했을 때, 사랑하는
            사람과 함께 나누고 싶었던 적이 있나요?
          </p>
          <p>
            저희에게는 하나님을 사랑하고, 하나님을 알아가는 것이 그만큼 큰
            행복이고 기쁨입니다.
          </p>
          <p>
            하나님께서는 저희를 사랑하시고, 여러분 한 사람 한 사람도
            사랑하십니다. 그렇기에 하나님께서 사랑하시는 여러분에게 저희가 경험한
            하나님의 사랑을 전하는 일은 저희에게도 큰 기쁨입니다.
          </p>
          <p>저희가 누리는 이 기쁨과 사랑을 여러분과도 함께 나누고 싶습니다.</p>
          <p>
            <strong>
              함께 하나님의 사랑을 알아가고, 그 사랑을 누릴 수 있기를 기도합니다.
            </strong>
          </p>
        </WhyPanel>
      </Wrap>
    </Section>
  );
}

// ---------- CGN Videos ----------
// 히어로 배너
const CgnHero = styled.a`
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 22px;
  padding: 28px 24px;
  margin-bottom: 20px;
  text-decoration: none;
  color: #fff;
  background: linear-gradient(135deg, #16221d 0%, #24433a 60%, #356451 100%);
  box-shadow: 0 18px 40px -22px rgba(0, 0, 0, 0.5);

  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    background: rgba(255, 255, 255, 0.16);
    padding: 5px 11px;
    border-radius: 999px;
  }
  h3 {
    margin: 12px 0 8px;
    font-size: clamp(20px, 3.4vw, 26px);
    letter-spacing: -0.03em;
    line-height: 1.3;
  }
  p {
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 1.7;
    color: #dbe7df;
    max-width: 560px;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    font-weight: 750;
    background: rgba(255, 255, 255, 0.92);
    color: #16221d;
    padding: 10px 16px;
    border-radius: 999px;
  }
`;

const RailHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 4px 2px 10px;

  strong {
    font-size: 15px;
    letter-spacing: -0.02em;
    color: ${C.ink};
  }
  .hint {
    font-size: 12px;
    color: ${C.muted};
  }
`;

// 가로 스크롤 콘텐츠 레일
const Rail = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 2px 18px 8px;
  margin: 0 -18px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const VideoCard = styled.a<{ gradient: string }>`
  flex: 0 0 auto;
  width: 180px;
  scroll-snap-align: start;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 480px) {
    width: 158px;
  }

  .poster {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 16px;
    overflow: hidden;
    background: ${(p) => p.gradient};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 14px;
    box-shadow: 0 14px 30px -18px rgba(0, 0, 0, 0.5);
    transition: transform 0.18s;
  }
  &:hover .poster {
    transform: translateY(-4px);
  }

  .tag {
    align-self: flex-start;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #fff;
    background: rgba(0, 0, 0, 0.28);
    padding: 4px 9px;
    border-radius: 999px;
  }
  .emoji {
    font-size: 44px;
    text-align: center;
    margin: auto 0;
  }
  .play {
    align-self: flex-end;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    color: #1d2b25;
    display: grid;
    place-items: center;
    font-size: 15px;
  }
  .info {
    padding: 0 2px;
  }
  .info strong {
    display: block;
    font-size: 14px;
    letter-spacing: -0.02em;
    color: ${C.ink};
    line-height: 1.35;
  }
  .info span {
    display: block;
    margin-top: 3px;
    font-size: 12px;
    color: ${C.muted};
    line-height: 1.5;
  }
`;

export function CgnVideos() {
  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>WATCH & GROW</Kicker>
            <H2>영상으로 만나는 말씀과 이야기</H2>
          </div>
          <p>지금 내 마음에 필요한 콘텐츠를 만나보세요.</p>
        </SectionHead>

        <CgnHero href={CGN_CHANNEL_URL} target="_blank" rel="noopener">
          <span className="badge">CGN · 미디어 선교</span>
          <h3>일상에서 만나는 복음의 이야기</h3>
          <p>
            찬양·예배부터 간증, 선교 현장까지. 처음 신앙을 접하는 분도 관심 있는
            주제부터 편하게 즐겨보세요.
          </p>
          <span className="cta">채널 둘러보기 ↗</span>
        </CgnHero>

        <RailHead>
          <strong>주제별로 골라보기</strong>
          <span className="hint">← 옆으로 넘기기 →</span>
        </RailHead>

        <Rail>
          {CGN_PLAYLISTS.map((pl) => (
            <VideoCard
              key={pl.href}
              href={pl.href}
              target="_blank"
              rel="noopener"
              gradient={pl.gradient}
            >
              <div className="poster">
                <span className="tag">{pl.tag}</span>
                <span className="emoji" aria-hidden>
                  {pl.emoji}
                </span>
                <span className="play" aria-hidden>
                  ▶
                </span>
              </div>
              <div className="info">
                <strong>{pl.title}</strong>
                <span>{pl.desc}</span>
              </div>
            </VideoCard>
          ))}
        </Rail>

        <Small style={{ marginTop: 14 }}>
          더 다양한 영상은 CGN 유튜브 채널에서 만나보세요.
        </Small>
      </Wrap>
    </Section>
  );
}

// ---------- Hurray Team ----------
const Overview = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: rgba(255, 255, 255, 0.32);
  border: 1px solid ${C.line};
  border-radius: 18px;
  padding: 24px 0;
  margin: 18px 0 16px;

  @media (max-width: 850px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 22px;
  }
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.article`
  padding: 0 22px;
  border-right: 1px solid #dce1d8;
  min-width: 0;

  &:last-child {
    border-right: 0;
  }

  .label {
    font-size: 10px;
    letter-spacing: 0.15em;
    color: ${C.green2};
    font-weight: 800;
  }
  h3 {
    font-size: 21px;
    line-height: 1.25;
    letter-spacing: -0.04em;
    margin: 3px 0 12px;
    color: ${C.green};
  }
  p,
  li {
    font-size: 13px;
    line-height: 1.8;
    color: #52665b;
  }
  p {
    margin: 0;
  }
  ol {
    padding-left: 18px;
    margin: 0;
  }
  li {
    padding-left: 2px;
    margin: 0 0 7px;
  }

  @media (max-width: 850px) {
    &:nth-of-type(2) {
      border-right: 0;
    }
  }
  @media (max-width: 520px) {
    border-right: 0;
    border-bottom: 1px solid #dce1d8;
    padding: 0 20px 20px;

    &:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
  }
`;

const HurrayNote = styled.div`
  padding: 20px 24px;
  border-radius: 16px;
  background: #e9eee6;
  border: 1px solid #e0e6dc;

  strong {
    color: ${C.green};
    font-size: 15px;
  }
  p {
    margin: 7px 0 0;
    color: #56645b;
    font-size: 14px;
    line-height: 1.85;
  }
`;

export function HurrayTeam() {
  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>MEET HURRAY</Kicker>
            <H2>허뤠이 팀 소개</H2>
          </div>
          <p>복음의 기쁨을 세상에 자랑하자!</p>
        </SectionHead>

        <Overview>
          <Item>
            <div className="label">ABOUT US</div>
            <h3>팀 소개</h3>
            <p>
              허뤠이는 ‘만세!’라는 뜻의 영어 감탄사로, 복음의 기쁨과 구원의
              감격을 세상에 자랑하자는 의미를 담은 노방전도팀입니다.
            </p>
          </Item>
          <Item>
            <div className="label">OUR VISION</div>
            <h3>팀 비전</h3>
            <p>
              기쁨으로 복음을 전하고, 예수 믿는 사람답게 살아가는 것. 하나님을
              믿는 삶의 기쁨을 누리며, 그 기쁨을 세상에 나눕니다.
            </p>
          </Item>
          <Item>
            <div className="label">OUR GOALS</div>
            <h3>팀 목표</h3>
            <p>
              교회 안에 머무는 신앙이 아닌, 세상 속에서 빛과 소금의 역할을
              감당하는 팀! 삶으로 예수님의 매력을 드러내길 소망합니다.
            </p>
          </Item>
          <Item>
            <div className="label">OUR PURPOSE</div>
            <h3>팀 목적</h3>
            <ol>
              <li>세상에 흘려보내는 신앙인으로 살아가기</li>
              <li>복음 전파의 지상명령을 위해 꾸준히 훈련하기</li>
              <li>하나님이 찾으시는 한 영혼 발견하기</li>
            </ol>
          </Item>
        </Overview>

        <HurrayNote>
          <strong>우리가 전하고 싶은 복음의 모습</strong>
          <p>
            ‘예수님을 믿는 것이 정말 기쁜 일이고 행복한 삶이다’라는 기쁨에 초점을
            맞춥니다. 노방전도 가운데 거절이나 어려움을 만나더라도 예수님을 믿는
            사람답게 반응하는 법을 서로 배우고, 진리의 복음을 기쁨으로 전하고자
            합니다.
          </p>
        </HurrayNote>
      </Wrap>
    </Section>
  );
}

// ---------- Footer ----------
const FooterBox = styled.footer`
  background: #e9ece5;
  padding: 28px 0;
  margin-top: 24px;
  font-size: 12px;
  color: #5c685f;
  word-break: keep-all;
  overflow-wrap: break-word;

  .row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
`;

export function EvangelismFooter() {
  return (
    <FooterBox>
      <Wrap className="row">
        <div>
          <strong>한 영혼을 향한 사랑</strong>
          <br />
          부담 없이 알아보고, 편하게 질문하는 곳
        </div>
        <div>양재온누리교회 허브대학부 · 허뤠이</div>
      </Wrap>
    </FooterBox>
  );
}
