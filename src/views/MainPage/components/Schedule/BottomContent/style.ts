import styled from '@emotion/styled';

export const Container = styled.div`
  width: 100%;
  padding: 40px;
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
  align-items: center;
  gap: 4px;
  padding-bottom: 4px;
  width: fit-content;
  border-bottom: 1px solid rgb(255, 255, 255);
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

export const InfoIcon = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: block;
`;

export const InfoText = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.28px;
  font-family: var(--font-wanted);
  line-height: 1.2;
`; 