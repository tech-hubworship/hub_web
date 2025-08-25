import styled from "@emotion/styled";
import { colors } from "@sopt-makers/colors";
import Image from "next/image";
import IcDownScroll from "@src/assets/icons/ic_downScroll.svg";

export const Container = styled.section<{ $anyFaqOpen?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: ${props => props.$anyFaqOpen ? '100vh' : 'calc( 350 / 360 * 100vw)'}; /* 기본 높이는 유지하되, 더 늘어날 수 있음 */
  transition: height 0.3s ease, min-height 0.3s ease;
  align-items: center;
  background-color: #f5f5f5;
  font-family: var(--font-wanted);
  
  @media (min-width: 768px) {
    min-height: ${props => props.$anyFaqOpen ? '100vh' : '500px'};
  }
  
  @media (min-width: 58.75rem) {
    width: 100%;
    min-height: ${props => props.$anyFaqOpen ? '100vh' : '500px'};
  }
`;

export const Content = styled.main`
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-bottom: 48px;
  font-family: var(--font-wanted);
  width: 100%;
   
  @media (min-width: 768px) {
    max-width: 1200px;
  }
   
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 600px;
  }
`;
 
export const ContentWrapper = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  position: relative;
  z-index: 2;
  padding-bottom: 5px;
  padding-top: 50px;
  font-family: var(--font-wanted);
 
  @media (min-width: 768px) {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding-left: 20px;
    padding-right: 20px;
  }
   
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 600px;
    padding-left: 20px;
    padding-right: 20px;
  }
   
  @media (min-width: 1200px) {
    padding-left: 0;
    padding-right: 0;
  }
`;