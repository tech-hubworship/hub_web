import styled from "@emotion/styled";

export const Container = styled.section`
  width: 100%;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  box-sizing: border-box;
`;

export const Content = styled.main`
  max-width: 480px;
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
`;

export const ContentWrapper = styled.article`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/* 허브영상 보러가기 - #E3E3E3 배경, #171E39 텍스트 */
export const ButtonContainer1 = styled.section`
  width: 100%;
  max-width: 320px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #E3E3E3;
  border-radius: 16px;
  margin-bottom: 0;
`;

/* 허브 콘텐츠 보러가기 - #2D478C 배경, 흰색 텍스트 */
export const ButtonContainer = styled.section`
  width: 100%;
  max-width: 320px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2D478C;
  border-radius: 16px;
`;

export const Button = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
`;

export const ButtonText = styled.span`
  font-family: 'Wanted Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.04em;
`;
