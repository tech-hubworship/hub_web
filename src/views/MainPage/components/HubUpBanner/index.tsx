"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

export default function HubUpBanner() {
  const router = useRouter();

  return (
    <Wrapper>
      <Icon>🕊️</Icon>
      <Title>Be Holy</Title>
      <Sub>HUBUP 2026</Sub>
      <Btn onClick={() => router.push('/hub_up')}>허브업 신청하기 →</Btn>
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
