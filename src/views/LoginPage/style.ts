import styled from "@emotion/styled";

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 87px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #FFFFFF;
  position: relative;
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
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 22px;
  white-space: pre-line;
  line-height: 37px;
  letter-spacing: -0.56px;
  color: #000000;
`;

export const Form = styled.form`
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #D7D7D7;
  border-radius: 4px;
  font-size: 16px;
  font-family: var(--font-wanted);
  font-weight: 600;
  color: #000000;

  &::placeholder {
    color: #A1A1A1;
  }

  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

export const LoginProblem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #FFF5F5;
  border-radius: 4px;
  margin-top: 8px;
`;

export const InfoIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFE3E3;
  color: #FF6B6B;
  font-size: 12px;
`;

export const LoginProblemText = styled.span`
  font-size: 14px;
  color: #FF6B6B;
  line-height: 1.5;
`;

export const LoginButton = styled.button`
  width: 100%;
  padding: 15px 0;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 24px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #333;
  }
`;

export const ErrorMessage = styled.div`
  color: #FF0000;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

export const HelpContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
  width: 100%;
`;

export const HelpLink = styled.a`
  display: flex;
  align-items: center;
  color: #000000;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px solid #000000;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  svg {
    margin-right: 6px;
  }
`;

export const TshirtSignupContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
`;

export const TshirtSignupText = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

export const TshirtSignupLink = styled.a`
  font-size: 16px;
  font-weight: 600;
  color: #000;
  text-decoration: none;
  transition: color 0.2s;
  text-decoration: underline;
  
  
  &:hover {
    color:rgb(78, 78, 78);
    text-decoration: underline;
  }
`; 