"use client";

import React from 'react';
import styled from '@emotion/styled';

export default function HubUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <Outer>
      <Inner>{children}</Inner>
    </Outer>
  );
}

const Outer = styled.div`
  min-height: 100vh;
  background-color: #FAFAFA;
  display: flex;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif;
`;

const Inner = styled.div`
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: #FAFAFA;
  position: relative;
`;
