import imgMainPageBanner from '@src/assets/images/img_mainBanner.png';
import RecruitButton from './RecruitButton';
import * as S from './style';

interface BannerProps {
  mainColor: string;
  highColor: string;
}
export default function Banner({ mainColor, highColor }: BannerProps) {
  const onScrollMoveDown = () => {
    const element = document.getElementById('nextContainer');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <S.Container>
        <S.ContentWrapper>
          <S.Content>
            <S.Title>ESSENCE</S.Title>
            <RecruitButton mainColor={mainColor} highColor={highColor}>
              HUBCOMMUNITY
            </RecruitButton>
          </S.Content>
          <S.DownScrollIcon onClick={onScrollMoveDown} />
        </S.ContentWrapper>
        <S.BannerWrapper>
          <S.BannerGradient />
        </S.BannerWrapper>
      </S.Container>
      <div id="nextContainer" />
    </>
  );
}
