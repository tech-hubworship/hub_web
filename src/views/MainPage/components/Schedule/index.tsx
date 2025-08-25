import * as S from "./style";
import { Box } from "./TopTitle";
import { Label } from "./Label";
import RulesList from "./FaqList";
import BottomContent from "./BottomContent";
import { useState } from "react";

interface BannerProps {}

export default function Schedule({}: BannerProps) {
  const [anyFaqOpen, setAnyFaqOpen] = useState(false);
  
  const onScrollMoveDown = () => {
    const element = document.getElementById("nextContainer");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  
  // FAQ 열림 상태 변경 처리
  const handleAnyFaqToggle = (isOpen: boolean) => {
    setAnyFaqOpen(isOpen);
  };

  return (
    <>
      <S.Container $anyFaqOpen={anyFaqOpen}>
        <S.ContentWrapper>
          <S.Content>
            <Box />
            <Label />
            <RulesList onAnyFaqToggle={handleAnyFaqToggle} />
            <BottomContent />
          </S.Content>
        </S.ContentWrapper>
      </S.Container>
      <div id="nextContainer" />
    </>
  );
}
