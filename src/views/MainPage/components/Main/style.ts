import styled from "@emotion/styled";

export const Container = styled.section<{ $anyDayOpen?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 80px;
  align-items: center;
  justify-content: center;
  background-color: #FFFFFF;
  width: 100%;
`;

export const Content = styled.main`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

export const ContentWrapper = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
`;
