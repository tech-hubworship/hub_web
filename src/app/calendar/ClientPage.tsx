"use client";

import React, { useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "@src/lib/calendar/types";
import { Header } from "@src/components/Header";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

// iOS 스타일 컬러
const ios = {
  red: "#FF3B30", // today
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  purple: "#AF52DE",
  gray1: "#8E8E93",
  gray2: "#AEAEB2",
  gray3: "#C7C7CC",
  gray4: "#D1D1D6",
  gray5: "#E5E5EA",
  gray6: "#F2F2F7",
  label: "#000000",
  secondaryLabel: "#3C3C43",
  tertiaryLabel: "#3C3C4399",
  separator: "#3C3C4329",
  systemBackground: "#FFFFFF",
  secondarySystemBackground: "#F2F2F7",
  groupedBackground: "#F2F2F7",
};

const EVENT_DOT_COLORS = [ios.blue, ios.green, ios.orange, ios.purple, ios.red];

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
      const dateKey = dayjs(ev.start_at).format("YYYY-MM-DD");
      const arr = map.get(dateKey) ?? [];
      arr.push(ev);
      map.set(dateKey, arr);
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

  const selectedKey = formatYYYYMMDD(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) || [];
  const todayKey = formatYYYYMMDD(dayjs());

  const goPrevMonth = () => setViewDate((d) => d.subtract(1, "month"));
  const goNextMonth = () => setViewDate((d) => d.add(1, "month"));

  return (
    <>
      <Global styles={globalStyles} />
      <Header />
      <PageWrap>
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
            {calendarDays.map((d) => {
              const key = formatYYYYMMDD(d);
              const isCurrentMonth = d.month() === viewDate.month();
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              const dayEvents = eventsByDate.get(key) || [];

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
                  {dayEvents.length > 0 && (
                    <DotsRow>
                      {dayEvents.slice(0, 3).map((ev, i) => (
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

        <EventsSection>
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
              {selectedEvents.map((ev, idx) => (
                <EventRow key={ev.id}>
                  <EventBar
                    $color={EVENT_DOT_COLORS[idx % EVENT_DOT_COLORS.length]}
                  />
                  <EventContent>
                    <EventTime>
                      {ev.all_day
                        ? "종일"
                        : `${dayjs(ev.start_at).format("HH:mm")}${
                            ev.end_at
                              ? ` – ${dayjs(ev.end_at).format("HH:mm")}`
                              : ""
                          }`}
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
        </EventsSection>
      </PageWrap>
      <Footer />
    </>
  );
}

const globalStyles = css`
  .hub-calendar-ios {
    -webkit-tap-highlight-color: transparent;
  }
`;

const PageWrap = styled.div`
  min-height: 100vh;
  background: ${ios.systemBackground};
  padding: 0 16px 100px;
  max-width: 520px;
  margin: 0 auto;
`;

const CalendarSection = styled.section`
  padding: 24px 0 20px;
`;

const MonthHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 16px;
`;

const NavButton = styled.button`
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

const MonthTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${ios.label};
  letter-spacing: -0.02em;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding: 0 0 8px;
  border-bottom: 1px solid ${ios.separator};
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: ${ios.tertiaryLabel};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding-top: 4px;
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
  color: ${(p) =>
    p.$isCurrentMonth ? ios.label : ios.tertiaryLabel};
  &:hover {
    background: ${ios.gray5};
  }
  &:active {
    background: ${ios.gray4};
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

const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  min-height: 6px;
`;

const EventDot = styled.span<{ $color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const EventsSection = styled.section`
  background: ${ios.groupedBackground};
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${ios.secondaryLabel};
  letter-spacing: -0.01em;
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 24px 0;
  font-size: 15px;
  color: ${ios.tertiaryLabel};
  text-align: center;
`;

const ErrorMessage = styled.p`
  margin: 0;
  padding: 16px 0;
  font-size: 15px;
  color: ${ios.red};
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
  background: ${ios.systemBackground};
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  &:last-child {
    margin-bottom: 0;
  }
`;

const EventBar = styled.div<{ $color: string }>`
  width: 4px;
  flex-shrink: 0;
  background: ${(p) => p.$color};
`;

const EventContent = styled.div`
  flex: 1;
  padding: 12px 14px;
  min-width: 0;
`;

const EventTime = styled.div`
  font-size: 13px;
  color: ${ios.tertiaryLabel};
  margin-bottom: 2px;
`;

const EventTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${ios.label};
  line-height: 1.3;
`;

const EventLocation = styled.div`
  font-size: 14px;
  color: ${ios.secondaryLabel};
  margin-top: 4px;
`;
