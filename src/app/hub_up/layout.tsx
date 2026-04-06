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

// 전체 배경
const Outer = styled.div`
  min-height: 100vh;
  background-color: #FAFAFA;
  display: flex;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif;
`;

// 고정 너비 컨테이너 - 모든 hub_up 페이지가 이 안에서 렌더됨
const Inner = styled.div`
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: #FAFAFA;
  position: relative;
`;
