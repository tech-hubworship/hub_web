"use client";

import React, { useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "@src/lib/calendar/types";
import {
  formatEventTimeRange,
  getBarSegments,
  getEventDateKeys,
  isMultiDayEvent,
} from "@src/lib/calendar/eventRange";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

// 용어사전과 동일한 컬러 (glossary style)
const theme = {
  primary: "#0066ff",
  text: "#1f2a5c",
  textSecondary: "rgba(31, 42, 92, 0.7)",
  textTertiary: "rgba(31, 42, 92, 0.5)",
  border: "rgba(31, 42, 92, 0.12)",
  today: "#FF3B30",
  white: "#ffffff",
  grayHover: "rgba(31, 42, 92, 0.06)",
  grayActive: "rgba(31, 42, 92, 0.1)",
};

const EVENT_DOT_COLORS = ["#0066ff", "#34C759", "#FF9500", "#AF52DE", "#FF3B30"];
const EVENT_BAR_PASTEL_COLORS = [
  "#7EC8E3",
  "#7DD3A0",
  "#F5C96E",
  "#C9A0DC",
  "#F0A0A8",
];
const BAR_HEIGHT = 4;
const BAR_LANE_GAP = 2;

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatYYYYMMDD(d: Dayjs) {
  return d.format("YYYY-MM-DD");
}

function rangeForMonth(viewDate: Dayjs) {
  const start = viewDate.startOf("month");
  const end = viewDate.endOf("month");
  return { from: formatYYYYMMDD(start), to: formatYYYYMMDD(end) };
}

// 해당 월의 그리드에 보여줄 날짜 배열 (일요일 시작, 6주)
function getCalendarDays(viewDate: Dayjs): Dayjs[] {
  const start = viewDate.startOf("month").startOf("week"); // 일요일
  const days: Dayjs[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(start.add(i, "day"));
  }
  return days;
}

export default function CalendarClientPage() {
  const [viewDate, setViewDate] = useState<Dayjs>(() => dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());

  const { from, to } = useMemo(() => rangeForMonth(viewDate), [viewDate]);

  const { data, isLoading, error } = useQuery<{
    success: boolean;
    data: CalendarEvent[];
  }>({
    queryKey: ["calendar-events-public", from, to],
    queryFn: async () => {
      const res = await fetch(
        `/api/public/calendar-events?from=${from}&to=${to}`
      );
      if (!res.ok) throw new Error("일정을 불러오지 못했습니다.");
      return res.json();
    },
  });

  const events = data?.data || [];

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      for (const dateKey of getEventDateKeys(ev)) {
        const arr = map.get(dateKey) ?? [];
        arr.push(ev);
        map.set(dateKey, arr);
      }
    }
    map.forEach((arr, k) => {
      arr.sort(
        (a, b) => dayjs(a.start_at).valueOf() - dayjs(b.start_at).valueOf()
      );
      map.set(k, arr);
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);

  const dateKeyToIndex = useMemo(() => {
    const m = new Map<string, number>();
    calendarDays.forEach((d, i) => m.set(formatYYYYMMDD(d), i));
    return m;
  }, [calendarDays]);

  const spanBars = useMemo(() => {
    type Seg = { row: number; colStart: number; colSpan: number; isFirst: boolean; isLast: boolean; lane: number };
    const bars: { event: CalendarEvent; segments: Seg[]; color: string }[] = [];
    events.forEach((ev) => {
      if (!isMultiDayEvent(ev)) return;
      const keys = getEventDateKeys(ev);
      const indices = keys.map((k) => dateKeyToIndex.get(k)).filter((i): i is number => i !== undefined);
      if (indices.length < 2) return;
      const startIndex = Math.min(...indices);
      const endIndex = Math.max(...indices);
      const rawSegments = getBarSegments(startIndex, endIndex);
      if (rawSegments.length === 0) return;
      const segments: Seg[] = rawSegments.map((s, i) => ({
        ...s,
        isFirst: i === 0,
        isLast: i === rawSegments.length - 1,
        lane: 0,
      }));
      bars.push({
        event: ev,
        segments,
        color: EVENT_BAR_PASTEL_COLORS[ev.id % EVENT_BAR_PASTEL_COLORS.length],
      });
    });

    const overlaps = (c1: number, s1: number, c2: number, s2: number) =>
      c1 < c2 + s2 && c2 < c1 + s1;

    const byRow = new Map<number, { barIdx: number; segIdx: number; colStart: number; colSpan: number }[]>();
    bars.forEach((bar, barIdx) => {
      bar.segments.forEach((seg, segIdx) => {
        const list = byRow.get(seg.row) ?? [];
        list.push({ barIdx, segIdx, colStart: seg.colStart, colSpan: seg.colSpan });
        byRow.set(seg.row, list);
      });
    });

    byRow.forEach((list) => {
      const assigned: { lane: number; colStart: number; colSpan: number }[] = [];
      list.forEach(({ barIdx, segIdx, colStart, colSpan }) => {
        let lane = 0;
        for (;; lane++) {
          const conflict = assigned.some((a) => a.lane === lane && overlaps(a.colStart, a.colSpan, colStart, colSpan));
          if (!conflict) break;
        }
        assigned.push({ lane, colStart, colSpan });
        bars[barIdx].segments[segIdx].lane = lane;
      });
    });

    return bars;
  }, [events, dateKeyToIndex]);

  const selectedKey = formatYYYYMMDD(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) || [];
  const todayKey = formatYYYYMMDD(dayjs());

  const goPrevMonth = () => setViewDate((d) => d.subtract(1, "month"));
  const goNextMonth = () => setViewDate((d) => d.add(1, "month"));

  return (
    <>
      <Global styles={globalStyles} />
      <Container>
        <Title>📅 허브 캘린더</Title>
        <Subtitle>공동체 일정을 확인하세요</Subtitle>

        <ContentWrap>
          <CalendarCard>
            <CalendarSection>
              <MonthHeader>
                <NavButton type="button" onClick={goPrevMonth} aria-label="이전 달">
                  ‹
                </NavButton>
                <MonthTitle>{viewDate.format("YYYY년 M월")}</MonthTitle>
                <NavButton type="button" onClick={goNextMonth} aria-label="다음 달">
                  ›
                </NavButton>
              </MonthHeader>

              <WeekdayRow>
                {WEEKDAYS_KO.map((d) => (
                  <WeekdayCell key={d}>{d}</WeekdayCell>
                ))}
              </WeekdayRow>

              <Grid>
                <BarsLayer>
                  {spanBars.map(({ event: ev, segments, color }) =>
                    segments.map((seg, segIdx) => (
                      <EventBarSegment
                        key={`${ev.id}-${segIdx}`}
                        $lane={seg.lane}
                        style={{
                          gridColumn: `${seg.colStart + 1} / span ${seg.colSpan}`,
                          gridRow: seg.row + 1,
                          paddingLeft: seg.isFirst ? `${35 / seg.colSpan}%` : 0,
                          paddingRight: seg.isLast ? `${35 / seg.colSpan}%` : 0,
                        }}
                      >
                        <EventBarSegmentInner $color={color} />
                      </EventBarSegment>
                    ))
                  )}
                </BarsLayer>
                {calendarDays.map((d) => {
                  const key = formatYYYYMMDD(d);
                  const isCurrentMonth = d.month() === viewDate.month();
                  const isToday = key === todayKey;
                  const isSelected = key === selectedKey;
                  const dayEvents = eventsByDate.get(key) || [];
                  const singleDayEvents = dayEvents.filter((ev) => !isMultiDayEvent(ev));

                  return (
                    <DayCell
                      key={key}
                      $isCurrentMonth={isCurrentMonth}
                      $isToday={isToday}
                      $isSelected={isSelected}
                      onClick={() => setSelectedDate(d)}
                    >
                      <DayNumber $isToday={isToday} $isSelected={isSelected}>
                        {d.date()}
                      </DayNumber>
                      {singleDayEvents.length > 0 && (
                        <DotsRow>
                          {singleDayEvents.slice(0, 3).map((ev, i) => (
                            <EventDot
                              key={ev.id}
                              $color={EVENT_DOT_COLORS[i % EVENT_DOT_COLORS.length]}
                            />
                          ))}
                        </DotsRow>
                      )}
                    </DayCell>
                  );
                })}
              </Grid>
            </CalendarSection>
          </CalendarCard>

          <EventsCard>
            <SectionTitle>{selectedDate.format("M월 D일")} 일정</SectionTitle>
            {error ? (
              <ErrorMessage>
                {(error as Error)?.message || "일정을 불러오지 못했습니다."}
              </ErrorMessage>
            ) : isLoading ? (
              <EmptyState>불러오는 중...</EmptyState>
            ) : selectedEvents.length === 0 ? (
              <EmptyState>등록된 일정이 없습니다.</EmptyState>
            ) : (
              <EventList>
                {selectedEvents.map((ev) => (
                  <EventRow key={ev.id}>
                    <EventBar
                      $color={
                        isMultiDayEvent(ev)
                          ? EVENT_BAR_PASTEL_COLORS[ev.id % EVENT_BAR_PASTEL_COLORS.length]
                          : EVENT_DOT_COLORS[ev.id % EVENT_DOT_COLORS.length]
                      }
                    />
                    <EventContent>
                      <EventTime>
                        {formatEventTimeRange(ev)}
                      </EventTime>
                      <EventTitle>{ev.title}</EventTitle>
                      {ev.location ? (
                        <EventLocation>{ev.location}</EventLocation>
                      ) : null}
                    </EventContent>
                  </EventRow>
                ))}
              </EventList>
            )}
          </EventsCard>
        </ContentWrap>
      </Container>
      <Footer />
    </>
  );
}

const globalStyles = css`
  .hub-calendar-page {
    -webkit-tap-highlight-color: transparent;
  }
`;

// 용어사전과 동일한 레이아웃 (glossary style)
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #f7f8fb 0%, #eff2f8 50%, #e0e7ff 100%);
  padding: 44px 20px 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
`;

const Title = styled.h1`
  font-size: 38px;
  font-weight: 800;
  color: #1f2a5c;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 26px;
  }
