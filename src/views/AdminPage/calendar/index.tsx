import { Button, DatePicker, Drawer, Form, Input, Modal, Switch, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useMemo, useState } from 'react';

dayjs.extend(isSameOrAfter);
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent } from '@src/lib/calendar/types';
import {
  formatEventTimeRange,
  getBarSegments,
  getEventDateKeys,
  isMultiDayEvent,
} from '@src/lib/calendar/eventRange';
import * as S from './style';

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatYYYYMMDD(d: Dayjs) {
  return d.format('YYYY-MM-DD');
}

function rangeForMonth(viewDate: Dayjs) {
  const start = viewDate.startOf('month');
  const end = viewDate.endOf('month');
  return { from: formatYYYYMMDD(start), to: formatYYYYMMDD(end) };
}

function getCalendarDays(viewDate: Dayjs): Dayjs[] {
  const start = viewDate.startOf('month').startOf('week');
  const days: Dayjs[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(start.add(i, 'day'));
  }
  return days;
}

type EventFormValues = {
  title: string;
  all_day: boolean;
  start_date: Dayjs;
  end_date: Dayjs | null;
  start_time?: Dayjs;
  end_time?: Dayjs;
  location?: string;
  description?: string;
  is_public: boolean;
};

function buildStartEndISO(values: EventFormValues) {
  const startDate = dayjs(values.start_date);
  const endDateRaw = values.end_date ? dayjs(values.end_date) : null;
  const endDate =
    endDateRaw && !endDateRaw.isBefore(startDate, 'day')
      ? endDateRaw
      : startDate;
  const startYYYYMMDD = formatYYYYMMDD(startDate);
  const endYYYYMMDD = formatYYYYMMDD(endDate);

  if (values.all_day) {
    const start = new Date(`${startYYYYMMDD}T00:00:00+09:00`).toISOString();
    const end = new Date(`${endYYYYMMDD}T23:59:59.999+09:00`).toISOString();
    return { start_at: start, end_at: end };
  }

  const startHHmm = (values.start_time || dayjs().hour(9).minute(0)).format('HH:mm');
  const endHHmm = (values.end_time || null)?.format('HH:mm') || null;
  const start = new Date(`${startYYYYMMDD}T${startHHmm}:00+09:00`).toISOString();
  const end = endHHmm
    ? new Date(`${endYYYYMMDD}T${endHHmm}:00+09:00`).toISOString()
    : (startDate.isSame(endDate, 'day') ? null : new Date(`${endYYYYMMDD}T23:59:59.999+09:00`).toISOString());
  return { start_at: start, end_at: end };
}

