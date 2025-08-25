import styled from '@emotion/styled';
import { colors } from '@sopt-makers/colors';
import Link from 'next/link';
import { css } from '@emotion/react';
import { imgLogoHub } from '@src/assets/mainLogo';
import useHeader from '@src/hooks/useHeader';
import { GrowDown } from '@src/lib/styles/animation';
import { menuTapList } from '../constants/menuTapList';
import { MenuTapType } from '../types';
import { useRouter } from 'next/router';
import { useLoading } from '@src/contexts/LoadingContext';

function DesktopHeader() {
  const { handleClickLogo, handleIsSelected } = useHeader();
  const router = useRouter();
  const { startLoading } = useLoading();

  // 페이지 이동 핸들러
  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    startLoading();
    
    // 약간의 지연 후 페이지 이동
    setTimeout(() => {
      router.push(href);
    }, 100);
  };

  return (
    <>
      <Wrapper>
        <CenterAligner>
          <Logo onClick={handleClickLogo} />
        </CenterAligner>
        <MenuTitlesWrapper>
          {menuTapList.map((menuTap) => (
            <MenuTitle
              as="a"
              href={menuTap.href}
              menuColor={menuTap.type}
              key={menuTap.title}
              isSelected={handleIsSelected(menuTap.href)}
              onClick={(e) => handleNavigate(menuTap.href, e)}
            >
              {menuTap.title}
            </MenuTitle>
          ))}
        </MenuTitlesWrapper>
      </Wrapper>
    </>
  );
}

interface MenuTitleProps {
  isSelected?: boolean;
  isOpened?: boolean;
  menuColor: MenuTapType;
}

export const Wrapper = styled.div`
  max-width: 1200px;
  padding: auto 20px;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

export const SubMenuWrapper = styled.div`
  width: 100%;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.1);
  position: absolute;
  top: 80px;
  ${GrowDown}
  animation: growdown 0.4s forwards;
`;

export const CenterAligner = styled.div`
  display: flex;
  align-items: center;
`;

export const Logo = styled.button`
  width: 87px;
  height: 30px;

  background: url(${imgLogoHub.src}) center no-repeat;
  background-size: 100% 100%;
  cursor: pointer;

  @media (max-width: 58.75rem) {
    width: 63px;
    height: 21px;
  }
`;

export const MenuTitlesWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const MenuTitle = styled(Link)<MenuTitleProps>`
  font-size: 18rem;
  line-height: 36px;
  font-weight: ${({ isSelected }) => (isSelected ? '700' : '500')};

  color: ${colors.white};
  cursor: pointer;
  position: relative;

  padding: 0 20px 0 20px;

  &:hover {
    &::after {
      content: '';
      position: absolute;
      top: calc(16px * 3.5); /* this is bad practice */
      left: 0;
      width: 100%;
      border-bottom: ${({ menuColor }) =>
        menuColor !== 'SPECIAL' ? `2px solid ${colors.white}` : 'none'};
    }
  }

  ${({ menuColor }) =>
    menuColor === 'SPECIAL' &&
    css`
      margin-left: 20px;
      border-radius: 5.869px;
      border: 1.027px solid #4786ff;
      background: rgba(71, 134, 255, 0.28);
      color: #267dff;
    `}
`;

export default DesktopHeader;
