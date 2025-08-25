import styled from "@emotion/styled";

export const Root = styled.div<{ isClosed: boolean }>`
  border-bottom: 1px solid
    ${({ isClosed }) => (isClosed ? "#FFFFFF" : "#ffffff")};
  width: 80vw;
  padding-top: 20px;
  padding-bottom: 13px;
  font-family: var(--font-wanted);
  

  
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 550px;
    padding-top: 20px;
    padding-bottom: 13px;
  }
`;

export const Section = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  cursor: pointer;
  width: 100%;


    padding-top: 13px;

  
  @media (min-width: 58.75rem) {
    padding-top: 13px;
  }
`;

export const Title = styled.h3<{ isClosed: boolean }>`
  color: ${({ isClosed }) => (isClosed ? "#888888" : "#ffffff")};
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-wanted);
  letter-spacing: -0.56px;
  line-height: normal;
  white-space: nowrap;
`;

export const Status = styled.span<{ isClosed: boolean }>`
  color: ${({ isClosed }) => (isClosed ? "#888888" : "#888888")};
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-wanted);
  letter-spacing: -0.56px;
`;

export const Contents = styled.div<{ isClosed: boolean }>`
  color: ${({ isClosed }) => (isClosed ? "#888888" : "#ffffff")};
  font-size: 20px;
  font-weight: 400;
  font-family: var(--font-wanted);
  letter-spacing: -0.56px;
`;
export const Icon = styled.svg`
  width: 16px;
  height: 16px;
  margin-right: 2px;
`;
export const Rectangle = styled.div<{
  isClosed: boolean;
  isLong: boolean;
}>`
  background-color: ${({ isClosed }) => (isClosed ? "#888888" : "#ED2725")};
  width: ${({ isLong }) => (isLong ? "92px" : "60px")};
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DateBadge = styled.span<{ isClosed: boolean }>`
  color: ${({ isClosed }) => (isClosed ? "#000000" : "#ffffff")};
  font-weight: 700;
  font-family: var(--font-wanted);
  letter-spacing: -0.56px;
  font-size: 16px;
  white-space: nowrap;
`;

export const DaySection = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
`;
