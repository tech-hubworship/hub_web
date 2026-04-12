"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

// 4월 12일 오후 4시 KST 활성화
const OPEN_TIME = new Date('2026-04-12T14:00:00+09:00');

export default function HubUpBanner() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsOpen(new Date() >= OPEN_TIME);
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Wrapper>
      <Icon>🕊️</Icon>
      <Title>Be Holy</Title>
      <Sub>HUBUP 2026</Sub>
      {isOpen ? (
        <Btn onClick={() => router.push('/hub_up')}>허브업 신청하기 →</Btn>
      ) : (
        <BtnDisabled>신청 준비 중...</BtnDisabled>
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

const BtnDisabled = styled.div`
  background: #B0B0B0;
  color: #fff;
  border-radius: 16px;
  padding: 0 28px;
  height: 52px;
  display: flex;
  align-items: center;
  font-family: 'Wanted Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.04em;
  cursor: not-allowed;
`;
