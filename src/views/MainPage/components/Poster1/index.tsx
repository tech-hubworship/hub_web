/**
 * Poster1 컴포넌트
 * 
 * 첫 번째 포스터를 전체화면으로 표시하는 컴포넌트입니다.
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import styled from '@emotion/styled';

const Container = styled.section`
  width: 100%;
  height: calc((3367 / 2381) * 100vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: url('/images/poster1.webp');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  position: relative;

  @media (min-width: 58.75rem) {
    height: calc((3367 / 2381) * 100vw);
    width: 100%;
    max-width: none;
    background-size: contain;
  }
`;

const Poster1 = () => {
  return <Container />;
};

export default Poster1;
