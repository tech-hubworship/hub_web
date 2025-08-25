import styled from '@emotion/styled';

export const Container = styled.div`
  max-width: 100%;
  padding: 40px 20px;
  background-color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  margin-top: 60px;
  
  @media (min-width: 768px) {
    max-width: 375px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
  color: #000;
`;

export const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
  text-align: center;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
`;

export const Required = styled.span`
  color: #e23d3d;
  margin-left: 4px;
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 16px;
  outline: none;
  
  &:focus {
    border-color: #000;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

export const PasswordHint = styled.p`
  font-size: 12px;
  color: #777;
  margin-top: -12px;
  margin-bottom: 16px;
`;

export const ErrorMessage = styled.div`
  width: 100%;
  padding: 12px;
  background-color: #fff5f5;
  border: 1px solid #f8d7d7;
  border-radius: 8px;
  color: #e23d3d;
  font-size: 14px;
  margin-bottom: 16px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
`;

export const Button = styled.button`
  width: 100%;
  height: 48px;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #333;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const LinkButton = styled.button`
  background: none;
  border: none;
  color: #555;
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: #000;
  }
`; 