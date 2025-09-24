// 파일 경로: src/views/LoginPage/style.ts

import styled from "@emotion/styled";
import Link from "next/link";
import { keyframes } from "@emotion/react";

// --- 기존 스타일은 그대로 유지합니다 ---

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
  background-color: #f0f2f5; // 배경색은 가독성을 위해 임시로 변경합니다. (기존 #8D2527)
`;

export const MainTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #111; // 흰색 배경에 보이도록 임시 변경합니다. (기존 #ffffff)
  line-height: 1.4;
  text-align: center;
  margin-bottom: 20px;
  
  @media (min-width: 768px) {
    font-size: 40px;
  }
`;

export const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  // 이 부분은 LoginCard로 대체되므로 주석 처리하거나 삭제 가능
  /* background-color: #000000; */
  /* padding: 20px; */
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
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 16px;
  color: #111;
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  text-align: center;
`;

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

// --- ⭐️ [수정] 회원가입 폼을 위해 LoginButton -> SubmitButton으로 이름 변경 ---
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

// --- ⭐️ [추가] 회원가입 페이지에 필요한 스타일들 ---
export const InputGroup = styled.div`
  width: 100%;
  margin-bottom: 1.5rem; /* 1.25 → 1.5로 좀 더 넓힘 */
  text-align: left;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 700;
  font-size: 16px; /* rem 대신 px로 고정 */
  color: #111;
`;

const BaseInputStyles = `
  width: 100%;
  padding: 18px 20px; /* 세로/가로 여백 늘려서 여유 있게 */
  font-size: 16px; /* rem 대신 px 고정으로 확실히 크게 */
  border: 1.5px solid #ced4da;
  border-radius: 12px; /* 둥글기 조금 더 강조 */
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  &::placeholder {
    font-size: 16px; /* placeholder도 동일하게 */
    color: #999;
  }
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.25rem rgba(0, 123, 255, 0.25);
  }
`;

export const Input = styled.input`
  ${BaseInputStyles}
`;

export const Select = styled.select`
  ${BaseInputStyles}
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center; /* 여백 약간 넓힘 */
  background-size: 18px 14px; /* 아이콘 크기 키움 */
`;