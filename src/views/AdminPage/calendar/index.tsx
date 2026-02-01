import { Button, Drawer, Form, Input, Modal, Switch, Tag, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent } from '@src/lib/calendar/types';
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
  start_time?: Dayjs;
  end_time?: Dayjs;
  location?: string;
  description?: string;
  is_public: boolean;
};

function buildStartEndISO(date: Dayjs, values: EventFormValues) {
  // 서울 기준(+09:00)로 문자열을 만들어 ISO로 저장 (UTC 변환)
  if (values.all_day) {
    const start = new Date(`${formatYYYYMMDD(date)}T00:00:00+09:00`).toISOString();
    const end = new Date(`${formatYYYYMMDD(date)}T23:59:59.999+09:00`).toISOString();
    return { start_at: start, end_at: end };
  }

  const startHHmm = (values.start_time || dayjs().hour(9).minute(0)).format('HH:mm');
  const endHHmm = (values.end_time || null)?.format('HH:mm') || null;
  const start = new Date(`${formatYYYYMMDD(date)}T${startHHmm}:00+09:00`).toISOString();
  const end = endHHmm ? new Date(`${formatYYYYMMDD(date)}T${endHHmm}:00+09:00`).toISOString() : null;
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
      const dateKey = dayjs(ev.start_at).format('YYYY-MM-DD');
      const arr: CalendarEvent[] = map.get(dateKey) ?? [];
      arr.push(ev);
      map.set(dateKey, arr);
    }
    map.forEach((arr, k) => {
      arr.sort((a: CalendarEvent, b: CalendarEvent) => dayjs(a.start_at).valueOf() - dayjs(b.start_at).valueOf());
      map.set(k, arr);
    });
    return map;
  }, [events]);

  const selectedKey = formatYYYYMMDD(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) || [];
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
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
    const date = dayjs(ev.start_at);
    setSelectedDate(date);
    form.setFieldsValue({
      title: ev.title,
      all_day: ev.all_day,
      start_time: ev.all_day ? undefined : dayjs(ev.start_at),
      end_time: ev.all_day ? undefined : (ev.end_at ? dayjs(ev.end_at) : undefined),
      location: ev.location || '',
      description: ev.description || '',
      is_public: ev.is_public,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const { start_at, end_at } = buildStartEndISO(selectedDate, values);
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
          {calendarDays.map((d) => {
            const key = formatYYYYMMDD(d);
            const isCurrentMonth = d.month() === viewDate.month();
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const dayEvents = eventsByDate.get(key) || [];

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
                {dayEvents.length > 0 && (
                  <S.DotsRow>
                    {dayEvents.slice(0, 3).map((ev, i) => (
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
              {selectedEvents.map((ev, idx) => (
                <S.EventRow key={ev.id}>
                  <S.EventBar
                    $color={S.EVENT_DOT_COLORS[idx % S.EVENT_DOT_COLORS.length]}
                  />
                  <S.EventContent>
                    <S.EventTime>
                      {ev.all_day
                        ? '종일'
                        : `${dayjs(ev.start_at).format('HH:mm')}${
                            ev.end_at ? ` – ${dayjs(ev.end_at).format('HH:mm')}` : ''
                          }`}
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
              <Input placeholder="예) 주일예배, MT, 리더십 모임" size="large" />
            </Form.Item>

            <S.FormSection>
              <S.FormSectionLabel>시간 설정</S.FormSectionLabel>
              <Form.Item label="종일" name="all_day" valuePropName="checked">
                <Switch checkedChildren="종일" unCheckedChildren="시간 지정" />
              </Form.Item>
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) =>
                  getFieldValue('all_day') ? null : (
                    <S.TimeRow>
                      <Form.Item
                        label="시작"
                        name="start_time"
                        rules={[{ required: true, message: '시작 시간을 선택해주세요.' }]}
                      >
                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="종료" name="end_time">
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


