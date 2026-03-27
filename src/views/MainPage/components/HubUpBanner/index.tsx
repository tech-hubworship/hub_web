"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// 비활성화 플래그: true = 배너 표시, false = 숨김
const ENABLED = false;

const HUBUP_DATE = new Date('2025-04-12T00:00:00+09:00');

function getDaysRemaining(): number {
  const now = new Date();
  const diff = HUBUP_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function HubUpBanner() {
  const router = useRouter();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(getDaysRemaining());
  }, []);

  if (!ENABLED) return null;
  if (daysLeft === null) return null;

  const isEventDay = daysLeft <= 0;

  return (
    <BannerWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BannerCard>
        <LeftSection>
          <EventLabel>HUB UP 2025</EventLabel>
          <EventName>Companion</EventName>
          <EventDate>5월 15–17일 · 소망수양관</EventDate>
        </LeftSection>

        <RightSection>
          {isEventDay ? (
            <GoButton onClick={() => router.push('/hub_up')}>
              허브업 가기! 🎉
            </GoButton>
          ) : (
            <CountdownBox>
              <CountdownLabel>허브업 신청까지</CountdownLabel>
              <CountdownNumber>D-{daysLeft}</CountdownNumber>
            </CountdownBox>
          )}
        </RightSection>

        <DecorCircle size={120} top={-30} right={-20} opacity={0.12} />
        <DecorCircle size={70} top={40} right={80} opacity={0.08} />
      </BannerCard>
    </BannerWrapper>
  );
}

const BannerWrapper = styled(motion.div)`
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  margin-bottom: 0;
  @media (max-width: 768px) { padding: 0 16px; }
`;
const BannerCard = styled.div`
  background: linear-gradient(135deg, #278f5a 0%, #1a6e44 100%);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(39, 143, 90, 0.3);
  @media (max-width: 768px) { padding: 20px; border-radius: 16px; }
`;
const LeftSection = styled.div`display: flex; flex-direction: column; gap: 4px; z-index: 1;`;
const EventLabel = styled.span`font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.75); text-transform: uppercase;`;
const EventName = styled.h2`font-size: 24px; font-weight: 800; color: #fff; margin: 0; letter-spacing: -0.02em; @media (max-width: 480px) { font-size: 20px; }`;
const EventDate = styled.span`font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 500;`;
const RightSection = styled.div`z-index: 1; flex-shrink: 0;`;
const CountdownBox = styled.div`display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.15); border-radius: 14px; padding: 10px 18px; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25);`;
const CountdownLabel = styled.span`font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 600; letter-spacing: 0.02em;`;
const CountdownNumber = styled.span`font-size: 26px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.03em;`;
const GoButton = styled.button`background: #fff; color: #1a6e44; border: none; border-radius: 12px; padding: 12px 20px; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.12); transition: transform 0.15s, box-shadow 0.15s; &:hover { transform: scale(1.05); box-shadow: 0 6px 18px rgba(0,0,0,0.18); } &:active { transform: scale(0.97); }`;
const DecorCircle = styled.div<{ size: number; top: number; right: number; opacity: number }>`position: absolute; width: ${p => p.size}px; height: ${p => p.size}px; border-radius: 50%; background: #fff; top: ${p => p.top}px; right: ${p => p.right}px; opacity: ${p => p.opacity}; pointer-events: none;`;
