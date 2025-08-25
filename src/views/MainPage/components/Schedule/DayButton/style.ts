import styled from "@emotion/styled";

export const Box = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Group = styled.div``;

export const OverlapGroup = styled.div`
  position: relative;
  width: auto;
  height: 37px;
`;

export const Rectangle = styled.div`
  width: 100%;
  height: 100%;
  background-color: rgb(0, 0, 0);
`;

export const Text = styled.div`
  position: absolute;
  top: 50%;
  width: auto;
  text-align: center;
  justify-content: center;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: var(--font-wanted);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.56px;
`;
