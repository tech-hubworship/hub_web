import type { CalendarEvent } from "@src/lib/calendar/types";

/** 이벤트가 이틀 이상인지 */
export function isMultiDayEvent(ev: CalendarEvent): boolean {
  const keys = getEventDateKeys(ev);
  return keys.length >= 2;
}

/**
 * 0~41 그리드 인덱스 기준으로 기간 이벤트의 막대를 그리기 위한 세그먼트.
 * 주가 바뀌면 행이 바뀌므로 여러 세그먼트로 나눔.
 */
export function getBarSegments(
  startIndex: number,
  endIndex: number
): { row: number; colStart: number; colSpan: number }[] {
  const segments: { row: number; colStart: number; colSpan: number }[] = [];
  const cols = 7;
  for (let i = startIndex; i <= endIndex; ) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const remainingInRow = cols - col;
    const remainingTotal = endIndex - i + 1;
    const span = Math.min(remainingInRow, remainingTotal);
    segments.push({ row, colStart: col, colSpan: span });
    i += span;
  }
  return segments;
}

/**
 * 이벤트가 걸친 모든 날짜(YYYY-MM-DD)를 반환.
 * 기간 이벤트(전일 00:00 ~ 다음날 23:59 등)도 해당하는 모든 날에 표시하기 위함.
 * 겹치는 기간은 각각 별도로 표시되므로 중복 제거만 하면 됨.
 */
export function getEventDateKeys(ev: CalendarEvent): string[] {
  const start = new Date(ev.start_at);
  const end = ev.end_at ? new Date(ev.end_at) : null;

  const startKey = formatDateKey(start);
  if (!end || end.getTime() <= start.getTime()) {
    return [startKey];
  }

  const keys: string[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= endDay.getTime()) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 이벤트 시간/기간 표시 문자열.
 * - 종일: "종일" (기간이면 "M/D – M/D 종일")
 * - 당일 시간: "HH:mm – HH:mm" 또는 "HH:mm"
 * - 기간+시간: "M/D HH:mm – M/D HH:mm" (서로 다른 날짜일 때)
 */
export function formatEventTimeRange(ev: CalendarEvent): string {
  if (ev.all_day) {
    const endKey = ev.end_at
      ? formatDateKey(new Date(ev.end_at))
      : null;
    const startKey = formatDateKey(new Date(ev.start_at));
    if (endKey && endKey !== startKey && ev.end_at) {
      return `${formatShortDate(ev.start_at)} – ${formatShortDate(ev.end_at)} 종일`;
    }
    return "종일";
  }

  const start = new Date(ev.start_at);
  const end = ev.end_at ? new Date(ev.end_at) : null;
  const startKey = formatDateKey(start);
  const endKey = end ? formatDateKey(end) : null;

  if (!end || !endKey || endKey === startKey) {
    return end && ev.end_at
      ? `${formatTime(ev.start_at)} – ${formatTime(ev.end_at)}`
      : formatTime(ev.start_at);
  }

  const endAt = ev.end_at!;
  const startLabel =
    new Date(ev.start_at).getFullYear() !== new Date(endAt).getFullYear()
      ? `${new Date(ev.start_at).getFullYear()}. ${formatShortDate(ev.start_at)}`
      : formatShortDate(ev.start_at);
  return `${startLabel} ${formatTime(ev.start_at)} – ${formatShortDate(endAt)} ${formatTime(endAt)}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}
