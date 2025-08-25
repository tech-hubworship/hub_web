import styled from "@emotion/styled";

export const Container = styled.section<{ $anyDayOpen?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: ${props => props.$anyDayOpen ? '100vh' : '66vh'};
  transition: height 0.3s ease, min-height 0.3s ease;
  align-items: center;
  background-color: #f5f5f5;

  @media (min-width: 58.75rem) {
    width: 100%;
    background-color: #f5f5f5;
    min-height: ${props => props.$anyDayOpen ? '100vh' : '66vh'};
  }
`;

export const Content = styled.main`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;

  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 600px;
  }
`;

export const ContentWrapper = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  position: relative;
  z-index: 2;
  padding-bottom: 5px;
  padding-top: 50px;
  // justify-content: center;

  @media (min-width: 58.75rem) {
    width: 600px;
    padding-left: 0;
    padding-right: 0;
  }

  @media (max-width: 90rem) {
  }

  @media (max-width: 48rem) {
  }
`; 