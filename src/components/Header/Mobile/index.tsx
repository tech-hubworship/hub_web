import styled from "@emotion/styled";
import { colors } from "@sopt-makers/colors";
import { useState, useEffect } from "react";
import MenuBarIcon from "@src/assets/icons/menuBar.svg";
import XButtonIcon from "@src/assets/icons/x_button.svg";

import { MenuState } from "../types";
import HeaderMenu from "./HeaderMenu";
import RecruitButton from "./RecruitButton";

interface MobileHeaderProps {
  onMenuStateChange?: (state: MenuState) => void;
}

function MobileHeader({ onMenuStateChange }: MobileHeaderProps) {
  const [isMenuShown, setIsMenuShown] = useState<MenuState>("idle");

  // 메뉴 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onMenuStateChange?.(isMenuShown);
  }, [isMenuShown, onMenuStateChange]);

  const handleHeaderToggleButton = () => {
    setIsMenuShown((prev) => (prev === "open" ? "close" : "open"));
  };

  return (
    <>
      <StyledHeader isMenuShown={isMenuShown === "open"}>
        <ToggleButton onClick={handleHeaderToggleButton}>
          {isMenuShown === "open" ? (
            <XButtonIcon width="24" height="24" />
          ) : (
            <MenuBarIcon width="24" height="24" />
          )}
        </ToggleButton>
        {/* <RecruitButton /> */}
      </StyledHeader>
      {isMenuShown === "open" && (
        <HeaderMenu
          isMenuShown={isMenuShown}
          handleHeaderToggleButton={handleHeaderToggleButton}
        />
      )}
    </>
  );
}

export const StyledHeader = styled.div<{ isMenuShown: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  z-index: 10;
  background-color: ${({ isMenuShown }) => (isMenuShown ? "#FFFFFF" : "")};
  padding: 0;
  height: 100%;
  transition: background-color 0.6s;
`;

export const ToggleButton = styled.button`
  position: relative;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  cursor: pointer;
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
`;

export default MobileHeader;
