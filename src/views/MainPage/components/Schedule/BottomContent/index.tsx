import * as S from './style';

export default function BottomContent() {
  const handleScrollToFaq = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      // 요소의 위치 구하기
      const rect = faqSection.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top;
      
      // 화면 높이의 20% 정도 위에 위치하도록 스크롤
      const scrollPosition = absoluteTop - window.innerHeight * 0.2;
      
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <S.Container>
      <S.InfoContainer>
        <S.InfoItem onClick={handleScrollToFaq}>
          <S.InfoIcon viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.99995 1.67332C9.93462 1.67332 12.3266 4.06528 12.3266 6.99995C12.3266 9.93462 9.93462 12.3266 6.99995 12.3266C4.06528 12.3266 1.67332 9.93462 1.67332 6.99995C1.67332 4.06528 4.06528 1.67332 6.99995 1.67332ZM6.99995 0.467285C3.39191 0.467285 0.467285 3.39191 0.467285 6.99995C0.467285 10.608 3.39191 13.5326 6.99995 13.5326C10.608 13.5326 13.5326 10.608 13.5326 6.99995C13.5326 3.39191 10.608 0.467285 6.99995 0.467285Z" fill="white"/>
            <path d="M7.603 6.26636H6.39697V10.2865H7.603V6.26636Z" fill="white"/>
            <path d="M6.99986 3.75391C6.5878 3.75391 6.24609 4.08556 6.24609 4.50768C6.24609 4.92979 6.5878 5.26144 6.99986 5.26144C7.41192 5.26144 7.75363 4.91974 7.75363 4.50768C7.75363 4.09561 7.42197 3.75391 6.99986 3.75391Z" fill="white"/>
          </S.InfoIcon>
          <S.InfoText>
          접수 확인 문자를 받지 못했어요!
          </S.InfoText>
        </S.InfoItem>
        <S.InfoItem onClick={handleScrollToFaq}>
          <S.InfoIcon viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.99995 1.67332C9.93462 1.67332 12.3266 4.06528 12.3266 6.99995C12.3266 9.93462 9.93462 12.3266 6.99995 12.3266C4.06528 12.3266 1.67332 9.93462 1.67332 6.99995C1.67332 4.06528 4.06528 1.67332 6.99995 1.67332ZM6.99995 0.467285C3.39191 0.467285 0.467285 3.39191 0.467285 6.99995C0.467285 10.608 3.39191 13.5326 6.99995 13.5326C10.608 13.5326 13.5326 10.608 13.5326 6.99995C13.5326 3.39191 10.608 0.467285 6.99995 0.467285Z" fill="white"/>
            <path d="M7.603 6.26636H6.39697V10.2865H7.603V6.26636Z" fill="white"/>
            <path d="M6.99986 3.75391C6.5878 3.75391 6.24609 4.08556 6.24609 4.50768C6.24609 4.92979 6.5878 5.26144 6.99986 5.26144C7.41192 5.26144 7.75363 4.91974 7.75363 4.50768C7.75363 4.09561 7.42197 3.75391 6.99986 3.75391Z" fill="white"/>
          </S.InfoIcon>
          <S.InfoText>
            차량 시간을 변경하고 싶어요.
          </S.InfoText>
        </S.InfoItem>
      </S.InfoContainer>
    </S.Container>
  );
} 