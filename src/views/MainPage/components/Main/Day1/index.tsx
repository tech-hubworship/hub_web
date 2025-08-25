import { useState, useEffect } from "react";
import * as S from "./style";

interface CollapseLiProps {
  onToggle?: (isOpen: boolean) => void;
}

function CollapseLi({ onToggle }: CollapseLiProps) {
  const [isOpened, setIsOpened] = useState(false);

  const handleClick = () => {
    const newState = !isOpened;
    setIsOpened(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };
  
  // 컴포넌트가 언마운트될 때 닫힘 상태로 알림
  useEffect(() => {
    return () => {
      if (onToggle && isOpened) {
        onToggle(false);
      }
    };
  }, [onToggle, isOpened]);

  return (
    <S.Root>
      <S.Section onClick={handleClick}>
        <S.TItle>Day 1</S.TItle>
        <S.Button isOpened={isOpened} />
      </S.Section>
      <S.Contents isOpened={isOpened}>
        <S.Essence>
          <S.Tag>Essence 1</S.Tag>
          <S.EssenceTitle>
            <S.FirstWord>Solus</S.FirstWord>{" "}
            <S.SecondWord>Christus</S.SecondWord>
          </S.EssenceTitle>
          <S.EssenceContents>
            <S.Speaker>최성민 목사</S.Speaker>
            <S.Group>SNS 청년부</S.Group>
          </S.EssenceContents>
        </S.Essence>
      </S.Contents>
    </S.Root>
  );
}

export default CollapseLi;
