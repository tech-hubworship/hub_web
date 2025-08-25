import * as S from "./style";

import { Label } from "./Label";

import  BottomContent  from "./BottomContent";
interface BannerProps {}
export default function ContentBanner({}: BannerProps) {
  const onScrollMoveDown = () => {
    const element = document.getElementById("nextContainer");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openYouTube = () => {
    window.open("https://youtu.be/qM1fzUjcs20", "_blank");
  };

  const openInstagram = () => {
    window.open("https://www.instagram.com/hub_worship/", "_blank");
  };

  return (
    <>
      <S.Container>
        <S.ContentWrapper>
          <S.Content>
            <Label />
            <S.ButtonContainer1>
              <S.Button onClick={openYouTube}>
                <S.ButtonText>
                허브영상 보러가기 →
                </S.ButtonText>
              </S.Button>
            </S.ButtonContainer1>
            <S.ButtonContainer>
              <S.Button onClick={openInstagram}>
                <S.ButtonText>
                허브 콘텐츠 보러가기 →
                </S.ButtonText>
              </S.Button>
            </S.ButtonContainer>

            {/* <BottomContent /> */}
          </S.Content>
        </S.ContentWrapper>
      </S.Container>
      <div id="nextContainer" />
    </>
  );
}
