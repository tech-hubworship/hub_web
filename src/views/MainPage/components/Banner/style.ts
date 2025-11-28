import styled from "@emotion/styled";

export const Container = styled.section`
  width: 100%;
  height: calc((233 / 360) * 100vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #FF1515;
  background-image: url('/images/DtoV.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain; 
  position: relative;

  @media (min-width: 58.75rem) {
    height: 388px;
    width: 100%;
    background-size: contain;
  }

  @media (max-width: 1024px) {
    height: calc((233 / 360) * 100vw);
    min-height: 300px;
  }

  @media (max-width: 768px) {
    height: calc((233 / 360) * 100vw);
    min-height: 250px;
  }
`;

