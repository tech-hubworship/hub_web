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
  background-color: #8D2527; /* 은은한 빨간색 배경 */
  color: #ffffff;
`;

export const MainTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #ffffff; /* 흰색으로 변경하여 대비 강조 */
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
  background-color: #000000;
  padding: 20px;
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

export const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #000;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px;

  svg {
    margin-right: 4px;
  }

  &:hover {
    opacity: 0.8;
  }
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 12px;
  color: #111;
  line-height: 1.4;
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  text-align: center;
`;

export const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

export const LoginButton = styled.button`
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

export const Divider = styled.div`
  margin: 24px 0;
  height: 1px;
  width: 100%;
  background: #eee;
`;

export const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

export const TshirtSignupContainer = styled.div`
  text-align: center;
  margin-top: 16px;
`;

export const TshirtSignupText = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

export const TshirtSignupLink = styled(Link)`
  font-size: 15px;
  font-weight: 600;
  color: #4285f4;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// 모달 관련 스타일 추가
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

export const ModalContent = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.4s ease-out;
`;

export const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
`;

export const ModalSubtitle = styled.p`
  font-size: 15px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
`;

export const ModalButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 600;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #357ae8;
  }
`;

export const ModalCloseButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #ddd;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: 600;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #ccc;
  }
`;

export const ModalErrorMessage = styled.p`
    color: #e74c3c;
    font-size: 14px;
    margin-top: 10px;
    text-align: center;
`;