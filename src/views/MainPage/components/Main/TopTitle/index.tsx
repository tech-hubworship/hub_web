import React from "react";
import {
  BoxWrapper,
  Group,
  Text,
  DateWrapper,
  DateText,
  GroupWrapper,
  Location,
  Date,
} from "./style";

export const Box = () => {
  return (
    <BoxWrapper>
      <Group>
        <DateWrapper>
          <Date />
          <DateText>주일 오후 2시</DateText>
        </DateWrapper>
        <GroupWrapper>
          <Location />
          <Text>양재온누리교회 기쁨홀</Text>
        </GroupWrapper>
      </Group>
    </BoxWrapper>
  );
};
