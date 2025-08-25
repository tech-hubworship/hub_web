import styled from '@emotion/styled';
import { SerializedStyles } from '@emotion/react';
import { PropsWithChildren } from 'react';

export function Layout({
  children,
  moreStyle,
}: PropsWithChildren<{ moreStyle?: SerializedStyles }>) {
  return (
    <MainWrapper>
      <Main css={moreStyle}>{children}</Main>
    </MainWrapper>
  );
}

const MainWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const Main = styled.div<{ moreStyle?: SerializedStyles }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 940px;
  min-height: 100vh;
  background-color: #fff;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  @media (min-width: 58.75rem) {
    max-width: 600px;
  }
`;
