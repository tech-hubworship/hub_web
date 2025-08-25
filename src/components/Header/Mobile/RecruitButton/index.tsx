import React from "react";
import * as S from "./style";

function RecruitButton() {
  const handleClick = () => {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSdl-Geca9V7oi8n9RogL16z1bWBcg8whg1v3rBn5NQ9M62kUQ/viewform", "_blank");
  };

  return (
    <S.Box onClick={handleClick}>
      <S.Group>
        <S.OverlapGroup>
          <S.Rectangle />
          <S.Text>신청하기</S.Text>
        </S.OverlapGroup>
      </S.Group>
    </S.Box>
  );
}

export default RecruitButton;
