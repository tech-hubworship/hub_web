// 파일 경로: src/views/InfoPage/style.ts

import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const Wrapper = styled.div`
  width: 100%;
  min-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 100px 20px 60px 20px;
  gap: 40px;
  background-color: #000000;
  color: #ffffff;
  box-sizing: border-box;
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #ED2725;
  line-height: 1.4;
  text-align: center;
  cursor: pointer; /* 역할 변경 이스터에그를 위해 */
`;

export const Card = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 500px;
  padding: 40px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const InfoWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column; /* 세로 정렬로 변경 */
  align-items: flex-start; /* 왼쪽 정렬 */
  gap: 8px; /* 라벨과 값 사이 간격 */
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
  min-height: 38px;
  width: 100%;
`;

export const Label = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

export const Value = styled.span`
  font-size: 16px;
  color: #555;
`;

export const LogoutButton = styled.button`
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #555;
  color: #fff;
  margin-top: 16px;

  &:hover {
    background-color: #333;
  }
`;

export const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  width: 100%;
  margin-bottom: 1rem;
`;

export const LoadingText = styled.p`
  color: #fff;
  font-size: 16px;
  text-align: center;
`;

export const NoDataText = styled.p`
  color: #fff;
  font-size: 16px;
  text-align: center;
`;

// =============================================
// 정보 업데이트 모달을 위한 스타일 추가
// =============================================

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease;
`;

export const ModalContent = styled.div`
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: ${slideUp} 0.4s ease;
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 24px;
`;

export const Select = styled.select`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  color: #000;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  font-size: 16px;
  color: #000;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }
`;

export const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

export const CancelButton = styled.button`
  flex: 1;
  padding: 14px 0;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0e0e0;
  }
`;

export const SubmitButton = styled.button`
  flex: 1;
  padding: 14px 0;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`;