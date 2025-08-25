import styled from "@emotion/styled";

export const Container = styled.section<{ $anyDayOpen?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 52px;
  /* min-height: ${props => props.$anyDayOpen ? '100vh' : '66vh'}; */
  transition: height 0.3s ease, min-height 0.3s ease;
  align-items: center;
  background-color: #000000;

  @media (min-width: 58.75rem) {
    width: 100%;
    background-color: #000000;
    /* min-height: ${props => props.$anyDayOpen ? '100vh' : '66vh'}; */
  }
`;

export const Content = styled.main`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  height: 100%;
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
  justify-content: center;
  width: 100vw;
  position: relative;

  @media (min-width: 58.75rem) {
    width: 600px;
    padding-left: 0;
    padding-right: 0;
  }

  @media (max-width: 90rem) {
  }


`;
