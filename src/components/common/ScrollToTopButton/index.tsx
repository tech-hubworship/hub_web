import { useEffect, useState, useCallback } from "react";
import UpArrow from "@src/assets/icons/ic_up_arrow.svg";
import * as S from "./style";

const SCROLL_MINIMUM_VALUE = 120;

export default function ScrollToTopButton() {
  const [isScrolled, setIsScrolled] = useState(false);

  const checkScroll = useCallback(() => {
    window.scrollY > SCROLL_MINIMUM_VALUE
      ? setIsScrolled(true)
      : setIsScrolled(false);
  }, []);

  const handleUpBtnClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
    };
  }, [checkScroll]);

  return (
    <>
      {isScrolled && (
        <S.Wrapper onClick={handleUpBtnClick}>
          <S.Text>UP</S.Text>
          <UpArrow />
        </S.Wrapper>
      )}
    </>
  );
}
