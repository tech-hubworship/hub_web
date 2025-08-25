import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

export const Container = styled.section`
  width: 100%;
  height: calc((228 / 360) * 100vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: url('/images/Tshirts_Banner.png');
  background-position: center;
  background-color: #ED2725;
  background-repeat: no-repeat;
  background-size: contain;
  position: relative;

  @media (min-width: 58.75rem) {
    height: 228px;
    width: 100%;
    max-width: 600px;
    background-size: cover;
  }
`;


export const ButtonContainer = styled.section`
  width: 100%;
  height: calc((52 / 360) * 100vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #000000;
  background-repeat: no-repeat;
  background-size: contain;
  position: relative;

  @media (min-width: 58.75rem) {
    height: 52px;
    width: 100%;
    max-width: 600px;
  }
`;

export const Button = styled.button`
  width: 100%;
  height: 100%;
  background-color: #000000;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #1a1a1a;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export const ButtonText = styled.span`
  color: #FFFFFF;
  font-family: var(--font-wanted);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.36px;
  line-height: 37px;
`;

// 로딩 애니메이션 정의
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  @media (min-width: 58.75rem) {
    width: 600px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: ${spin} 1s ease-in-out infinite;
  margin-bottom: 16px;
`;

export const LoadingText = styled.p`
  color: white;
  font-family: var(--font-wanted);
  font-size: 16px;
  font-weight: 500;
`;

