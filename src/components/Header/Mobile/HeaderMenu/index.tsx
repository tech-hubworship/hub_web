import Link from 'next/link';
import { useEffect } from 'react';
import { menuTapList } from '../../constants/menuTapList';
import { MenuState } from '../../types';
import * as S from './style';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

function useNoScroll(isMenuShown: MenuState) {
  useEffect(() => {
    if (isMenuShown === 'open') {
      document.body.style.overflow = 'hidden';
    } else {
      return () => {
        document.body.style.overflow = 'auto';
      };
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuShown]);
}

interface HeaderMenuProps {
  isMenuShown: MenuState;
  handleHeaderToggleButton: () => void;
}

function HeaderMenu({ isMenuShown, handleHeaderToggleButton }: HeaderMenuProps) {
  useNoScroll(isMenuShown);
  const router = useRouter();
  const { status } = useSession();

  // 페이지 이동 핸들러
  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    handleHeaderToggleButton(); // 메뉴 닫기
    
    // 약간의 지연 후 페이지 이동
    setTimeout(() => {
      router.push(href);
    }, 100);
  };

  // 간단한 선택 상태 확인 함수
  const handleIsSelected = (href: string) => {
    return router.pathname === href;
  };

  // 메뉴 리스트를 필터링하고 변환
  const displayMenuList = menuTapList
    .filter(menuTap => {
      // auth 속성이 있으면 로그인 상태 확인, 없으면 항상 표시
      if (menuTap.auth) {
        // 로그인하지 않은 경우 "내 정보"를 "로그인"으로 변환하기 위해 포함
        if (menuTap.href === '/myinfo' && status !== 'authenticated') {
          return true; // 로그인 메뉴로 변환하기 위해 포함
        }
        return status === 'authenticated';
      }
      return true;
    })
    .map(menuTap => {
      // 로그인하지 않은 상태에서 "내 정보"를 "로그인"으로 변환
      if (menuTap.href === '/myinfo' && status !== 'authenticated') {
        return {
          ...menuTap,
          title: '로그인',
          href: '/login',
        };
      }
      return menuTap;
    });

  return (
    <S.Root isMenuShown={isMenuShown}>
      <S.MenuWrap>
        <S.ContentsWrap>
          <S.MenuTitlesWrap>
            {displayMenuList.map((menuTap) => (
              <S.MenuTitle
                menuColor={menuTap.type}
                key={menuTap.href}
                isSelected={handleIsSelected(menuTap.href)}
              >
                <a href={menuTap.href} onClick={(e) => handleNavigate(menuTap.href, e)}>
                  {menuTap.title}
                </a>
              </S.MenuTitle>
            ))}
            <S.Background onClick={() => handleHeaderToggleButton()} />
          </S.MenuTitlesWrap>
        </S.ContentsWrap>
      </S.MenuWrap>
    </S.Root>
  );
}

export default HeaderMenu;
