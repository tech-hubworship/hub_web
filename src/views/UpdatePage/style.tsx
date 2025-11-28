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

export const InfoText = styled.div`
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
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
  background-color: white;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }
`;

export const InfoCard = styled.div`
  width: 100%;
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
`;

export const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

export const InfoLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
`;

export const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
`;

export const WarningText = styled.div`
  color: #f59e0b;
  font-size: 14px;
  text-align: center;
  padding: 12px;
  background: #fef3c7;
  border-radius: 6px;
  margin-top: 16px;
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


