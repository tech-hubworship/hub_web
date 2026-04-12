import styled from "@emotion/styled";

export const Container = styled.section`
  width: 100%;
  aspect-ratio: 1080 / 480;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #2D478C;
  background-image: url('/images/Welcome.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  position: relative;

  @media (max-width: 768px) {
    aspect-ratio: 1080 / 480;
    min-height: 180px;
  }
`;
