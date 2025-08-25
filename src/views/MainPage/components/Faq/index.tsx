import * as S from "./style";
import { Box } from "./TopTitle";
import { Label } from "./Label";
import RulesList from "./FaqList";

interface BannerProps {}
export default function Faq({}: BannerProps) {
  const onScrollMoveDown = () => {
    const element = document.getElementById("nextContainer");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <S.Container id="faq-section">
        <S.ContentWrapper>
          <S.Content>
            <Label />
            <RulesList/>
          </S.Content>
        </S.ContentWrapper>
      </S.Container>
      <div id="nextContainer" />
    </>
  );
}
