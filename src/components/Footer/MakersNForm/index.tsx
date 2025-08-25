import { FC } from 'react';
import useScrollPosition from '@src/hooks/useScrollPosition';
import St from './style';

const MakersNForm: FC = () => {
  const { isScrollingDown, isScrollTop } = useScrollPosition();

  const handleClickKakao = () => {
    // window.Kakao.Channel.chat({
    //   channelPublicId: '_sxaIWG',
    // });
  };

  return (
    <St.FooterForm hide={isScrollingDown && !isScrollTop}>
      <St.FooterLink
        href="https://www.youtube.com/@hub_worship"
        target="_blank"
        rel="noopener noreferrer"
      >
        유튜브
      </St.FooterLink>
      <St.FooterButton type="button" onClick={handleClickKakao}>
        의견 제안하기
      </St.FooterButton>
    </St.FooterForm>
  );
};

export default MakersNForm;
