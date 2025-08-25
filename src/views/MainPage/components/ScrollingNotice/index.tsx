import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

interface ScrollingNoticeProps {
  text: string;
}

const ScrollingNotice: React.FC<ScrollingNoticeProps> = ({ text }) => {
  return (
    <Container>
      <Wrapper>
        <ScrollingText>
          {text} &nbsp;&nbsp;&nbsp;&nbsp;
          {text} &nbsp;&nbsp;&nbsp;&nbsp;
          {text} &nbsp;&nbsp;&nbsp;&nbsp;
          {text} &nbsp;&nbsp;&nbsp;&nbsp;
          {text} &nbsp;&nbsp;&nbsp;&nbsp;
          {text} &nbsp;&nbsp;&nbsp;&nbsp;
        </ScrollingText>
      </Wrapper>
    </Container>
  );
};

export default ScrollingNotice;

const Container = styled.div`
  width: 100%;
  background-color: #000;
  overflow: hidden;
  padding: 12px 0;

  @media (min-width: 58.75rem) {
    width: 600px;
  }
`;

const Wrapper = styled.div`
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
`;

const scrolling = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const ScrollingText = styled.div`
  display: inline-block;
  white-space: nowrap;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  animation: ${scrolling} 20s linear infinite;
  padding-left: 100%;

  @media (min-width: 58.75rem) {
    font-size: 20px;
  }
`; 
