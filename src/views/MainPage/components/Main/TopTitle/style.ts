import styled from "@emotion/styled";
import DateIcon from "@src/assets/icons/ic_date.svg";
import LocationIcon from "@src/assets/icons/ic_location.svg";

export const BoxWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
`;

export const DateWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const DateText = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
  line-height: 37px;
`;

export const Date = styled(DateIcon)`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  fill: #000;
`;

export const GroupWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const Location = styled(LocationIcon)`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  fill: #000;
`;

export const Text = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
  line-height: 37px;
`;
