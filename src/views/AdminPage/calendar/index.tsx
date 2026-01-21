import { Button, Calendar, Drawer, Form, Input, List, Modal, Switch, Tag, TimePicker, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent } from '@src/lib/calendar/types';

function formatYYYYMMDD(d: Dayjs) {
  return d.format('YYYY-MM-DD');
}

function rangeForMonth(viewDate: Dayjs) {
  const start = viewDate.startOf('month');
  const end = viewDate.endOf('month');
  return { from: formatYYYYMMDD(start), to: formatYYYYMMDD(end) };
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
      const res = await fetch(`/api/admin/calendar-events?from=${from}&to=${to}`);
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

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/calendar-events', {
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
      const res = await fetch(`/api/admin/calendar-events/${id}`, {
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
      const res = await fetch(`/api/admin/calendar-events/${id}`, { method: 'DELETE' });
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

  const renderEvents = (value: Dayjs) => {
    const key = formatYYYYMMDD(value);
    const dayEvents = eventsByDate.get(key) || [];
    if (dayEvents.length === 0) return null;
    return (
      <CellEvents>
        {dayEvents.slice(0, 3).map((ev) => (
          <CellEvent key={ev.id} title={ev.title}>
            <Dot />
            <span>{ev.title}</span>
          </CellEvent>
        ))}
        {dayEvents.length > 3 && <MoreText>+{dayEvents.length - 3}</MoreText>}
      </CellEvents>
    );
  };

  const onSelect = (value: Dayjs) => {
    setSelectedDate(value);
    setDrawerOpen(true);
  };

  const onPanelChange = (value: Dayjs) => {
    setViewDate(value);
  };

  return (
    <Wrap>
      <Header>
        <Typography.Title level={3} style={{ margin: 0 }}>
          일정 관리
        </Typography.Title>
        <Typography.Text type="secondary">
          날짜를 클릭해 일정을 확인하고, “+ 일정 추가”로 등록하세요.
        </Typography.Text>
      </Header>

      {error ? (
        <Typography.Text type="danger">
          {(error as Error)?.message || '일정을 불러오지 못했습니다.'}
        </Typography.Text>
      ) : null}

      <Card>
        <Calendar
          value={viewDate}
          onPanelChange={onPanelChange}
          onSelect={onSelect}
          cellRender={(current, info) => {
            if (info.type !== 'date') return info.originNode;
            // antd Calendar는 날짜 숫자를 기본으로 렌더링하므로,
            // 여기서는 "추가 콘텐츠(일정)"만 렌더링해야 날짜가 중복되지 않습니다.
            return renderEvents(current) || null;
          }}
        />
      </Card>

      <Drawer
        title={
          <DrawerTitle>
            <span>{selectedKey} 일정</span>
            <Button type="primary" onClick={() => openCreateModal(selectedDate)}>
              + 일정 추가
            </Button>
          </DrawerTitle>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        width={460}
      >
        <List
          loading={isLoading}
          dataSource={selectedEvents}
          locale={{ emptyText: '등록된 일정이 없습니다.' }}
          renderItem={(ev) => (
            <List.Item
              actions={[
                <Button key="edit" onClick={() => openEditModal(ev)}>
                  수정
                </Button>,
                <Button
                  key="del"
                  danger
                  loading={deleteMutation.isPending}
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
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <TitleRow>
                    <span>{ev.title}</span>
                    {ev.all_day ? <Tag>종일</Tag> : null}
                    {!ev.is_public ? <Tag color="default">비공개</Tag> : null}
                  </TitleRow>
                }
                description={
                  <div>
                    <MetaLine>
                      <strong>시간</strong>{' '}
                      {ev.all_day
                        ? '종일'
                        : `${dayjs(ev.start_at).format('HH:mm')}${
                            ev.end_at ? ` ~ ${dayjs(ev.end_at).format('HH:mm')}` : ''
                          }`}
                    </MetaLine>
                    {ev.location ? (
                      <MetaLine>
                        <strong>장소</strong> {ev.location}
                      </MetaLine>
                    ) : null}
                    {ev.description ? (
                      <MetaLine>
                        <strong>설명</strong> {ev.description}
                      </MetaLine>
                    ) : null}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title={editingEvent ? '일정 수정' : '일정 추가'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editingEvent ? '수정' : '추가'}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
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
            <Input placeholder="예) 주일예배, MT, 리더십 모임" />
          </Form.Item>

          <Form.Item label="종일" name="all_day" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) =>
              getFieldValue('all_day') ? null : (
                <TimeRow>
                  <Form.Item
                    label="시작 시간"
                    name="start_time"
                    rules={[{ required: true, message: '시작 시간을 선택해주세요.' }]}
                  >
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                  <Form.Item label="종료 시간" name="end_time">
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                </TimeRow>
              )
            }
          </Form.Item>

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
    </Wrap>
  );
}

const Wrap = styled.div`
  padding: 0;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`;

const CellEvents = styled.div`
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CellEvent = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #6366f1;
  flex: 0 0 auto;
`;

const MoreText = styled.div`
  font-size: 11px;
  color: #64748b;
`;

const DrawerTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaLine = styled.div`
  font-size: 13px;
  color: #475569;
  margin-top: 4px;

  strong {
    color: #1e293b;
    margin-right: 6px;
  }
`;

const TimeRow = styled.div`
  display: flex;
  gap: 12px;
`;

