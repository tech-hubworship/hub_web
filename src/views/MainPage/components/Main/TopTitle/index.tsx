import React from "react";
import styled from "@emotion/styled";

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="#1a1a1a" strokeWidth="1.8"/>
    <path d="M3 9h18" stroke="#1a1a1a" strokeWidth="1.8"/>
    <path d="M8 2v4M16 2v4" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#1a1a1a"/>
    <rect x="14" y="13" width="3" height="3" rx="0.5" fill="#1a1a1a"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="16" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C7.58 2 4 5.58 4 10c0 6.5 8 16 8 16s8-9.5 8-16c0-4.42-3.58-8-8-8z" stroke="#1a1a1a" strokeWidth="1.8" fill="none"/>
    <circle cx="12" cy="10" r="3" stroke="#1a1a1a" strokeWidth="1.8" fill="none"/>
  </svg>
);

export const Box = () => {
  return (
    <Wrapper>
      <Item>
        <CalendarIcon />
        <span>주일 오후 2시</span>
      </Item>
      <Divider />
      <Item>
        <LocationIcon />
        <span>양재 온누리교회 기쁨홀</span>
      </Item>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  height: 80px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background: #ccc;
`;
