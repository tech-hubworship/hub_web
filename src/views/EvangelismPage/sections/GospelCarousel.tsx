"use client";

import React, { useRef } from "react";
import styled from "@emotion/styled";
import { GOSPEL_STEPS } from "../data";
import type { TabKey } from "../data";
import { C, Section, Wrap, SectionHead, Kicker, H2, Panel, Tag, Btn, Small } from "../styles";

const LinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 17px;
  border-radius: 999px;
  background: #e3eddf;
  color: #193b30;
  font: inherit;
  font-weight: 750;
  font-size: 14px;
  border: 1px solid transparent;
  cursor: pointer;
`;

const Intro = styled(Panel)`
  margin-bottom: 18px;

  .quote {
    font-size: 21px;
    color: ${C.green};
    font-weight: 650;
    letter-spacing: -0.03em;
    margin: 12px 0;
  }
`;

const CarouselWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (min-width: 621px) {
    max-width: 790px;
    margin: auto;
    gap: 12px;
  }
`;

const Rail = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 4px 2px 14px;
  flex: 1;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Card = styled.article`
  flex: 0 0 min(760px, 100%);
  min-height: 510px;
  scroll-snap-align: start;
  box-sizing: border-box;
  padding: clamp(28px, 5vw, 58px);
  background: ${C.panel};
  border: 1px solid ${C.line};
  border-radius: 18px;
  text-align: center;

  @media (max-width: 768px) {
    flex-basis: 100%;
    min-height: unset;
    padding: 26px 20px;
  }

  h3 {
    font-size: clamp(22px, 5vw, 34px);
    line-height: 1.35;
    letter-spacing: -0.03em;
    margin: 10px 0 12px;
  }

  p {
    font-size: clamp(15px, 4vw, 18px);
    max-width: 680px;
    margin: 0 auto 10px;
    line-height: 1.8;
    color: #56645b;
  }
`;

const Symbol = styled.div`
  width: 136px;
  height: 136px;
  margin: 0 auto 22px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 10px;
  }

  @media (max-width: 768px) {
    width: 104px;
    height: 104px;
    margin: 0 auto 16px;
  }
`;

const Verses = styled.p`
  font-size: 14px !important;
  color: ${C.muted} !important;
`;

const Arrow = styled.button`
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border: 1px solid ${C.line};
  border-radius: 50%;
  background: #fff;
  color: ${C.green2};
  font-size: 27px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;

  &:hover {
    border-color: #9eb6a3;
    background: #f5f8f4;
  }

  @media (max-width: 620px) {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
    font-size: 22px;
  }
`;

const Note = styled.div`
  font-size: 12px;
  color: ${C.muted};
  display: flex;
  justify-content: space-between;
  margin: 4px 2px 0;
`;

const Summary = styled(Panel)`
  margin-top: 18px;
`;

export default function GospelCarousel({
  onSelectTab,
}: {
  onSelectTab: (tab: TabKey) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("article");
    const width = card ? card.getBoundingClientRect().width : rail.clientWidth;
    rail.scrollBy({ left: (width + 14) * dir, behavior: "smooth" });
  };

  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>THE GREATEST HAPPINESS</Kicker>
            <H2>복음에 대해 들어보실래요?</H2>
          </div>
          <p>참된 행복은 어디에서 시작될까요? 복음의 이야기를 따라가 보세요.</p>
        </SectionHead>

        <Intro dark>
          <Tag>복음의 여정</Tag>
          <p className="quote">
            당신은 언제 가장 행복하다고 생각하십니까? 그 행복한 시간이 영원하다고
            생각하시나요?
          </p>
          <p>
            사람은 본래 하나님과 교제하며 행복하게 살도록 창조되었습니다. 그러나
            죄로 하나님을 떠났고, 하나님께서는 우리를 사랑하셔서 예수 그리스도를
            보내셨습니다.
          </p>
          <Btn
            variant="dark"
            href="https://www.youtube.com/watch?v=8-KDN_-5zJA"
            target="_blank"
            rel="noopener"
          >
            복음 영상 보기 ↗
          </Btn>
        </Intro>

        <CarouselWrap>
          <Arrow
            type="button"
            aria-label="이전 내용"
            onClick={() => scrollByCard(-1)}
          >
            ‹
          </Arrow>

          <Rail ref={railRef} tabIndex={0} aria-label="복음 이야기 순서대로 보기">
            {GOSPEL_STEPS.map((step) => (
              <Card key={step.no}>
                <Symbol aria-hidden>
                  <img src={step.image} alt="" />
                </Symbol>
                <Tag>
                  {step.no} · {step.tag}
                </Tag>
                <h3>{step.title}</h3>
                {step.body.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {step.verses.length > 0 && (
                  <Verses>말씀 · {step.verses.join(", ")}</Verses>
                )}
                {step.link && (
                  <LinkButton
                    type="button"
                    onClick={() => onSelectTab(step.link!.tab)}
                  >
                    {step.link.label} →
                  </LinkButton>
                )}
              </Card>
            ))}
          </Rail>

          <Arrow
            type="button"
            aria-label="다음 내용"
            onClick={() => scrollByCard(1)}
          >
            ›
          </Arrow>
        </CarouselWrap>

        <Note>
          <span>옆으로 넘겨 복음의 이야기를 순서대로 살펴보세요</span>
          <span>← 스와이프 →</span>
        </Note>

        <Summary>
          <h3>복음의 핵심을 한눈에</h3>
          <p>
            사람은 하나님과 교제하도록 창조되었지만 죄로 하나님을 떠났습니다.
            하나님은 사랑으로 예수 그리스도를 보내셨고, 예수님은 대속물로
            죽으시고 부활하셨습니다. 예수님을 믿고 영접하는 사람은 하나님의
            자녀가 되어 평안과 영생을 누립니다.
          </p>
          <Small>
            관련 말씀: 창세기 1:27 · 요한일서 4:8 · 로마서 3:23 · 로마서 6:23 ·
            마가복음 10:45 · 요한복음 14:27 · 요한복음 10:10 · 요한복음 3:16 ·
            요한복음 1:12 · 요한계시록 3:20
          </Small>
        </Summary>
      </Wrap>
    </Section>
  );
}
