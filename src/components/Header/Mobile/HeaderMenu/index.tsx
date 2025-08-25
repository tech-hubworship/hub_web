import Link from 'next/link';
import { useEffect } from 'react';
import useHeader from '@src/hooks/useHeader';
import { menuTapList } from '../../constants/menuTapList';
import { MenuState } from '../../types';
import * as S from './style';
import { useRouter } from 'next/router';
import { useLoading } from '@src/contexts/LoadingContext';

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
  const { startLoading } = useLoading();
  const { handleIsSelected } = useHeader();

  // 페이지 이동 핸들러
  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    startLoading();
    handleHeaderToggleButton(); // 메뉴 닫기
    
    // 약간의 지연 후 페이지 이동
    setTimeout(() => {
      router.push(href);
    }, 100);
  };

  return (
    <S.Root isMenuShown={isMenuShown}>
      <S.MenuWrap>
        <S.ContentsWrap>
          <S.MenuTitlesWrap>
            {menuTapList.map((menuTap) => (
              <S.MenuTitle
                menuColor={menuTap.type}
                key={menuTap.title}
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
