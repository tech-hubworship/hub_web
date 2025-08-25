import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

export const Ul = styled.ul`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  gap: 12px;
  margin: 0 auto;
  padding: 0;
  margin-top: 20px;
  font-family: var(--font-wanted);
  max-width: 800px;
  
  li {
    width: 100%;
    &:last-child {
      border: none;
    }
  }
  
  @media screen and (max-width: 80rem) {
  }
`;

export const LoadingText = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #777;
  font-size: 16px;
`;

export const NoData = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #777;
  font-size: 16px;
`;

// 로딩 애니메이션을 위한 키프레임
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 로딩 컨테이너
export const LoadingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 16px;
`;

// 로딩 스피너
export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #333;
  animation: ${spin} 1s linear infinite;
`;

export const ViewAllButton = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 24px;
`;

export const ButtonText = styled.span`
  display: inline-block;
  padding: 10px 20px;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;
