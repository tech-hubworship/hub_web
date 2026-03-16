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
  background-color: #eaf1ed; /* Similar to form background */
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Pretendard', sans-serif;
`;

const Header = styled.header`
  width: 100%;
  max-width: 768px; /* Mobile/tablet friendly max width */
  background-color: #278f5a; /* Green from the banner */
  padding: 10px;
`;

const HeaderImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
`;

const ContentArea = styled.main`
  width: 100%;
  max-width: 768px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
