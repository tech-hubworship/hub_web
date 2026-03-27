import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';

interface Registration {
  id: string;
  created_at: string;
  name: string;
  group_name: string;
  community: string;
  gender: string;
  phone: string;
  departure_slot: string;
  return_slot: string;
  elective_lecture: string;
  intercessor_team: string;
  volunteer_team: string;
  deposit_confirm: boolean;
  room_number: string | null;
  room_note: string | null;
}

interface SlotStat {
  value: string;
  label: string;
  max_count: number;
  current_count: number;
  is_full: boolean;
}

const slotLabel = (slot: string) => {
  if (slot === 'car') return '자차';
  return slot.replace('bus-', '');
};

export default function HubUpAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'room' | 'bus'>('room');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState('');
  const [editNote, setEditNote] = useState('');
  const [bulkRoom, setBulkRoom] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: registrations = [], isLoading } = useQuery<Registration[]>({
    queryKey: ['hub-up-registrations', appliedSearch, roomFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedSearch) params.set('search', appliedSearch);
      if (roomFilter) params.set('room', roomFilter);
      const res = await fetch(`/api/admin/hub-up/registrations?${params}`);
      if (!res.ok) throw new Error('조회 실패');
      return res.json();
    },
  });

  const { data: busStats } = useQuery<{ slotStats: SlotStat[]; registrations: Registration[] }>({
    queryKey: ['hub-up-bus-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hub-up/bus-stats');
      if (!res.ok) throw new Error('조회 실패');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, room_number, room_note }: { id: string; room_number: string; room_note: string }) => {
      const res = await fetch(`/api/admin/hub-up/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_number: room_number || null, room_note: room_note || null }),
      });
      if (!res.ok) throw new Error('저장 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      setEditingId(null);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/hub-up/registrations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_number: bulkRoom || null }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      setSelectedIds(new Set());
      setBulkRoom('');
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(registrations.map((r) => r.id)));
    }
  };

  const startEdit = (r: Registration) => {
    setEditingId(r.id);
    setEditRoom(r.room_number || '');
    setEditNote(r.room_note || '');
  };

  const total = registrations.length;
  const assigned = registrations.filter((r) => r.room_number).length;
  const unassigned = total - assigned;

  const roomGroups = registrations.reduce<Record<string, number>>((acc, r) => {
    const key = r.room_number || '미배정';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <Container>
      <Header>
        <Title>🏠 허브업 관리</Title>
        <Stats>
          <StatBadge color="#278f5a">전체 {total}명</StatBadge>
          <StatBadge color="#2563eb">배정 {assigned}명</StatBadge>
          <StatBadge color="#d93025">미배정 {unassigned}명</StatBadge>
        </Stats>
      </Header>

      <TabBar>
        <TabBtn active={activeTab === 'room'} onClick={() => setActiveTab('room')}>🏠 숙소 배정</TabBtn>
        <TabBtn active={activeTab === 'bus'} onClick={() => setActiveTab('bus')}>🚌 버스 현황</TabBtn>
      </TabBar>

      {activeTab === 'bus' && (
        <BusTabContent>
          <BusGrid>
            {(busStats?.slotStats || []).map((s) => (
              <BusCard key={s.value} full={s.is_full}>
                <BusLabel>{s.label}</BusLabel>
                <BusCount>
                  <BusNum>{s.current_count}</BusNum>
                  <BusMax>/ {s.max_count > 0 ? s.max_count : '∞'}</BusMax>
                </BusCount>
                {s.max_count > 0 && (
                  <BusBar>
                    <BusFill
                      pct={Math.min((s.current_count / s.max_count) * 100, 100)}
                      full={s.is_full}
                    />
                  </BusBar>
                )}
                {s.is_full && <FullBadge>마감</FullBadge>}
              </BusCard>
            ))}
          </BusGrid>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>이름</Th>
                  <Th>그룹</Th>
                  <Th>출발</Th>
                  <Th>복귀</Th>
                  <Th>입금</Th>
                </tr>
              </thead>
              <tbody>
                {(busStats?.registrations || []).map((r) => (
                  <tr key={r.id}>
                    <Td><strong>{r.name}</strong></Td>
                    <Td style={{ fontSize: '13px', color: '#5f6368' }}>{r.group_name}</Td>
                    <Td><SlotTag slot={r.departure_slot}>{slotLabel(r.departure_slot)}</SlotTag></Td>
                    <Td>{slotLabel(r.return_slot)}</Td>
                    <Td>
                      <DepositBadge confirmed={r.deposit_confirm}>
                        {r.deposit_confirm ? '완료' : '미확인'}
                      </DepositBadge>
                    </Td>
                  </tr>
                ))}
                {!busStats?.registrations?.length && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9aa0a6' }}>
                      신청자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </BusTabContent>
      )}

      {activeTab === 'room' && (
        <RoomTabContent>
          <RoomSummary>
            {Object.entries(roomGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([room, count]) => (
                <RoomChip
                  key={room}
                  active={roomFilter === (room === '미배정' ? 'unassigned' : room)}
                  onClick={() => setRoomFilter(
                    roomFilter === (room === '미배정' ? 'unassigned' : room)
                      ? ''
                      : room === '미배정' ? 'unassigned' : room
                  )}
                >
                  {room} ({count})
                </RoomChip>
              ))}
            {roomFilter && (
              <ClearChip onClick={() => setRoomFilter('')}>✕ 필터 해제</ClearChip>
            )}
          </RoomSummary>

          <Toolbar>
            <SearchRow>
              <SearchInput
                placeholder="이름 / 그룹 / 연락처 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
              />
              <SearchBtn onClick={() => setAppliedSearch(search)}>검색</SearchBtn>
              {appliedSearch && (
                <SearchBtn
                  onClick={() => { setSearch(''); setAppliedSearch(''); }}
                  style={{ background: '#f1f3f4', color: '#5f6368' }}
                >
                  초기화
                </SearchBtn>
              )}
            </SearchRow>
            {selectedIds.size > 0 && (
              <BulkRow>
                <span style={{ fontSize: '14px', color: '#5f6368' }}>{selectedIds.size}명 선택됨</span>
                <BulkInput
                  placeholder="숙소 호수 입력"
                  value={bulkRoom}
                  onChange={(e) => setBulkRoom(e.target.value)}
                />
                <BulkBtn
                  disabled={!bulkRoom || bulkMutation.isPending}
                  onClick={() => bulkMutation.mutate()}
                >
                  일괄 배정
                </BulkBtn>
              </BulkRow>
            )}
          </Toolbar>

          {isLoading ? (
            <LoadingText>불러오는 중...</LoadingText>
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === registrations.length && registrations.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </Th>
                    <Th>이름</Th>
                    <Th>그룹</Th>
                    <Th>성별</Th>
                    <Th>출발</Th>
                    <Th>복귀</Th>
                    <Th>강의</Th>
                    <Th>입금</Th>
                    <Th>숙소</Th>
                    <Th>메모</Th>
                    <Th>관리</Th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                        />
                      </Td>
                      <Td><strong>{r.name}</strong></Td>
                      <Td style={{ fontSize: '13px', color: '#5f6368' }}>{r.group_name}</Td>
                      <Td>{r.gender}</Td>
                      <Td>{slotLabel(r.departure_slot)}</Td>
                      <Td>{slotLabel(r.return_slot)}</Td>
                      <Td style={{ fontSize: '13px' }}>{r.elective_lecture}</Td>
                      <Td>
                        <DepositBadge confirmed={r.deposit_confirm}>
                          {r.deposit_confirm ? '완료' : '미확인'}
                        </DepositBadge>
                      </Td>
                      <Td>
                        {editingId === r.id ? (
                          <RoomInput
                            value={editRoom}
                            onChange={(e) => setEditRoom(e.target.value)}
                            placeholder="호수"
                            autoFocus
                          />
                        ) : (
                          <RoomBadge assigned={!!r.room_number}>
                            {r.room_number || '미배정'}
                          </RoomBadge>
                        )}
                      </Td>
                      <Td>
                        {editingId === r.id ? (
                          <RoomInput
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="메모"
                          />
                        ) : (
                          <span style={{ fontSize: '13px', color: '#5f6368' }}>{r.room_note || '-'}</span>
                        )}
                      </Td>
                      <Td>
                        {editingId === r.id ? (
                          <BtnGroup>
                            <SaveBtn
                              onClick={() => patchMutation.mutate({ id: r.id, room_number: editRoom, room_note: editNote })}
                              disabled={patchMutation.isPending}
                            >
                              저장
                            </SaveBtn>
                            <CancelBtn onClick={() => setEditingId(null)}>취소</CancelBtn>
                          </BtnGroup>
                        ) : (
                          <EditBtn onClick={() => startEdit(r)}>배정</EditBtn>
                        )}
                      </Td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#9aa0a6' }}>
                        신청자가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </RoomTabContent>
      )}
    </Container>
  );
}

const Container = styled.div`padding: 24px; font-family: 'Pretendard', sans-serif;`;
const Header = styled.div`display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;`;
const Title = styled.h2`font-size: 20px; font-weight: 700; color: #202124; margin: 0;`;
const Stats = styled.div`display: flex; gap: 8px; flex-wrap: wrap;`;
const StatBadge = styled.span<{ color: string }>`
  background: ${(p) => p.color}18; color: ${(p) => p.color};
  border: 1px solid ${(p) => p.color}40;
  padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
`;
const TabBar = styled.div`display: flex; margin-bottom: 16px; border-bottom: 2px solid #e8eaed;`;
const TabBtn = styled.button<{ active: boolean }>`
  padding: 10px 20px; background: none; border: none; font-size: 14px; font-weight: 600;
  cursor: pointer; border-bottom: 2px solid ${(p) => p.active ? '#278f5a' : 'transparent'};
  margin-bottom: -2px; color: ${(p) => p.active ? '#278f5a' : '#9aa0a6'};
`;
const BusTabContent = styled.div``;
const RoomTabContent = styled.div``;
const BusGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px; margin-bottom: 20px;
`;
const BusCard = styled.div<{ full: boolean }>`
  background: white; border-radius: 12px; padding: 16px; text-align: center;
  border: 2px solid ${(p) => p.full ? '#d93025' : '#e8eaed'};
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); position: relative;
`;
const BusLabel = styled.div`font-size: 13px; font-weight: 600; color: #5f6368; margin-bottom: 8px;`;
const BusCount = styled.div`display: flex; align-items: baseline; justify-content: center; gap: 2px;`;
const BusNum = styled.span`font-size: 28px; font-weight: 800; color: #202124;`;
const BusMax = styled.span`font-size: 13px; color: #9aa0a6;`;
const BusBar = styled.div`height: 4px; background: #f1f3f4; border-radius: 2px; margin-top: 8px; overflow: hidden;`;
const BusFill = styled.div<{ pct: number; full: boolean }>`
  height: 100%; border-radius: 2px; width: ${(p) => p.pct}%;
  background: ${(p) => p.full ? '#d93025' : p.pct > 80 ? '#f59e0b' : '#278f5a'};
  transition: width 0.3s;
`;
const FullBadge = styled.div`
  position: absolute; top: 8px; right: 8px;
  background: #d93025; color: white; font-size: 10px; font-weight: 700;
  padding: 2px 6px; border-radius: 4px;
`;
const SlotTag = styled.span<{ slot: string }>`
  padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: ${(p) => p.slot === 'car' ? '#f1f3f4' : '#e8f0fe'};
  color: ${(p) => p.slot === 'car' ? '#5f6368' : '#1d4ed8'};
`;
const RoomSummary = styled.div`display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;`;
const RoomChip = styled.button<{ active: boolean }>`
  padding: 4px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 1px solid;
  background: ${(p) => p.active ? '#2563eb' : 'white'};
  color: ${(p) => p.active ? 'white' : '#3c4043'};
  border-color: ${(p) => p.active ? '#2563eb' : '#dadce0'};
  transition: all 0.15s;
`;
const ClearChip = styled.button`
  padding: 4px 12px; border-radius: 20px; font-size: 13px; cursor: pointer;
  border: 1px solid #dadce0; background: #f8f9fa; color: #d93025;
`;
const Toolbar = styled.div`display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;`;
const SearchRow = styled.div`display: flex; gap: 8px;`;
const SearchInput = styled.input`
  flex: 1; max-width: 320px; padding: 8px 12px; border: 1px solid #dadce0;
  border-radius: 8px; font-size: 14px; outline: none;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
`;
const SearchBtn = styled.button`
  padding: 8px 16px; background: #2563eb; color: white; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
  &:hover { background: #1d4ed8; }
`;
const BulkRow = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;
const BulkInput = styled.input`
  padding: 6px 12px; border: 1px solid #dadce0; border-radius: 6px; font-size: 14px;
  width: 120px; outline: none;
  &:focus { border-color: #2563eb; }
`;
const BulkBtn = styled.button`
  padding: 6px 14px; background: #278f5a; color: white; border: none;
  border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;
  &:disabled { background: #dadce0; cursor: not-allowed; }
  &:not(:disabled):hover { background: #1e7046; }
`;
const LoadingText = styled.div`text-align: center; padding: 40px; color: #9aa0a6;`;
const TableWrapper = styled.div`overflow-x: auto; border-radius: 10px; border: 1px solid #e8eaed;`;
const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 14px;`;
const Th = styled.th`
  padding: 10px 12px; background: #f8f9fa; text-align: left; font-weight: 600;
  color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap;
`;
const Td = styled.td`padding: 10px 12px; border-bottom: 1px solid #f1f3f4; vertical-align: middle;`;
const DepositBadge = styled.span<{ confirmed: boolean }>`
  padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: ${(p) => p.confirmed ? '#e6f4ea' : '#fce8e6'};
  color: ${(p) => p.confirmed ? '#278f5a' : '#d93025'};
`;
const RoomBadge = styled.span<{ assigned: boolean }>`
  padding: 2px 8px; border-radius: 4px; font-size: 13px; font-weight: 600;
  background: ${(p) => p.assigned ? '#e8f0fe' : '#f1f3f4'};
  color: ${(p) => p.assigned ? '#1d4ed8' : '#9aa0a6'};
`;
const RoomInput = styled.input`
  width: 80px; padding: 4px 8px; border: 1px solid #2563eb; border-radius: 4px;
  font-size: 13px; outline: none;
`;
const BtnGroup = styled.div`display: flex; gap: 4px;`;
const EditBtn = styled.button`
  padding: 4px 10px; background: #e8f0fe; color: #1d4ed8; border: none;
  border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer;
  &:hover { background: #d2e3fc; }
`;
const SaveBtn = styled.button`
  padding: 4px 10px; background: #278f5a; color: white; border: none;
  border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer;
  &:disabled { opacity: 0.6; }
`;
const CancelBtn = styled.button`
  padding: 4px 10px; background: #f1f3f4; color: #5f6368; border: none;
  border-radius: 4px; font-size: 13px; cursor: pointer;
`;
