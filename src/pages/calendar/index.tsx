import { Calendar, Drawer, List, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useQuery } from '@tanstack/react-query';
import type { CalendarEvent } from '@src/lib/calendar/types';

function formatYYYYMMDD(d: Dayjs) {
  return d.format('YYYY-MM-DD');
}

function rangeForMonth(viewDate: Dayjs) {
  const start = viewDate.startOf('month');
  const end = viewDate.endOf('month');
  return { from: formatYYYYMMDD(start), to: formatYYYYMMDD(end) };
}

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState<Dayjs>(() => dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { from, to } = useMemo(() => rangeForMonth(viewDate), [viewDate]);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: CalendarEvent[] }>({
    queryKey: ['calendar-events-public', from, to],
    queryFn: async () => {
      const res = await fetch(`/api/public/calendar-events?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('일정을 불러오지 못했습니다.');
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
    // 시간순 정렬
    map.forEach((arr, k) => {
      arr.sort((a: CalendarEvent, b: CalendarEvent) => dayjs(a.start_at).valueOf() - dayjs(b.start_at).valueOf());
      map.set(k, arr);
    });
    return map;
  }, [events]);

  const selectedKey = formatYYYYMMDD(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) || [];

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
          허브대학부 일정
        </Typography.Title>
        <Typography.Text type="secondary">
          날짜를 클릭하면 해당 날짜의 일정을 확인할 수 있어요.
        </Typography.Text>
      </Header>

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
        title={`${selectedKey} 일정`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        width={420}
      >
        {error ? (
          <Typography.Text type="danger">
            {(error as Error)?.message || '일정을 불러오지 못했습니다.'}
          </Typography.Text>
        ) : (
          <List
            loading={isLoading}
            dataSource={selectedEvents}
            locale={{ emptyText: '등록된 일정이 없습니다.' }}
            renderItem={(ev) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <TitleRow>
                      <span>{ev.title}</span>
                      {ev.all_day ? <Tag>종일</Tag> : null}
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
        )}
      </Drawer>
    </Wrap>
  );
}

const Wrap = styled.div`
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
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

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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

