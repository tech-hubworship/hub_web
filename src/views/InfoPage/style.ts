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
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 0;
  box-sizing: border-box;
`;

export const Title = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 2px;
  white-space: pre-line;
  line-height: 37px;
  letter-spacing: -0.56px;
  color: #000000;
`;




export const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  width: 100%;
  margin-bottom: 1rem;
`;

export const LoadingText = styled.p`
  color: #666;
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
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px;
    align-items: flex-start;
    padding-top: 40px;
  }
`;

export const ModalContent = styled.div`
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: ${slideUp} 0.4s ease;
  overflow-y: auto;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 24px 20px;
    max-height: calc(100vh - 80px);
    border-radius: 16px 16px 0 0;
  }
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 20px;
  }
`;

export const Select = styled.select`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  padding-right: 40px;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  color: #000;
  background-color: white;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
  }

  option {
    padding: 12px;
    font-size: 16px;
    color: #000;
    background-color: white;
  }

  @media (max-width: 768px) {
    height: 44px;
    font-size: 16px;
    padding: 0 14px;
    padding-right: 40px;
    -webkit-appearance: none;
    appearance: none;
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
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }

  @media (max-width: 768px) {
    height: 44px;
    font-size: 16px;
    padding: 0 14px;
  }
`;

export const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  margin-top: 24px;

  @media (max-width: 768px) {
    gap: 10px;
    margin-top: 20px;
  }
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
  box-sizing: border-box;

  &:hover {
    background-color: #e0e0e0;
  }

  @media (max-width: 768px) {
    padding: 12px 0;
    font-size: 15px;
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
  box-sizing: border-box;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  @media (max-width: 768px) {
    padding: 12px 0;
    font-size: 15px;
  }
`;

// 새로운 컴포넌트들을 위한 스타일 추가
// 헤더 섹션
export const HeaderSection = styled.div`
  padding: 10px 20px 10px 20px;
  color: black;
  position: relative;
  overflow: hidden;
  margin-top: 70px;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 100%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

export const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

export const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(128, 128, 128, 0.6);
  color: white;
`;

export const UserDetails = styled.div`
  flex: 1;
`;

export const UserName = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: black;
`;

export const UserSubtitle = styled.p`
  font-size: 14px;
  margin: 0;
  color: rgba(0, 0, 0, 0.7);
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.3);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  font-size: 18px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(128, 128, 128, 0.5);
    transform: scale(1.05);
  }
`;

export const NotificationBadge = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
`;

export const Content = styled.main`
  padding: 20px;
  margin-top: -20px;
  position: relative;
  z-index: 2;
`;

export const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
`;

export const CardAction = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const Section = styled.section`
  margin-bottom: 24px;
`;

// 정보 항목 스타일
export const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

export const InfoLabel = styled.span`
  font-size: 15px;
  color: #666;
  font-weight: 500;
`;

export const InfoValue = styled.span`
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 600;
  text-align: right;
`;

export const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
`;

export const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
  
  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const MenuIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

export const MenuText = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.2;
`;

// 로그아웃 버튼 스타일
export const LogoutButton = styled.button`
  width: 100%;
  height: 56px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 40px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #d0d0d0;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// 모달 관련 스타일들
export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    gap: 14px;
    margin-bottom: 16px;
  }
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 6px;
  }
`;