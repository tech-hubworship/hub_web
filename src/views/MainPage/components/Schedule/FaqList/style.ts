import styled from "@emotion/styled";

export const Ul = styled.ul`
  margin-top: 30px;
  font-family: var(--font-wanted);
  li {
    &:last-child {
      border: none;
    }
  }
  @media screen and (max-width: 80rem) {
    margin-top: 31px;
  }
  
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 550px;
    margin-top: 30px;
  }
`;
