import { useState } from "react";
import * as S from "./style";
import React from "react";

interface FaqSectionProps {
  tag: string;
  title: string;
  contents: string;
}

function FaqSection({ tag, title, contents }: FaqSectionProps) {
  const [isOpened, setIsOpened] = useState(false);

  const handleClick = () => {
    setIsOpened((prev) => !prev);
  };

  // URL을 링크로 변환하는 함수
  const convertUrlsToLinks = (text: string) => {
    if (!text) return "";

    // URL을 찾기 위한 정규식 패턴
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // 텍스트를 줄바꿈으로 분리
    const parts = text.split("\n");
    
    // 각 줄에 대해 URL을 링크로 변환
    return parts.map((part, index) => {
      const linkifiedPart = part.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
      
      return (
        <React.Fragment key={index}>
          <span dangerouslySetInnerHTML={{ __html: linkifiedPart }} />
          {index < parts.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <S.Root>
       <S.Tag>{tag}</S.Tag>
      <S.Section onClick={handleClick}>
        <S.Title>{title}</S.Title>
        <S.Button isOpened={isOpened} />
      </S.Section>
      <S.Contents isOpened={isOpened}>
        {convertUrlsToLinks(contents)}
      </S.Contents>
    </S.Root>
  );
}

export default FaqSection;
