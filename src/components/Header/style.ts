import styled from "@emotion/styled";

export const Wrapper = styled.header<{ opacity: number; isMenuOpen?: boolean }>`
  width: 100%;
  min-height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  padding: 0 40px;

  background-color: ${({ opacity, isMenuOpen }) => 
    isMenuOpen ? 'rgba(255, 255, 255, 1)' : `rgba(255, 255, 255, ${opacity})`};
  backdrop-filter: blur(${({ opacity }) => opacity * 5}px);
  transition: background-color 0.2s ease, backdrop-filter 0.2s ease;

  @media (min-width: 58.75rem) {
    height: 80px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 58.75rem) and (min-width: 48rem) {
    height: 60px;
    padding: 0 20px;
  }

  @media (max-width: 47.9375rem) {
    height: 60px;
    min-height: 60px;
    padding: 0 16px;
  }
`;
