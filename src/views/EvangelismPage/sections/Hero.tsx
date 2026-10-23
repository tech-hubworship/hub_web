"use client";

import React from "react";
import styled from "@emotion/styled";
import type { TabKey } from "../data";
import { C, Wrap } from "../styles";

const Nav = styled.header`
  display: flex;
  align-items: center;
  padding: 20px 0;
`;

const Brand = styled.div`
  font-weight: 800;
  letter-spacing: -0.04em;
  color: ${C.green};
  font-size: 18px;

  span {
    display: block;
    font-size: 10px;
    letter-spacing: 0.18em;
    color: ${C.muted};
    font-weight: 600;
  }
`;

const HeroButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

const HeroBox = styled.section`
  background: ${C.green};
  color: #fff;
  border-radius: 24px;
  padding: clamp(28px, 6vw, 68px);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    border-radius: 18px;
  }
`;

const HeroCopy = styled.div`
  flex: 1;
  min-width: 0;

  .eyebrow {
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #c8d9ca;
    font-weight: 700;
  }

  h1 {
    font-size: clamp(30px, 7vw, 62px);
    line-height: 1.18;
    letter-spacing: -0.055em;
    margin: 14px 0 18px;
    max-width: 700px;
  }

  p {
    max-width: 560px;
    color: #e0e9e1;
    margin: 0 0 28px;
  }

  @media (max-width: 768px) {
    h1 {
      margin: 10px 0 14px;
    }
    p {
      margin: 0 0 20px;
      font-size: 15px;
    }
  }
`;

const VerseBadge = styled.aside`
  flex: 0 0 clamp(240px, 30vw, 330px);
  width: clamp(240px, 30vw, 330px);
  min-height: 190px;
  border: 1px solid #789488;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 26px;
  color: #e0e9e1;
  gap: 12px;

  @media (max-width: 768px) {
    align-self: stretch;
    width: 100%;
    flex-basis: auto;
    min-height: unset;
    padding: 20px;
  }

  .mark {
    font-size: 26px;
    line-height: 1;
    color: #c8d9ca;
  }
  blockquote {
    margin: 0;
    font-size: clamp(14px, 1.35vw, 17px);
    line-height: 1.65;
    letter-spacing: -0.035em;
  }
  cite {
    font-size: 12px;
    font-style: normal;
    color: #c8d9ca;
    font-weight: 700;
  }
`;

export default function Hero({
  onSelectTab,
}: {
  onSelectTab: (tab: TabKey) => void;
}) {
  return (
    <Wrap>
      <Nav>
        <Brand>
          한 영혼을 향한 사랑
          <span>LOVE · FAITH · COMMUNITY</span>
        </Brand>
      </Nav>

      <HeroBox>
        <HeroCopy>
          <div className="eyebrow">YOU ARE LOVED</div>
          <h1>
            하나님이
            <br />
            당신을 사랑하십니다
          </h1>
          <p>
            하나님에 대해 궁금했던 이야기, 누군가에게 묻기 어려웠던 질문들.
            <br />
            이곳에서 천천히 알아가며, 마음 편히 쉬어 가세요.
          </p>
          <HeroButton type="button" onClick={() => onSelectTab("explore")}>
            천천히 둘러보기 <span>↘</span>
          </HeroButton>
        </HeroCopy>

        <VerseBadge aria-label="마태복음 11장 28절 말씀">
          <div className="mark">“</div>
          <blockquote>
            수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라
          </blockquote>
          <cite>마태복음 11:28</cite>
        </VerseBadge>
      </HeroBox>
    </Wrap>
  );
}
