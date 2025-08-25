import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { usePathname } from "next/navigation";
import { useIsDesktop, useIsMobile, useIsTablet } from "@src/hooks/useDevice";
import MobileHeader from "./Mobile";
import { imgLogoHub } from "@src/assets/mainLogo";
import { useRouter } from "next/router";
import * as S from "./style";
import { MenuState } from "./types";
import { useLoading } from "@src/contexts/LoadingContext";

export function Header() {
  const pathname = usePathname();
  const isRootPath = pathname === "/";
  const isDesktop = useIsDesktop("58.75rem");
  const isTablet = useIsTablet("48rem", "58.6875rem");
  const isMobile = useIsMobile();
  const router = useRouter();
  const { startLoading } = useLoading();

  const [opacity, setOpacity] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isRootPath) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const start = window.innerWidth * (233 / 360)*0.8;
      const end = window.innerWidth * (233 / 360)-60;

      if (scrollY <= start) {
        setOpacity(0);
      } else if (scrollY >= end) {
        setOpacity(1);
      } else {
        const ratio = (scrollY - start) / (end - start);
        setOpacity(ratio);
      }
    };

    handleScroll(); // 초기값 반영
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isRootPath]);

  // 메뉴 상태 변경 핸들러
  const handleMenuStateChange = (state: MenuState) => {
    setIsMenuOpen(state === "open");
  };

  // 로고 클릭 핸들러
  const handleLogoClick = () => {
    if (pathname !== "/") {
      startLoading();
      setTimeout(() => {
        router.push("/");
      }, 100);
    }
  };

  return (
    <S.Wrapper opacity={isRootPath ? opacity : 1} isMenuOpen={isMenuOpen}>
      <Logo
        onClick={handleLogoClick}
        opacity={isRootPath ? opacity : 1}
      />

      {/* {isDesktop && <DesktopHeader />}
      {(isTablet || isMobile) && <MobileHeader />} */}
      <MobileHeader onMenuStateChange={handleMenuStateChange} />
    </S.Wrapper>
  );
}
export const Logo = styled.button<{ opacity: number }>`
  width: 168.03px;
  height: 14.69px;
  margin-left: 20px;
  background: url(${imgLogoHub.src}) center no-repeat;
  background-size: 100% 100%;
  cursor: pointer;
  opacity: ${({ opacity }) => opacity};
  transition: opacity 0.3s ease;
`;
