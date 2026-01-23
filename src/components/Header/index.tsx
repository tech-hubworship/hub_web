/**
 * Header 컴포넌트
 * 
 * HUB Worship 웹사이트의 상단 네비게이션 헤더입니다.
 * - 반응형 디자인 (모바일 우선)
 * - 홈페이지에서 스크롤 시 투명도 변경 효과
 * - 로고 클릭 시 홈페이지 이동
 * - 모바일 햄버거 메뉴 상태 관리
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { usePathname } from "next/navigation";
import MobileHeader from "./Mobile";
import DesktopMenu from "./Desktop";
import { imgLogoHub } from "@src/assets/mainLogo";
import * as S from "./style";
import { MenuState } from "./types";

/**
 * Header 컴포넌트
 * 
 * 메인 네비게이션 헤더를 렌더링합니다.
 * 홈페이지에서만 스크롤 기반 투명도 효과가 적용됩니다.
 */
export function Header() {
  const pathname = usePathname();
  const isRootPath = pathname === "/"; // 홈페이지 여부 확인

  // 스크롤 기반 투명도 상태
  const [opacity, setOpacity] = useState(0);
  // 모바일 메뉴 열림/닫힘 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * 홈페이지에서 스크롤 기반 투명도 효과
   * 특정 스크롤 구간에서 헤더가 점진적으로 나타나도록 구현
   */
  useEffect(() => {
    if (!isRootPath) return; // 홈페이지가 아니면 효과 적용하지 않음

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // 반응형 계산: 화면 너비 기반으로 시작/끝 지점 계산
      const start = window.innerWidth * (233 / 360) * 0.8;
      const end = window.innerWidth * (233 / 360) - 60;

      if (scrollY <= start) {
        setOpacity(0); // 투명
      } else if (scrollY >= end) {
        setOpacity(1); // 완전 불투명
      } else {
        // 시작과 끝 사이에서 점진적 변화
        const ratio = (scrollY - start) / (end - start);
        setOpacity(ratio);
      }
    };

    handleScroll(); // 초기값 반영
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isRootPath]);

  /**
   * 모바일 메뉴 상태 변경 핸들러
   * @param state 메뉴 상태 ('open' | 'closed')
   */
  const handleMenuStateChange = (state: MenuState) => {
    setIsMenuOpen(state === "open");
  };

  /**
   * 로고 클릭 핸들러
   * 홈페이지가 아닌 경우에만 홈으로 이동
   */
  const handleLogoClick = () => {
    if (pathname !== "/") {
      setTimeout(() => {
        // pages/app router 공용: 라우터 컨텍스트에 의존하지 않고 이동
        window.location.href = "/";
      }, 100);
    }
  };

  return (
    <S.Wrapper opacity={1} isMenuOpen={isMenuOpen}>
      {/* 로고 - 클릭 시 홈페이지로 이동 */}
      <Logo
        onClick={handleLogoClick}
        opacity={1}
      />

      {/* 데스크톱 헤더 메뉴 - 우측 끝 */}
      <DesktopMenuWrapper>
        <DesktopMenu />
      </DesktopMenuWrapper>

      {/* 모바일 헤더 메뉴 - 우측 끝 */}
      <MobileMenuWrapper>
      <MobileHeader onMenuStateChange={handleMenuStateChange} />
      </MobileMenuWrapper>
    </S.Wrapper>
  );
}
/**
 * Logo 컴포넌트
 * 
 * HUB 로고를 표시하는 클릭 가능한 버튼입니다.
 * 투명도 애니메이션을 지원합니다.
 * 
 * @param opacity 로고의 투명도 (0-1)
 */
export const Logo = styled.button<{ opacity: number }>`
  width: 168.03px;
  height: 14.69px;
  margin-left: 0;
  background: url(${imgLogoHub.src}) center no-repeat;
  background-size: 100% 100%;
  cursor: pointer;
  opacity: ${({ opacity }) => opacity};
  transition: opacity 0.3s ease;

  @media (min-width: 58.75rem) {
    width: 240px;
    height: 21px;
  }

  @media (max-width: 47.9375rem) {
    width: 160px;
    height: 14px;
    margin-left: 8px;
  }
`;

const DesktopMenuWrapper = styled.div`
  display: none;
  margin-right: 20px;

  @media (min-width: 58.75rem) {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
  }
`;

const MobileMenuWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  margin-right: 0;

  @media (max-width: 47.9375rem) {
    margin-right: 8px;
  }

  @media (min-width: 58.75rem) {
    display: none;
  }
`;
