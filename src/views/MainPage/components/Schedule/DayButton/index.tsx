import React from "react";
import * as S from "./style";

interface DayButtonProps {
  text: string;
}

function DayButton({ text }: DayButtonProps) {
  return (
    <S.Box>
      <S.Group>
        <S.OverlapGroup>
          <S.Rectangle />
          <S.Text>{text}</S.Text>
        </S.OverlapGroup>
      </S.Group>
    </S.Box>
  );
}

export default DayButton;
