import imgMainPageBanner from '@src/assets/images/img_mainBanner.png';
import MenuButton from './MenuButton';
import * as S from './style';

interface BannerProps {}
export default function Main({}: BannerProps) {
  const onScrollMoveDown = () => {
    const element = document.getElementById('nextContainer');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <S.Container>
        <S.ContentWrapper>
          <S.Content>
            <S.Title>Main</S.Title>
            <MenuButton rout="/">주제소개</MenuButton>
            <MenuButton rout="/">강사소개</MenuButton>
            <MenuButton rout="/">티셔츠구매</MenuButton>
            <MenuButton rout="/">홍보영상</MenuButton>
            <MenuButton rout="/">포스터</MenuButton>
          </S.Content>
        </S.ContentWrapper>
        <S.BannerWrapper>
          <S.BannerGradient />
        </S.BannerWrapper>
      </S.Container>
      <div id="nextContainer" />
    </>
  );
}
