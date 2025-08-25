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
        <Text>소망수양관</Text>

        <DateWrapper>
          <DateText>2025.5.16-18</DateText>
        </DateWrapper>
        <Date />
        <GroupWrapper>
          <Location />
        </GroupWrapper>
      </Group>
    </BoxWrapper>
  );
};
