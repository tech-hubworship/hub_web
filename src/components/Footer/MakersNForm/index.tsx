import { FC, useState, useEffect } from 'react';
import St from './style';

const MakersNForm: FC = () => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isScrollTop, setIsScrollTop] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrollingDown(currentScrollY > lastScrollY);
      setIsScrollTop(currentScrollY === 0);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