export default function CalendarAdminPage() {
  const queryClient = useQueryClient();
  const [viewDate, setViewDate] = useState<Dayjs>(() => dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<EventFormValues>();

  const { from, to } = useMemo(() => rangeForMonth(viewDate), [viewDate]);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: CalendarEvent[] }>({
    queryKey: ['calendar-events-admin', from, to],
    queryFn: async () => {
      const res = await fetch(`/api/admin/calendar?from=${from}&to=${to}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '일정을 불러오지 못했습니다.');
      }
      return res.json();
    },
  });

  const events = data?.data || [];

  const eventsByDate = useMemo(() => {
    const map: Map<string, CalendarEvent[]> = new Map();
    for (const ev of events) {
      for (const dateKey of getEventDateKeys(ev)) {
        const arr: CalendarEvent[] = map.get(dateKey) ?? [];
        arr.push(ev);
        map.set(dateKey, arr);
      }
    }
    map.forEach((arr, k) => {
      arr.sort((a: CalendarEvent, b: CalendarEvent) => dayjs(a.start_at).valueOf() - dayjs(b.start_at).valueOf());
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
        color: S.EVENT_BAR_PASTEL_COLORS[ev.id % S.EVENT_BAR_PASTEL_COLORS.length],
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

  const goPrevMonth = () => setViewDate((d) => d.subtract(1, 'month'));
  const goNextMonth = () => setViewDate((d) => d.add(1, 'month'));

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '생성 실패');
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-admin'] });
      setModalOpen(false);
      setEditingEvent(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await fetch(`/api/admin/calendar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '수정 실패');
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-admin'] });
      setModalOpen(false);
      setEditingEvent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/calendar/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || '삭제 실패');
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-admin'] });
    },
  });

  const openCreateModal = (date: Dayjs) => {
    setEditingEvent(null);
    setSelectedDate(date);
    form.setFieldsValue({
      title: '',
      all_day: false,
      start_date: date,
      end_date: null,
      start_time: dayjs().hour(9).minute(0),
      end_time: dayjs().hour(10).minute(0),
      location: '',
      description: '',
      is_public: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    const startDate = dayjs(ev.start_at);
    const endDate = ev.end_at ? dayjs(ev.end_at) : null;
    const sameDay = !endDate || endDate.isSame(startDate, 'day');
    setSelectedDate(startDate);
    form.setFieldsValue({
      title: ev.title,
      all_day: ev.all_day,
      start_date: startDate,
      end_date: sameDay ? null : endDate,
      start_time: ev.all_day ? undefined : dayjs(ev.start_at),
      end_time: ev.all_day ? undefined : (ev.end_at ? dayjs(ev.end_at) : undefined),
      location: ev.location || '',
      description: ev.description || '',
      is_public: ev.is_public,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields() as EventFormValues;
    const { start_at, end_at } = buildStartEndISO(values);
    const payload = {
      title: values.title,
      start_at,
      end_at,
      all_day: values.all_day,
      location: values.location || null,
      description: values.description || null,
      is_public: values.is_public,
    };

    if (!editingEvent) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: editingEvent.id, updates: payload });
    }
  };

  const onDaySelect = (d: Dayjs) => {
    setSelectedDate(d);
    setDrawerOpen(true);
  };

  return (
    <S.PageWrap>
      <S.PageHeader>
        <S.HeaderLeft>
          <S.HeaderIcon>📅</S.HeaderIcon>
          <S.HeaderText>
            <h1>일정 관리</h1>
            <p>
          날짜를 클릭해 일정을 확인하고, “+ 일정 추가”로 등록하세요.
            </p>
          </S.HeaderText>
        </S.HeaderLeft>
      </S.PageHeader>

      {error ? (
        <S.ErrorBanner>
          {(error as Error)?.message || '일정을 불러오지 못했습니다.'}
        </S.ErrorBanner>
      ) : null}

      <S.CalendarSection>
        <S.MonthHeader>
          <S.NavButton type="button" onClick={goPrevMonth} aria-label="이전 달">
            ‹
          </S.NavButton>
          <S.MonthTitle>{viewDate.format('YYYY년 M월')}</S.MonthTitle>
          <S.NavButton type="button" onClick={goNextMonth} aria-label="다음 달">
            ›
          </S.NavButton>
        </S.MonthHeader>

        <S.WeekdayRow>
          {WEEKDAYS_KO.map((d) => (
            <S.WeekdayCell key={d}>{d}</S.WeekdayCell>
          ))}
        </S.WeekdayRow>

        <S.Grid>
          <S.BarsLayer>
            {spanBars.map(({ event: ev, segments, color }) =>
              segments.map((seg, segIdx) => (
                <S.EventBarSegment
                  key={`${ev.id}-${segIdx}`}
                  $lane={seg.lane}
                  style={{
                    gridColumn: `${seg.colStart + 1} / span ${seg.colSpan}`,
                    gridRow: seg.row + 1,
                    paddingLeft: seg.isFirst ? `${35 / seg.colSpan}%` : 0,
                    paddingRight: seg.isLast ? `${35 / seg.colSpan}%` : 0,
                  }}
                >
                  <S.EventBarSegmentInner $color={color} />
                </S.EventBarSegment>
              ))
            )}
          </S.BarsLayer>
          {calendarDays.map((d) => {
            const key = formatYYYYMMDD(d);
            const isCurrentMonth = d.month() === viewDate.month();
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const dayEvents = eventsByDate.get(key) || [];
            const singleDayEvents = dayEvents.filter((ev) => !isMultiDayEvent(ev));

            return (
              <S.DayCell
                key={key}
                type="button"
                $isCurrentMonth={isCurrentMonth}
                $isToday={isToday}
                $isSelected={isSelected}
                onClick={() => onDaySelect(d)}
              >
                <S.DayNumber $isToday={isToday} $isSelected={isSelected}>
                  {d.date()}
                </S.DayNumber>
                {singleDayEvents.length > 0 && (
                  <S.DotsRow>
                    {singleDayEvents.slice(0, 3).map((ev, i) => (
                      <S.EventDot
                        key={ev.id}
                        $color={S.EVENT_DOT_COLORS[i % S.EVENT_DOT_COLORS.length]}
                      />
                    ))}
                  </S.DotsRow>
                )}
              </S.DayCell>
            );
          })}
        </S.Grid>
      </S.CalendarSection>

      <Drawer
          title={
            <S.DrawerTitleRow>
              <S.DrawerDate>{selectedKey} 일정</S.DrawerDate>
              <Button type="primary" onClick={() => openCreateModal(selectedDate)}>
                + 일정 추가
              </Button>
            </S.DrawerTitleRow>
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="right"
          width={480}
          styles={{ body: { paddingTop: 8 } }}
        >
          {isLoading ? (
            <S.EmptyState>불러오는 중...</S.EmptyState>
          ) : selectedEvents.length === 0 ? (
            <S.EmptyState>
              이 날짜에 등록된 일정이 없습니다.
              <br />
              <Button
                type="primary"
                ghost
                size="small"
                style={{ marginTop: 12 }}
                onClick={() => openCreateModal(selectedDate)}
              >
                + 일정 추가
              </Button>
            </S.EmptyState>
          ) : (
            <S.EventList>
              {selectedEvents.map((ev) => (
                <S.EventRow key={ev.id}>
                  <S.EventBar
                    $color={
                      isMultiDayEvent(ev)
                        ? S.EVENT_BAR_PASTEL_COLORS[ev.id % S.EVENT_BAR_PASTEL_COLORS.length]
                        : S.EVENT_DOT_COLORS[ev.id % S.EVENT_DOT_COLORS.length]
                    }
                  />
                  <S.EventContent>
                    <S.EventTime>
                      {formatEventTimeRange(ev)}
                    </S.EventTime>
                    <S.EventTitleText>{ev.title}</S.EventTitleText>
                    {ev.location ? (
                      <S.EventLocationText>{ev.location}</S.EventLocationText>
                    ) : null}
                    <S.EventActions style={{ marginTop: 10 }}>
                      <Button
                        size="small"
                        type="link"
                        style={{ padding: 0, color: S.ios.blue }}
                        onClick={() => openEditModal(ev)}
                      >
                        수정
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        danger
                        loading={deleteMutation.isPending}
                        style={{ padding: 0 }}
                        onClick={() => {
                          Modal.confirm({
                            title: '일정을 삭제할까요?',
                            content: ev.title,
                            okText: '삭제',
                            okButtonProps: { danger: true },
                            cancelText: '취소',
                            onOk: () => deleteMutation.mutate(ev.id),
                          });
                        }}
                      >
                        삭제
                      </Button>
                    </S.EventActions>
                  </S.EventContent>
                </S.EventRow>
              ))}
            </S.EventList>
          )}
        </Drawer>

        <Modal
          title={editingEvent ? '일정 수정' : '일정 추가'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={submit}
          okText={editingEvent ? '수정' : '추가'}
          confirmLoading={createMutation.isPending || updateMutation.isPending}
          destroyOnClose
          width={480}
          styles={{ body: { paddingTop: 8 } }}
        >
            <Form
            form={form}
            layout="vertical"
            initialValues={{ all_day: false, is_public: true }}
          >
            <Form.Item
              label="제목"
              name="title"
              rules={[{ required: true, message: '제목을 입력해주세요.' }]}
            >
              <Input placeholder="예) 주일예배, 사순절 기간, MT" size="large" />
            </Form.Item>

            <S.FormSection>
              <S.FormSectionLabel>기간 설정</S.FormSectionLabel>
              <S.TimeRow>
                <Form.Item
                  label="시작일"
                  name="start_date"
                  rules={[{ required: true, message: '시작일을 선택해주세요.' }]}
                >
                  <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label="종료일 (선택)"
                  name="end_date"
                  help="기간 일정(예: 사순절)인 경우만 선택. 비우면 당일만."
                  rules={[
                    {
                      validator: (_, val) => {
                        if (!val) return Promise.resolve();
                        const start = form.getFieldValue('start_date');
                        if (!start) return Promise.resolve();
                        const endDay = dayjs(val);
                        const startDay = dayjs(start);
                        if (endDay.isBefore(startDay, 'day')) {
                          return Promise.reject(new Error('종료일은 시작일 이후여야 합니다.'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                </Form.Item>
              </S.TimeRow>
              <Form.Item label="종일" name="all_day" valuePropName="checked">
                <Switch checkedChildren="종일" unCheckedChildren="시간 지정" />
              </Form.Item>
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) =>
                  getFieldValue('all_day') ? null : (
                    <S.TimeRow>
                      <Form.Item
                        label="시작 시간"
                        name="start_time"
                        rules={[{ required: true, message: '시작 시간을 선택해주세요.' }]}
                      >
                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="종료 시간" name="end_time">
                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </S.TimeRow>
                  )
                }
              </Form.Item>
            </S.FormSection>

            <Form.Item label="장소" name="location">
              <Input placeholder="예) 양재 온누리교회, B1 예배실" />
            </Form.Item>

            <Form.Item label="설명" name="description">
              <Input.TextArea rows={3} placeholder="필요한 안내를 적어주세요." />
            </Form.Item>

            <Form.Item label="공개 여부" name="is_public" valuePropName="checked">
              <Switch checkedChildren="공개" unCheckedChildren="비공개" />
            </Form.Item>
          </Form>
        </Modal>
    </S.PageWrap>
  );
}


