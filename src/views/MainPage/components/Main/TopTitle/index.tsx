import React from "react";
import styled from "@emotion/styled";

export const Box = () => {
  return (
    <Wrapper>
      <Item>
        <span>🗓</span>
        <span>주일 오후 2시</span>
      </Item>
      <Divider />
      <Item>
        <span>📍</span>
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
