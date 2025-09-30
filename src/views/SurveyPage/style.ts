// 파일 경로: src/views/SurveyPage/style.ts

import styled from '@emotion/styled';

export const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 20px;
    background-color: #f0f2f5;
`;

export const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: left;
`;
export const Card = styled.div`
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 500px;
    text-align: center;
`;

export const Title = styled.h2`
    margin-bottom: 20rem;
    font-size: 20rem;
    color: #333;
`;

export const InputGroup = styled.div`
    width: 100%;
    margin-bottom: 1.5rem;
`;

export const Input = styled.input`
    width: 100%;
    padding: 12px;
    font-size: 15rem;
    border: 1px solid #ddd;
    border-radius: 8px;
`;

export const Textarea = styled.textarea`
    width: 100%;
    min-height: 120px;
    padding: 12px;
    font-size: 20rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    resize: vertical;
`;

export const ButtonWrapper = styled.div`
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
`;

const BaseButton = styled.button`
    flex: 1;
    padding: 12px;
    font-size: 15rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px;
    border: none;
    transition: all 0.2s;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const StepButton = styled(BaseButton)`
    background: #f0f0f0;
    border: 1px solid #ddd;
    color: #333;

    &:hover:not(:disabled) {
        background: #e0e0e0;
    }
`;

export const SubmitButton = styled(BaseButton)`
    background: #007bff;
    color: white;

    &:hover:not(:disabled) {
        background: #0056b3;
    }
`;

export const ErrorMessage = styled.p`
    color: #e74c3c;
    margin-top: 1rem;
`;