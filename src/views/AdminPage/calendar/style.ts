import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// iOS 스타일 컬러 (iPhone 캘린더)
export const ios = {
  red: '#FF3B30',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray1: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: 'rgba(60, 60, 67, 0.6)',
  separator: 'rgba(60, 60, 67, 0.16)',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  groupedBackground: '#F2F2F7',
};

export const EVENT_DOT_COLORS = [ios.blue, ios.green, ios.orange, ios.purple, ios.red];

export const PageWrap = styled.div`
  padding: 24px;
  max-width: 560px;
  margin: 0 auto;
  animation: ${fadeIn} 0.3s ease-out;
  background: ${ios.systemBackground};

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const PageHeader = styled.header`
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const HeaderIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${ios.blue};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
`;

export const HeaderText = styled.div`
  h1 {
    margin: 0 0 4px 0;
    font-size: 22px;
    font-weight: 700;
    color: ${ios.label};
    letter-spacing: -0.02em;
  }
  p {
    margin: 0;
    font-size: 14px;
    color: ${ios.secondaryLabel};
    line-height: 1.45;
  }
`;

export const HeaderAction = styled.div`
  flex-shrink: 0;
`;

export const ErrorBanner = styled.div`
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 14px;
`;

// ——— iPhone 캘린더 그리드 ———
export const CalendarSection = styled.section`
  padding: 16px 0 20px;
`;

export const MonthHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 16px;
`;

export const NavButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: ${ios.blue};
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  border-radius: 8px;
  padding: 0;
  font-weight: 300;
  &:hover {
    background: ${ios.gray5};
  }
  &:active {
    background: ${ios.gray4};
  }
`;

export const MonthTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${ios.label};
  letter-spacing: -0.02em;
`;

export const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding: 0 0 8px;
  border-bottom: 1px solid ${ios.separator};
`;

export const WeekdayCell = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: ${ios.tertiaryLabel};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding-top: 4px;
`;

export const DayCell = styled.button<{
  $isCurrentMonth: boolean;
  $isToday: boolean;
  $isSelected: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 44px;
  padding: 4px 0 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  color: ${(p) => (p.$isCurrentMonth ? ios.label : ios.tertiaryLabel)};
  &:hover {
    background: ${ios.gray5};
  }
  &:active {
    background: ${ios.gray4};
  }
`;

export const DayNumber = styled.span<{ $isToday: boolean; $isSelected: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 400;
  border-radius: 50%;
  line-height: 1;
  flex-shrink: 0;
  ${(p) =>
    p.$isToday &&
    `
    background: ${ios.red};
    color: #fff;
    font-weight: 500;
  `}
  ${(p) =>
    p.$isSelected &&
    !p.$isToday &&
    `
    background: ${ios.label};
    color: #fff;
  `}
`;

export const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  min-height: 6px;
`;

export const EventDot = styled.span<{ $color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

export const DrawerTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const DrawerDate = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${ios.label};
`;

export const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
`;

// 드로어 내 iOS 스타일 일정 행
export const EventRow = styled.div`
  display: flex;
  align-items: stretch;
  background: ${ios.systemBackground};
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  &:last-child {
    margin-bottom: 0;
  }
`;

export const EventBar = styled.div<{ $color: string }>`
  width: 4px;
  flex-shrink: 0;
  background: ${(p) => p.$color};
`;

export const EventContent = styled.div`
  flex: 1;
  padding: 12px 14px;
  min-width: 0;
`;

export const EventTime = styled.div`
  font-size: 13px;
  color: ${ios.tertiaryLabel};
  margin-bottom: 2px;
`;

export const EventTitleText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${ios.label};
  line-height: 1.3;
`;

export const EventLocationText = styled.div`
  font-size: 14px;
  color: ${ios.secondaryLabel};
  margin-top: 4px;
`;

export const EventCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${ios.separator};
  background: ${ios.systemBackground};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

export const EventCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;

export const EventTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${ios.label};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const EventTags = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const EventMeta = styled.div`
  font-size: 13px;
  color: ${ios.secondaryLabel};
  line-height: 1.5;
  margin-bottom: 12px;

  strong {
    color: ${ios.label};
    font-weight: 600;
    margin-right: 6px;
  }
`;

export const EventMetaLine = styled.div`
  margin-top: 4px;
`;

export const EventActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${ios.tertiaryLabel};
  font-size: 14px;
  background: ${ios.groupedBackground};
  border-radius: 12px;
`;

export const FormSection = styled.div`
  margin-bottom: 20px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const FormSectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
`;

export const TimeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;
