import React from 'react';
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
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

export const Card = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 500px;
  padding: 40px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.5s ease;
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 12px;
  color: #111;
  line-height: 1.4;
`;

export const InputGroup = styled.div`
  width: 100%;
  margin-bottom: 1rem;
  text-align: left;
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

export const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

export const CancelButton = styled.button`
  width: 100%;
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
  width: 100%;
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

export const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
  width: 100%;
  text-align: left;
`;

interface StepComponentProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  nextDisabled?: boolean;
  finalStep?: boolean;
  loading?: boolean;
}

export const StepComponent: React.FC<StepComponentProps> = ({
  title,
  children,
  onBack,
  onNext,
  onSubmit,
  nextDisabled = false,
  finalStep = false,
  loading = false,
}) => (
  <>
    <Title>{title}</Title>
    <InputGroup>{children}</InputGroup>
    <ButtonWrapper>
      {onBack && <CancelButton onClick={onBack}>이전</CancelButton>}
      {finalStep ? (
        <SubmitButton onClick={onSubmit} disabled={nextDisabled || loading}>
          {loading ? '업데이트 중...' : '업데이트 완료'}
        </SubmitButton>
      ) : (
        <SubmitButton onClick={onNext} disabled={nextDisabled}>
          다음
        </SubmitButton>
      )}
    </ButtonWrapper>
  </>
);


