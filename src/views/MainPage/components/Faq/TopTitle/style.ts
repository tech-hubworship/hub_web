import styled from "@emotion/styled";
import DateIcon from "@src/assets/icons/ic_date.svg";
import LocationIcon from "@src/assets/icons/ic_location.svg";

export const BoxWrapper = styled.div`
  position: relative;
  width: 211px;
  height: 37px;
`;

export const Group = styled.div`
  width: 211px;
  height: 37px;
`;

export const Text = styled.div`
  position: absolute;
  left: 141px;
  font-family: var(--font-wanted);
  line-height: 37px;
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
`;

export const DateWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 20px;
  width: 100px;
  height: 37px;
`;

export const DateText = styled.div`
  position: absolute;
  line-height: 37px;
  font-size: 17px;
  font-weight: 600;
  font-family: var(--font-wanted);
  color: #000000;
  white-space: nowrap;
`;

export const Date = styled(DateIcon)`
  height: 16px;
  position: absolute;
  top: 8px;
  width: 16px;
`;

export const Location = styled(LocationIcon)`
  height: 16px;
  position: absolute;
  left: 123px;
  top: 8px;
  width: 16px;
`;

export const GroupWrapper = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url("/vector.svg");
  background-size: 100% 100%;
`;
