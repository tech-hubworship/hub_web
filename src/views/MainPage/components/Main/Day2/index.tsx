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
  
  // 컴포넌트가 언마운트될 때 닫힘 상태로 알림
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
        <TItle>Day 2</TItle>
        <Button isOpened={isOpened} />
      </Section>
      <Contents isOpened={isOpened}>
        <Essence>
          <Tag>Essence 2</Tag>
          <EssenceTitle>
            <FirstWord>Sola </FirstWord>
            <SecondWord>Fide</SecondWord>
          </EssenceTitle>
          <EssenceContents>
            <Speaker>오장석 목사</Speaker>
            <Group>한국청년로잔위원회 대표</Group>
          </EssenceContents>
        </Essence>

        <Essence>
          <Tag>Essence 3</Tag>
          <EssenceTitle>Mentor Talkshow</EssenceTitle>
          <EssenceContents>
            <Speaker>연사 추후 공개</Speaker>
          </EssenceContents>
        </Essence>

        <Essence>
          <Tag>Essence 4</Tag>
          <EssenceTitle>HubRun!</EssenceTitle>
          <EssenceContents>
            <Speaker>콘텐츠 추후 공개</Speaker>
          </EssenceContents>
        </Essence>

        <EssenceLast>
          <Tag>Essence 5</Tag>
          <EssenceTitle>
            <FirstWord>Sola </FirstWord>
            <SecondWord>Scriptura</SecondWord>
          </EssenceTitle>
          <EssenceContents>
            <Speaker>오현교 목사</Speaker>
            <Group>허브 대학부</Group>
          </EssenceContents>
        </EssenceLast>
      </Contents>
    </Root>
  );
}

export default CollapseLi;
