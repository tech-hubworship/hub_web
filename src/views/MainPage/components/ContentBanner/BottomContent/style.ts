import styled from '@emotion/styled';

export const Container = styled.div`
  width: 100%;
  padding: 20px;
`;

export const InfoContainer = styled.div`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

export const InfoItem = styled.div`
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding-bottom: 4px;
  width: fit-content;
`;

export const InfoIcon = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
`;

export const InfoText = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.56px;
  line-height: 20px;
`; 