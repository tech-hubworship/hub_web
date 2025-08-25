import styled from "@emotion/styled";

export const LabelWrapper = styled.div`
  width: 233px;
  height: 111px;
  
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 350px;
  }
`;

export const LabelText = styled.p`
  color: #000000;
  font-size: 28px;
  font-weight: 700;
  line-height: 37px;
  letter-spacing: -0.56px;
  text-align: center;
  white-space: pre-line; /* 줄바꿈 지원 */
`;
