// 파일 경로: src/components/Header/Desktop/index.tsx

import styled from '@emotion/styled';
import { colors } from '@sopt-makers/colors';
import Link from 'next/link';
import { css } from '@emotion/react';
import { imgLogoHub } from '@src/assets/mainLogo';
import { GrowDown } from '@src/lib/styles/animation';
import { menuTapList } from '../constants/menuTapList';
import { MenuTapType } from '../types';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react'; // ⭐️ 1. useSession을 import 합니다.

function DesktopHeader() {
  const router = useRouter();
  const { data: session, status } = useSession(); // ⭐️ 2. 세션 상태를 가져옵니다.

  const handleClickLogo = () => {
    router.push("/");
  };

  const handleIsSelected = (href: string) => {
    return router.pathname === href;
  };

  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
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
          {menuTapList
            // ⭐️ 3. [핵심] 메뉴 목록을 필터링합니다.
            .filter(menuTap => {
              // auth 속성이 true인 메뉴는, 로그인 상태(authenticated)일 때만 보여줍니다.
              if (menuTap.auth) {
                return status === 'authenticated';
              }
              // auth 속성이 없는 메뉴는 항상 보여줍니다.
              return true;
            })
            .map((menuTap) => (
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