`;

const Subtitle = styled.p`
  font-size: 17px;
  color: rgba(31, 42, 92, 0.7);
  text-align: center;
  margin-bottom: 30px;
  max-width: 460px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 22px;
  }
`;

const ContentWrap = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: 1024px) {
    flex-direction: row;
    gap: 32px;
    align-items: flex-start;
  }
`;

const CalendarCard = styled.div`
  background: ${theme.white};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }

  @media (min-width: 1024px) {
    flex: 0 0 560px;
  }
`;

const CalendarSection = styled.section`
  padding: 0;
`;

const MonthHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 16px;

  @media (min-width: 1024px) {
    padding: 0 0 20px;
  }
`;

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: ${theme.primary};
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  border-radius: 8px;
  padding: 0;
  font-weight: 300;
  &:hover {
    background: ${theme.grayHover};
  }
  &:active {
    background: ${theme.grayActive};
  }

  @media (min-width: 1024px) {
    width: 40px;
    height: 40px;
    font-size: 32px;
  }
`;

const MonthTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${theme.text};
  letter-spacing: -0.02em;

  @media (min-width: 1024px) {
    font-size: 22px;
  }
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding: 0 0 8px;
  border-bottom: 1px solid ${theme.border};

  @media (min-width: 1024px) {
    padding: 0 0 12px;
  }
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: ${theme.textTertiary};

  @media (min-width: 1024px) {
    font-size: 13px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 0;
  padding-top: 4px;
  position: relative;

  @media (min-width: 1024px) {
    padding-top: 8px;
  }
`;

const BarsLayer = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  pointer-events: none;
  padding-top: 4px;
  @media (min-width: 1024px) {
    padding-top: 8px;
  }
`;

/* 점(DotsRow)과 같은 높이에서 시작, 레인별로 아래로 배치. padding으로 날짜 가운데~가운데, 내부에서 둥글게 */
const EventBarSegment = styled.div<{ $lane: number }>`
  align-self: start;
  margin-top: ${(p) => 33 + p.$lane * (BAR_HEIGHT + BAR_LANE_GAP)}px;
  height: ${BAR_HEIGHT}px;
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  @media (min-width: 1024px) {
    margin-top: ${(p) => 44 + p.$lane * (BAR_HEIGHT + BAR_LANE_GAP)}px;
    height: 5px;
  }
`;

const EventBarSegmentInner = styled.div<{ $color: string }>`
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: ${(p) => p.$color};
  flex: 1;
  min-width: 0;
`;

const DayCell = styled.button<{
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
  color: ${(p) => (p.$isCurrentMonth ? theme.text : theme.textTertiary)};
  &:hover {
    background: ${theme.grayHover};
  }
  &:active {
    background: ${theme.grayActive};
  }

  @media (min-width: 1024px) {
    min-height: 52px;
    padding: 6px 0 8px;
    border-radius: 12px;
  }
`;

const DayNumber = styled.span<{ $isToday: boolean; $isSelected: boolean }>`
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
    background: ${theme.today};
    color: #fff;
    font-weight: 500;
  `}
  ${(p) =>
    p.$isSelected &&
    !p.$isToday &&
    `
    background: ${theme.text};
    color: #fff;
  `}

  @media (min-width: 1024px) {
    width: 36px;
    height: 36px;
    font-size: 17px;
  }
`;

const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  min-height: 6px;

  @media (min-width: 1024px) {
    margin-top: 6px;
    gap: 5px;
  }
`;

const EventDot = styled.span<{ $color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;

  @media (min-width: 1024px) {
    width: 6px;
    height: 6px;
  }
`;

const EventsCard = styled.section`
  background: ${theme.white};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }

  @media (min-width: 1024px) {
    flex: 1;
    min-width: 0;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: ${theme.text};
  letter-spacing: -0.01em;

  @media (min-width: 1024px) {
    margin: 0 0 20px;
    font-size: 20px;
  }
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 32px 0;
  font-size: 15px;
  color: ${theme.textTertiary};
  text-align: center;

  @media (min-width: 1024px) {
    padding: 48px 24px;
  }
`;

const ErrorMessage = styled.p`
  margin: 0;
  padding: 16px 0;
  font-size: 15px;
  color: ${theme.today};
`;

const EventList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const EventRow = styled.li`
  display: flex;
  align-items: stretch;
  gap: 0;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${theme.border};
  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.08);
    border-color: rgba(0, 102, 255, 0.2);
  }
`;

const EventBar = styled.div<{ $color: string }>`
  width: 5px;
  flex-shrink: 0;
  background: ${(p) => p.$color};
`;

const EventContent = styled.div`
  flex: 1;
  padding: 16px 18px;
  min-width: 0;
`;

const EventTime = styled.div`
  font-size: 14px;
  color: ${theme.textTertiary};
  margin-bottom: 4px;
`;

const EventTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: ${theme.text};
  line-height: 1.3;
`;

const EventLocation = styled.div`
  font-size: 14px;
  color: ${theme.textSecondary};
  margin-top: 4px;
`;
