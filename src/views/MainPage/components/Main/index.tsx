import * as S from "./style";
import { Box } from "./TopTitle";
import { Label } from "./Label";
import Day1 from "./Day1";
import Day2 from "./Day2";
import Day3 from "./Day3";
import { useState, useEffect } from "react";

interface BannerProps {}
export default function Main({}: BannerProps) {
  const [day1Open, setDay1Open] = useState(false);
  const [day2Open, setDay2Open] = useState(false);
  const [day3Open, setDay3Open] = useState(false);
  
  const onScrollMoveDown = () => {
    const element = document.getElementById("nextContainer");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  
  // 상태 변경 콜백 함수
  const handleDay1Toggle = (isOpen: boolean) => {
    setDay1Open(isOpen);
  };
  
  const handleDay2Toggle = (isOpen: boolean) => {
    setDay2Open(isOpen);
  };
  
  const handleDay3Toggle = (isOpen: boolean) => {
    setDay3Open(isOpen);
  };

  return (
    <>
      <S.Container $anyDayOpen={day1Open || day2Open || day3Open}>
        <S.ContentWrapper>
          <S.Content>
            <Box />
            {/* <Label />
            <Day1 onToggle={handleDay1Toggle} />
            <Day2 onToggle={handleDay2Toggle} />
            <Day3 onToggle={handleDay3Toggle} /> */}
          </S.Content>
        </S.ContentWrapper>
      </S.Container>
      <div id="nextContainer" />
    </>
  );
}
