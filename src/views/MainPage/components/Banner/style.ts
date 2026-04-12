import styled from "@emotion/styled";

export const Container = styled.section`
  width: 100%;
  height: calc((480 / 360) * 100vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #2D478C;
  background-image: url('/images/Welcome.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  position: relative;

  @media (min-width: 58.75rem) {
    height: 480px;
    width: 100%;
    background-size: cover;
  }

  @media (max-width: 768px) {
    height: calc((480 / 360) * 100vw);
    min-height: 300px;
  }
`;
