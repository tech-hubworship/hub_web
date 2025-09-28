// 파일 경로: src/views/LoginPage/style.ts

import styled from "@emotion/styled";
import Link from "next/link";
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
  min-height: calc(100vh - 162px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 40px;
  background-color: #f0f2f5;
`;

export const LoginCard = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 12px;
  color: #111;
  line-height: 1.4;
`;

// ⭐️ [복원] LoginPage에 필요한 Subtitle 스타일
export const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  text-align: center;
`;

export const InputGroup = styled.div`
  width: 100%;
  margin-bottom: 1rem;
  text-align: left;
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  color: #000;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66,133,244,0.2);
  }
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
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66,133,244,0.2);
  }
`;

// ⭐️ [복원] LoginPage에 필요한 GoogleLoginButton 스타일
export const GoogleLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background-color: #4285f4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #357ae8;
    box-shadow: 0 4px 12px rgba(66,133,244,0.3);
  }

  svg {
    font-size: 18px;
    fill: #fff;
  }
`;

// SignUpPage에 필요한 SubmitButton 스타일
export const SubmitButton = styled.button`
  width: 100%;
  padding: 14px 0;
  background-color: #111;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #333;
  }
`;

export const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

// 다단계 폼에 필요한 스타일
export const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

export const CancelButton = styled.button`
  width: 100%;
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

export const ProgressBar = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 24px;
  position: relative;
  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #e0e0e0;
    transform: translateY(-50%);
  }
`;

export const ProgressStep = styled.div<{ active?: boolean }>`
  font-size: 12px;
  color: ${({ active }) => (active ? '#fff' : '#aaa')};
  background-color: ${({ active }) => (active ? '#111' : '#e0e0e0')};
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
`;