"use client";

import React from 'react';
import styled from '@emotion/styled';

export default function HubUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutContainer>
      <Header>
        <HeaderImage src="/images/hubup-banner.png" alt="HUBUP Companion Banner" />
      </Header>
      <ContentArea>
        {children}
      </ContentArea>
    </LayoutContainer>
  );
}

const LayoutContainer = styled.div`
  min-height: 100vh;
  background-color: #f0f4f2; /* 기존보다 살짝 더 부드러운 배경색 */
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Pretendard', sans-serif;
`;

const Header = styled.header`
  width: 100%;
  max-width: 768px;
  background-color: #278f5a;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 헤더 구분감을 위한 그림자 추가 */
  z-index: 10;
`;

const HeaderImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
`;

const ContentArea = styled.main`
  width: 100%;
  max-width: 768px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;