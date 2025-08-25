import React, { useState, useEffect } from "react";
import {
  Root,
  Section,
  TItle,
  Button,
  Contents,
  Essence,
  EssenceLast,
  Tag,
  EssenceTitle,
  EssenceContents,
  Speaker,
  Group,
  FirstWord,
  SecondWord,
} from "./style";

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
  
  // 컴포넌트가 언마운트될 때 닫힘 상태로.알림
  useEffect(() => {
    return () => {
      if (onToggle && isOpened) {
        onToggle(false);
      }
    };
  }, [onToggle, isOpened]);

  return (
    <Root>
      <Section onClick={handleClick}>
        <TItle>Day 3</TItle>
        <Button isOpened={isOpened} />
      </Section>
      <Contents isOpened={isOpened}>
        <Essence>
          <Tag>Essence 6</Tag>
          <EssenceTitle>
            <FirstWord>Sola </FirstWord>
            <SecondWord>Gratia</SecondWord>
          </EssenceTitle>
          <EssenceContents>
            <Speaker>최종현 목사</Speaker>
            <Group>前 온누리교회 부목사 現 OSOM 35기 훈련생</Group>
          </EssenceContents>
        </Essence>


        <EssenceLast>
          <Tag>Essence 7</Tag>
          <EssenceTitle>
            <FirstWord>Soli </FirstWord>
            <SecondWord>Deo Gloria</SecondWord>
          </EssenceTitle>
          <EssenceContents>
            <Speaker>최대흥 목사</Speaker>
            <Group>요셉 청년부</Group>
          </EssenceContents>
        </EssenceLast>
      </Contents>
    </Root>
  );
}

export default CollapseLi;
