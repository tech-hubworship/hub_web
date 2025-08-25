import * as S from "./style";
import { useRouter } from "next/router";
import { usePageTransition } from '@src/hooks/usePageTransition';

export default function TshirtsBanner() {
  const { navigateTo } = usePageTransition();

  const handleTshirtOrder = () => {
    navigateTo("/tshirt", { delay: 800 });
  };

  return (
    <>
      <S.Container />
      <S.ButtonContainer>
        <S.Button onClick={handleTshirtOrder}>
          <S.ButtonText>티셔츠 구매하기 →</S.ButtonText>
        </S.Button>
      </S.ButtonContainer>
    </>
  );
}
