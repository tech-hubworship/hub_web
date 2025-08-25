import styled from "@emotion/styled";
import { colors } from "@sopt-makers/colors";
import { useState, useEffect } from "react";
import MenuBar from "@src/assets/icons/menuBar.svg";
import XButton from "@src/assets/icons/x_button.svg";

import { Condition } from "@src/components/common/Condition";
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
        {/* <ToggleButton onClick={handleHeaderToggleButton}>
          {isMenuShown === "open" ? (
            <XButton width="30px" height="30px" />
          ) : (
            <MenuBar width="18px" height="14px" />
          )}
        </ToggleButton> */}
        {/* <RecruitButton /> */}
      </StyledHeader>
      <Condition statement={isMenuShown === "open"}>
        <HeaderMenu
          isMenuShown={isMenuShown}
          handleHeaderToggleButton={handleHeaderToggleButton}
        />
      </Condition>
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
  padding: 0 20px;
  height: 100%;
  transition: background-color 0.6s;
`;

export const ToggleButton = styled.button`
  position: relative;
  width: 18px;
  height: 14px;
  cursor: pointer;
  align-items: center;
  display: flex;
  justify-content: center;
`;

export default MobileHeader;
