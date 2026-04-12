"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

const OPEN_TIME = new Date('2026-04-12T13:00:00+09:00');

function getTimeLeft() {
  const diff = OPEN_TIME.getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export default function HubUpBanner() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = timeLeft === null;

  return (
    <Wrapper>
      <Icon>🕊️</Icon>
      <Title>Be Holy</Title>
      <Sub>HUBUP 2026</Sub>
      {isOpen ? (
        <Btn onClick={() => router.push('/hub_up')}>허브업 신청하기 →</Btn>
      ) : (
        <CountdownWrap>
          <CountdownLabel>허브업 신청까지</CountdownLabel>
          <CountdownTime>
            {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
          </CountdownTime>
        </CountdownWrap>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.section`
  width: 100%;
  background: #E3E3E3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  gap: 4px;
  box-sizing: border-box;
`;

const Icon = styled.div`
  font-size: 72px;
  line-height: 1;
  margin-bottom: 8px;
`;

const Title = styled.h2`
  font-family: 'Wanted Sans', sans-serif;
  font-weight: 700;
  font-size: 64px;
  line-height: 1.2;
  text-align: center;
  color: #2D478C;
  margin: 0;
  letter-spacing: -0.02em;
`;

const Sub = styled.p`
  font-family: 'Wanted Sans', sans-serif;
  font-weight: 700;
  font-size: 20px;
  text-align: center;
  color: #2D478C;
  margin: 0 0 16px 0;
`;

const Btn = styled.button`
  background: #2D478C;
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 0 28px;
  height: 52px;
  font-family: 'Wanted Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.04em;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

const CountdownWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
`;

const CountdownLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2D478C;
  opacity: 0.7;
`;

const CountdownTime = styled.div`
  font-family: 'Wanted Sans', sans-serif;
  font-size: 40px;
  font-weight: 800;
  color: #2D478C;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
`;
