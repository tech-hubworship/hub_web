import styled from "@emotion/styled";
import { colors } from "@sopt-makers/colors";
import { css, keyframes } from "@emotion/react";
import {
  ArrowDownAnimation,
  ArrowUpAnimation,
} from "@src/lib/styles/animation";

interface ButtonStyleProps {
  isOpened: boolean;
}

// 확장 애니메이션 키프레임
const expandAnimation = keyframes`
  0% {
    max-height: 0;
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    max-height: 3500px;
    opacity: 1;
    transform: translateY(0);
  }
`;

// 축소 애니메이션 키프레임
const collapseAnimation = keyframes`
  0% {
    max-height: 3500px;
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    max-height: 0;
    opacity: 0;
    transform: translateY(-20px);
  }
`;

export const Root = styled.div`
  border-bottom: 1px solid #000000;
  width: 80vw;
  margin-bottom: 40px;

    padding-bottom: 10px;

  
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 550px;
    padding-bottom: 10px;
    margin-bottom: 40px;
  }
`;
export const Section = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  width: 100%;

    padding-top: 20px;

  
  @media (min-width: 58.75rem) {
    padding-top: 20px;
  }
`;

export const TItle = styled.h3`
  color: #000000;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.56px;
  line-height: normal;
  white-space: nowrap;
`;

export const Button = styled.button<ButtonStyleProps>`
  outline: inherit;
  background: no-repeat url("/plus.svg");
  cursor: pointer;
  width: 16px;
  height: 16px;

  /* stylelint-disable */

    width: 16px;
    height: 16px;

  ${ArrowDownAnimation}
  ${ArrowUpAnimation}
  
  animation: ${({ isOpened }) =>
    isOpened ? "ArrowUp 0.3s forwards" : "ArrowDown 0.3s forwards"};
  -moz-animation: ${({ isOpened }) =>
    isOpened ? "ArrowUp 0.3s forwards" : "ArrowDown 0.3s forwards"};
  -webkit-animation: ${({ isOpened }) =>
    isOpened ? "ArrowUp 0.3s forwards" : "ArrowDown 0.3s forwards"};
  -o-animation: ${({ isOpened }) =>
    isOpened ? "ArrowUp 0.3s forwards" : "ArrowDown 0.3s forwards"};
  color: inherit;
`;

export const Contents = styled.div<ButtonStyleProps>`
  overflow: hidden;
  width: 100%;
  line-height: 180%;
  letter-spacing: -0.03em;
  white-space: pre-line;
  color: black;
  font-weight: 400;
  font-style: normal;

    font-size: 14px;

  
  @media (min-width: 58.75rem) {
    font-size: 14px;
  }

  ${({ isOpened }) =>
    isOpened
      ? css`
          animation: ${expandAnimation} 0.5s ease forwards;
          transform-origin: top;
        `
      : css`
          animation: ${collapseAnimation} 0.4s ease forwards;
          transform-origin: top;
        `}
`;

export const Essence = styled.div`
  width: 80vw;
  margin-top: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #D7D7D7;

  
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 550px;
    margin-top: 15px;
    padding-bottom: 15px;
  }
`;

export const EssenceLast = styled(Essence)`
  border-bottom: none;
  
  @media (min-width: 58.75rem) {
    border-bottom: none;
  }
`;

export const Tag = styled.span`
  color: #000000;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.32px;
`;

export const EssenceTitle = styled.h3`
  color: #000000;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.56px;
  line-height: normal;
  white-space: nowrap;
  margin-top: 4px;
  margin-bottom: 7px;
`;

export const EssenceContents = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: -0.24px;
  font-size: 12px;
  font-weight: 600;
  font-style: normal;
`;

export const Speaker = styled.span`
  color: #000000;
`;

export const Group = styled.span`
  color: #A1A1A1;
`;

export const FirstWord = styled.span`
  color: #000000;
`;

export const SecondWord = styled.span`
  color: #ED2725;
`;
