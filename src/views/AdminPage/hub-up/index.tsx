import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';

// ── Types ──────────────────────────────────────────────────
interface Registration {
  id: string; created_at: string; name: string; group_name: string;
  community: string; gender: string; phone: string; birthdate: string;
  departure_slot: string; return_slot: string; elective_lecture: string;
  intercessor_team: string; volunteer_team: string;
  deposit_confirm: boolean; admin_deposit_confirm: boolean;
  room_number: string | null; room_note: string | null;
  leader_name: string;
}
interface SlotStat { value: string; label: string; max_count: number; current_count: number; is_full: boolean; }
interface Stats {
  total: number;
  gender: { male: number; female: number; other: number };
  deposited: number; depositRate: number;
  departureCounts: Record<string, number>;
  returnCounts: Record<string, number>;
  carRoleCounts: Record<string, number>;
  groupCounts: Record<string, { male: number; female: number; total: number }>;
  volunteerCount: number; volunteerCounts: Record<string, number>;
  electiveCounts: Record<string, number>;
  communityCounts: Record<string, number>;
}

const sl = (slot: string) => slot === 'car' ? '자차' : slot.replace('bus-', '');

// ── Excel Export ──────────────────────────────────────────
function exportToExcel(registrations: Registration[], filename: string) {
  const headers = ['이름','그룹','공동체','성별','생년월일','연락처','순장','출발','복귀','선택강의','자원봉사','중보','자기입금','입금확인','숙소','메모','신청일시'];
  const rows = registrations.map(r => [
    r.name, r.group_name, r.community, r.gender, r.birthdate, r.phone, r.leader_name,
    sl(r.departure_slot), sl(r.return_slot), r.elective_lecture,
    r.volunteer_team, r.intercessor_team,
    r.deposit_confirm ? 'O' : 'X',
    r.admin_deposit_confirm ? 'O' : 'X',
    r.room_number || '', r.room_note || '',
    new Date(r.created_at).toLocaleString('ko-KR'),
  ]);
  const csv = [headers, ...rows].map(row =>
    row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportTshirtExcel(orders: any[]) {
  const headers = ['이름','그룹','연락처','주문내역','총수량','총액','자기신고','관리자확인','주문일시'];
  const rows = orders.map(o => {
    const itemsStr = (o.items || []).map((i:any) => `${i.color} ${i.size} ${i.quantity}개`).join(', ');
    const totalQty = (o.items || []).reduce((acc:number, i:any) => acc + i.quantity, 0);
    const totalPrice = (o.items || []).reduce((acc:number, i:any) => acc + i.quantity * (i.price || 20000), 0);
    return [
      o.name, o.group_name, o.phone, itemsStr, totalQty, totalPrice,
      o.deposit_confirm ? 'O' : 'X',
      o.status === 'confirmed' ? '완료' : (o.status === 'pending' ? '확인중' : '취소'),
      new Date(o.created_at).toLocaleString('ko-KR')
    ];
  });
  const csv = [headers, ...rows].map(row =>
    row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `허브업_티셔츠_주문내역.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function HubUpAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stats' | 'deposit' | 'list' | 'room' | 'bus' | 'tshirt'>('stats');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | '1' | '2' | '3'>('all');

  // 입금 기간 정의
  const DEPOSIT_PERIODS = [
    { key: '1', label: '1차', start: new Date('2026-04-12T00:00:00+09:00'), end: new Date('2026-04-15T09:00:00+09:00') },
    { key: '2', label: '2차', start: new Date('2026-04-15T09:01:00+09:00'), end: new Date('2026-04-20T09:00:00+09:00') },
    { key: '3', label: '3차', start: new Date('2026-04-20T09:01:00+09:00'), end: new Date('2026-04-27T09:00:00+09:00') },
  ];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState('');
  const [editNote, setEditNote] = useState('');
  const [bulkRoom, setBulkRoom] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof Registration | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof Registration) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sortIcon = (key: keyof Registration) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕';

  const { data: stats, error: statsError, isLoading: isStatsLoading } = useQuery<Stats>({
    queryKey: ['hub-up-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hub-up/stats');
      if (!res.ok) throw new Error('데이터 로드 실패');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: busStats } = useQuery<{ slotStats: SlotStat[]; registrations: Registration[] }>({
    queryKey: ['hub-up-bus-stats'],
    queryFn: () => fetch('/api/admin/hub-up/bus-stats').then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: registrations = [], isLoading } = useQuery<Registration[]>({
    queryKey: ['hub-up-registrations', appliedSearch, roomFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (appliedSearch) p.set('search', appliedSearch);
      if (roomFilter) p.set('room', roomFilter);
      const res = await fetch(`/api/admin/hub-up/registrations?${p}`);
      if (!res.ok) throw new Error('조회 실패');
      return res.json();
    },
  });

  const { data: tshirts = [], isLoading: isTshirtsLoading } = useQuery<any[]>({
    queryKey: ['hub-up-tshirts'],
    queryFn: () => fetch('/api/admin/hub-up/tshirts').then(r => r.json()),
  });

  const depositMutation = useMutation({
    mutationFn: async ({ id, confirmed }: { id: string; confirmed: boolean }) => {
      const res = await fetch(`/api/admin/hub-up/registrations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_deposit_confirm: confirmed }),
      });
      if (!res.ok) throw new Error('저장 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-stats'] });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, room_number, room_note }: { id: string; room_number: string; room_note: string }) => {
      const res = await fetch(`/api/admin/hub-up/registrations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_number: room_number || null, room_note: room_note || null }),
      });
      if (!res.ok) throw new Error('저장 실패');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] }); setEditingId(null); },
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/admin/hub-up/registrations/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_number: bulkRoom || null }),
        })
      ));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] }); setSelectedIds(new Set()); setBulkRoom(''); },
  });

  const bulkDepositMutation = useMutation({
    mutationFn: async (confirmed: boolean) => {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/admin/hub-up/registrations/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_deposit_confirm: confirmed }),
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-stats'] });
      setSelectedIds(new Set());
    },
  });

  const tshirtDepositMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await fetch(`/api/admin/hub-up/tshirts`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error('저장 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-tshirts'] });
      setSelectedIds(new Set());
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/hub-up/registrations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('취소 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-stats'] });
    },
  });

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (list: Registration[]) => setSelectedIds(selectedIds.size === list.length ? new Set() : new Set(list.map(r => r.id)));
  const startEdit = (r: Registration) => { setEditingId(r.id); setEditRoom(r.room_number || ''); setEditNote(r.room_note || ''); };

  const sortedRegistrations = useMemo(() => {
    if (!sortKey) return registrations;
    return [...registrations].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'ko');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [registrations, sortKey, sortDir]);

  const total = registrations.length;
  const assigned = registrations.filter(r => r.room_number).length;
  const roomGroups = registrations.reduce<Record<string, number>>((acc, r) => {
    const k = r.room_number || '미배정'; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  const filteredDeposit = registrations.filter(r => {
    const matchSearch = !appliedSearch || r.name.includes(appliedSearch) || r.group_name.includes(appliedSearch) || r.phone.includes(appliedSearch);
    const matchDeposit = depositFilter === 'all' || (depositFilter === 'confirmed' && r.admin_deposit_confirm) || (depositFilter === 'pending' && !r.admin_deposit_confirm);
    const matchPeriod = (() => {
      if (periodFilter === 'all') return true;
      const createdAt = new Date(r.created_at);
      const currentPeriodIdx = DEPOSIT_PERIODS.findIndex(p => p.key === periodFilter);
      // 현재 기간까지의 모든 기간을 순회
      for (let i = 0; i <= currentPeriodIdx; i++) {
        const p = DEPOSIT_PERIODS[i];
        const inThisPeriod = createdAt >= p.start && createdAt <= p.end;
        if (inThisPeriod) {
          // 현재 선택한 기간이면 무조건 포함
          if (i === currentPeriodIdx) return true;
          // 이전 기간이면 미확인자만 포함 (누적)
          if (!r.admin_deposit_confirm) return true;
        }
      }
      return false;
    })();
    return matchSearch && matchDeposit && matchPeriod;
  });

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

  return (
    <Wrap>
      <PageHeader>
        <PageTitle>🎪 허브업 관리</PageTitle>
        <HeaderBadges>
          <Badge color="#202124">전체 {stats?.total ?? 0}명</Badge>
          <Badge color="#278f5a">입금 {stats?.deposited ?? 0}명</Badge>
          <Badge color="#d93025">미입금 {(stats?.total ?? 0) - (stats?.deposited ?? 0)}명</Badge>
        </HeaderBadges>
        <ExportBtn onClick={() => exportToExcel(registrations, '허브업_신청자_전체')}>
          📥 전체 엑셀 다운로드
        </ExportBtn>
      </PageHeader>

      <TabBar>
        <Tab active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>📊 통계</Tab>
        <Tab active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>💰 입금 확인</Tab>
        <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>📋 전체 명단</Tab>
        <Tab active={activeTab === 'room'} onClick={() => setActiveTab('room')}>🏠 숙소 배정</Tab>
        <Tab active={activeTab === 'bus'} onClick={() => setActiveTab('bus')}>🚌 버스 현황</Tab>
        <Tab active={activeTab === 'tshirt'} onClick={() => setActiveTab('tshirt')}>👕 단체티 주문</Tab>
      </TabBar>

      <TabContent>

        {/* ── 통계 탭 ── */}
        {activeTab === 'stats' && (
          <StatsWrap>
            {isStatsLoading ? <Loading>불러오는 중...</Loading> : statsError ? <Loading style={{color:'#d93025'}}>데이터를 불러올 수 없습니다.</Loading> : !stats ? <Loading>데이터가 없습니다.</Loading> : (
              <>
                <KpiRow>
                  <KpiCard accent="#202124"><KpiNum>{stats.total}</KpiNum><KpiLabel>총 접수</KpiLabel></KpiCard>
                  <KpiCard accent="#2563eb"><KpiNum style={{color:'#2563eb'}}>{stats.gender?.male ?? 0}</KpiNum><KpiLabel>남</KpiLabel></KpiCard>
                  <KpiCard accent="#d93025"><KpiNum style={{color:'#d93025'}}>{stats.gender?.female ?? 0}</KpiNum><KpiLabel>여</KpiLabel></KpiCard>
                  <KpiCard accent="#278f5a"><KpiNum style={{color:'#278f5a'}}>{stats.deposited}</KpiNum><KpiLabel>입금완료</KpiLabel></KpiCard>
                  <KpiCard accent="#f59e0b"><KpiNum style={{color:'#f59e0b'}}>{stats.depositRate}%</KpiNum><KpiLabel>입금률</KpiLabel></KpiCard>
                </KpiRow>
                <Card>
                  <CardTitle>성별 비율</CardTitle>
                  <GenderBarWrap>
                    <GenderSeg w={pct(stats.gender?.male ?? 0, stats.total)} color="#2563eb" />
                    <GenderSeg w={pct(stats.gender?.female ?? 0, stats.total)} color="#d93025" />
                  </GenderBarWrap>
                  <GenderLegend>
                    <GenderItem color="#2563eb">남 {stats.gender?.male ?? 0}명 ({pct(stats.gender?.male ?? 0, stats.total)}%)</GenderItem>
                    <GenderItem color="#d93025">여 {stats.gender?.female ?? 0}명 ({pct(stats.gender?.female ?? 0, stats.total)}%)</GenderItem>
                  </GenderLegend>
                </Card>
                <TwoCol>
                  <Card>
                    <CardTitle>[출발] 차량 현황</CardTitle>
                    <DenseTable><thead><tr><DTh>슬롯</DTh><DTh right>인원</DTh><DTh right>비율</DTh></tr></thead>
                      <tbody>{Object.entries(stats.departureCounts || {}).sort(([a],[b])=>a.localeCompare(b)).map(([slot, cnt]) => (
                        <tr key={slot}><DTd>{sl(slot)}</DTd><DTd right><strong>{cnt}</strong></DTd><DTd right>{pct(cnt, stats.total)}%</DTd></tr>
                      ))}</tbody>
                    </DenseTable>
                  </Card>
                  <Card>
                    <CardTitle>[복귀] 차량 현황</CardTitle>
                    <DenseTable><thead><tr><DTh>슬롯</DTh><DTh right>인원</DTh><DTh right>비율</DTh></tr></thead>
                      <tbody>{Object.entries(stats.returnCounts || {}).sort(([a],[b])=>a.localeCompare(b)).map(([slot, cnt]) => (
                        <tr key={slot}><DTd>{sl(slot)}</DTd><DTd right><strong>{cnt}</strong></DTd><DTd right>{pct(cnt, stats.total)}%</DTd></tr>
                      ))}</tbody>
                    </DenseTable>
                  </Card>
                </TwoCol>
                <Card>
                  <CardTitle>그룹별 인원</CardTitle>
                  <DenseTable><thead><tr><DTh>그룹</DTh><DTh right>남</DTh><DTh right>여</DTh><DTh right>합계</DTh><DTh right>비율</DTh></tr></thead>
                    <tbody>{(() => {
                      const FIXED = ['MC', '그룹장', '타공동체', '타교회', '기타'];
                      const entries = Object.entries(stats.groupCounts || {});
                      const fixed = entries.filter(([g]) => FIXED.includes(g)).sort(([a],[b]) => FIXED.indexOf(a) - FIXED.indexOf(b));
                      const rest = entries.filter(([g]) => !FIXED.includes(g)).sort(([a],[b]) => a.localeCompare(b, 'ko'));
                      return [...rest, ...fixed].map(([g, c]) => (
                        <tr key={g}><DTd>{g}</DTd><DTd right>{c.male}</DTd><DTd right>{c.female}</DTd><DTd right><strong>{c.total}</strong></DTd><DTd right>{pct(c.total, stats.total)}%</DTd></tr>
                      ));
                    })()}</tbody>
                  </DenseTable>
                </Card>
                <ThreeCol>
                  <Card>
                    <CardTitle>팀 섬김</CardTitle>
                    <div style={{marginBottom:'10px'}}>
                      <TeamNum>{stats.volunteerCount}</TeamNum>
                      <TeamLabel>전체 자원봉사자</TeamLabel>
                    </div>
                    <VolunteerTable>
                      <thead>
                        <tr>
                          <VolTh>팀</VolTh>
                          <VolTh>남</VolTh>
                          <VolTh>여</VolTh>
                          <VolTh>총합</VolTh>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats.volunteerCounts || {}).map(([team, cnt]) => {
                          const members = registrations.filter(r => r.volunteer_team === team);
                          const male = members.filter(r => r.gender === '남자' || r.gender === 'M').length;
                          const female = members.filter(r => r.gender === '여자' || r.gender === 'F').length;
                          return (
                            <tr key={team}>
                              <VolTd>{team}</VolTd>
                              <VolTd>{male}</VolTd>
                              <VolTd>{female}</VolTd>
                              <VolTdBold>{cnt as number}</VolTdBold>
                            </tr>
                          );
                        })}
                      </tbody>
                    </VolunteerTable>
                  </Card>
                  <Card>
                    <CardTitle>선택강의</CardTitle>
                    {Object.entries(stats.electiveCounts || {}).map(([lec, cnt]) => (
                      <LecRow key={lec}><LecName>{lec}</LecName><LecCnt>{cnt}명</LecCnt><LecBar><LecFill w={pct(cnt, stats.total)} /></LecBar></LecRow>
                    ))}
                  </Card>
                  <Card>
                    <CardTitle>공동체별</CardTitle>
                    <DenseTable><thead><tr><DTh>공동체</DTh><DTh right>인원</DTh></tr></thead>
                      <tbody>{Object.entries(stats.communityCounts || {}).sort(([,a],[,b])=>b-a).map(([c, cnt]) => (
                        <tr key={c}><DTd>{c}</DTd><DTd right><strong>{cnt}</strong></DTd></tr>
                      ))}</tbody>
                    </DenseTable>
                  </Card>
                </ThreeCol>
              </>
            )}
          </StatsWrap>
        )}

        {/* ── 입금 확인 탭 ── */}
        {activeTab === 'deposit' && (
          <div>
            <PeriodBar>
              <PeriodBtn active={periodFilter === 'all'} onClick={() => setPeriodFilter('all')}>전체</PeriodBtn>
              {DEPOSIT_PERIODS.map(p => (
                <PeriodBtn key={p.key} active={periodFilter === p.key} onClick={() => setPeriodFilter(p.key as '1'|'2'|'3')}>
                  {p.label}
                  <PeriodDate>{p.start.toLocaleDateString('ko-KR', {month:'numeric',day:'numeric'})} ~ {p.end.toLocaleDateString('ko-KR', {month:'numeric',day:'numeric'})}</PeriodDate>
                </PeriodBtn>
              ))}
            </PeriodBar>
            <DepositSummary>
              <RoomStatItem><RoomStatNum>{filteredDeposit.length}</RoomStatNum><RoomStatLabel>조회된 신청</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#278f5a'}}>{filteredDeposit.filter(r => r.admin_deposit_confirm).length}</RoomStatNum><RoomStatLabel>입금완료</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#d93025'}}>{filteredDeposit.filter(r => !r.admin_deposit_confirm).length}</RoomStatNum><RoomStatLabel>미확인</RoomStatLabel></RoomStatItem>
            </DepositSummary>

            <ToolRow>
              <SearchBox>
                <SearchIn placeholder="이름 / 그룹 / 연락처" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setAppliedSearch(search)} />
                <SearchBtn onClick={() => setAppliedSearch(search)}>검색</SearchBtn>
                {appliedSearch && <SearchBtn onClick={() => { setSearch(''); setAppliedSearch(''); }} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>}
                <FilterBtn active={depositFilter==='all'} onClick={() => setDepositFilter('all')}>전체</FilterBtn>
                <FilterBtn active={depositFilter==='confirmed'} onClick={() => setDepositFilter('confirmed')}>입금완료</FilterBtn>
                <FilterBtn active={depositFilter==='pending'} onClick={() => setDepositFilter('pending')}>미확인</FilterBtn>
              </SearchBox>
              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                {selectedIds.size > 0 && (
                  <>
                    <span style={{fontSize:'13px',color:'#5f6368'}}>{selectedIds.size}명 선택</span>
                    <BulkBtn onClick={() => bulkDepositMutation.mutate(true)} disabled={bulkDepositMutation.isPending}>
                      ✅ 일괄 입금완료
                    </BulkBtn>
                    <CancelBtn onClick={() => bulkDepositMutation.mutate(false)}>
                      일괄 취소
                    </CancelBtn>
                  </>
                )}
                <ExportBtn onClick={() => exportToExcel(filteredDeposit, '허브업_입금현황')}>
                  📥 엑셀 다운로드
                </ExportBtn>
              </div>
            </ToolRow>

            {isLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th><input type="checkbox" checked={selectedIds.size===filteredDeposit.length&&filteredDeposit.length>0} onChange={() => toggleAll(filteredDeposit)}/></Th>
                      <Th>이름</Th><Th>그룹</Th><Th>연락처</Th><Th>자기신고</Th><Th>입금확인</Th><Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposit.map(r => (
                      <tr key={r.id} style={{background: r.admin_deposit_confirm ? '#f0fdf4' : undefined}}>
                        <Td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)}/></Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td style={{fontSize:'13px'}}>{r.phone}</Td>
                        <Td><DepBadge ok={r.deposit_confirm}>{r.deposit_confirm ? '입금했다고 함' : '미신고'}</DepBadge></Td>
                        <Td><DepBadge ok={r.admin_deposit_confirm}>{r.admin_deposit_confirm ? '입금완료' : '확인중'}</DepBadge></Td>
                        <Td>
                          {r.admin_deposit_confirm
                            ? <CancelBtn onClick={() => depositMutation.mutate({ id: r.id, confirmed: false })}>취소</CancelBtn>
                            : <SaveBtn onClick={() => depositMutation.mutate({ id: r.id, confirmed: true })} disabled={depositMutation.isPending}>입금완료</SaveBtn>}
                        </Td>
                      </tr>
                    ))}
                    {filteredDeposit.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        )}

        {/* ── 전체 명단 탭 ── */}
        {activeTab === 'list' && (
          <div>
            <ToolRow>
              <SearchBox>
                <SearchIn placeholder="이름 / 그룹 / 연락처" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setAppliedSearch(search)} />
                <SearchBtn onClick={() => setAppliedSearch(search)}>검색</SearchBtn>
                {appliedSearch && <SearchBtn onClick={() => { setSearch(''); setAppliedSearch(''); }} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>}
                <ExportBtn onClick={() => exportToExcel(registrations, '허브업_전체명단')}>📥 엑셀 다운로드</ExportBtn>
              </SearchBox>
            </ToolRow>
            {isLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <SortTh onClick={() => handleSort('name')}>이름{sortIcon('name')}</SortTh>
                      <SortTh onClick={() => handleSort('group_name')}>그룹{sortIcon('group_name')}</SortTh>
                      <SortTh onClick={() => handleSort('community')}>공동체{sortIcon('community')}</SortTh>
                      <SortTh onClick={() => handleSort('gender')}>성별{sortIcon('gender')}</SortTh>
                      <Th>연락처</Th>
                      <SortTh onClick={() => handleSort('departure_slot')}>출발{sortIcon('departure_slot')}</SortTh>
                      <SortTh onClick={() => handleSort('return_slot')}>복귀{sortIcon('return_slot')}</SortTh>
                      <Th>선택강의</Th><Th>자원봉사</Th>
                      <SortTh onClick={() => handleSort('admin_deposit_confirm')}>입금{sortIcon('admin_deposit_confirm')}</SortTh>
                      <SortTh onClick={() => handleSort('room_number')}>숙소{sortIcon('room_number')}</SortTh>
                      <SortTh onClick={() => handleSort('created_at')}>신청일{sortIcon('created_at')}</SortTh>
                      <Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRegistrations.map((r, i) => (
                      <tr key={r.id}>
                        <Td style={{color:'#9aa0a6',fontSize:'12px'}}>{i+1}</Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td style={{fontSize:'13px'}}>{r.community}</Td>
                        <Td>{r.gender}</Td>
                        <Td style={{fontSize:'13px'}}>{r.phone}</Td>
                        <Td><SlotChip>{sl(r.departure_slot)}</SlotChip></Td>
                        <Td style={{fontSize:'13px'}}>{sl(r.return_slot)}</Td>
                        <Td style={{fontSize:'13px'}}>{r.elective_lecture || '-'}</Td>
                        <Td style={{fontSize:'13px'}}>{r.volunteer_team || '-'}</Td>
                        <Td><DepBadge ok={r.admin_deposit_confirm}>{r.admin_deposit_confirm ? '입금완료' : '미확인'}</DepBadge></Td>
                        <Td><RoomBadge ok={!!r.room_number}>{r.room_number || '미배정'}</RoomBadge></Td>
                        <Td style={{fontSize:'12px',color:'#9aa0a6'}}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</Td>
                        <Td>
                          <CancelBtn
                            onClick={() => {
                              if (confirm(`${r.name}님의 접수를 취소하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                                cancelMutation.mutate(r.id);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                          >
                            접수취소
                          </CancelBtn>
                        </Td>
                      </tr>
                    ))}
                    {registrations.length === 0 && <tr><td colSpan={14} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        )}

        {/* ── 버스 현황 탭 ── */}
        {activeTab === 'bus' && (
          <div>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'8px'}}>
              <ExportBtn onClick={() => exportToExcel(busStats?.registrations || [], '허브업_버스명단')}>📥 엑셀 다운로드</ExportBtn>
            </div>
            <BusGrid>
              {(busStats?.slotStats || []).map(s => (
                <BusCard key={s.value} full={s.is_full}>
                  <BusCardLabel>{s.label}</BusCardLabel>
                  <BusCardCount><BusNum>{s.current_count}</BusNum><BusMax>/ {s.max_count > 0 ? s.max_count : '∞'}</BusMax></BusCardCount>
                  {s.max_count > 0 && <BusBarWrap><BusFill pct={Math.min((s.current_count/s.max_count)*100,100)} full={s.is_full} /></BusBarWrap>}
                  {s.is_full && <FullTag>마감</FullTag>}
                </BusCard>
              ))}
            </BusGrid>
            <TableWrap>
              <Table>
                <thead><tr><Th>이름</Th><Th>그룹</Th><Th>출발</Th><Th>복귀</Th></tr></thead>
                <tbody>
                  {(busStats?.registrations || []).map(r => (
                    <tr key={r.id}>
                      <Td><strong>{r.name}</strong></Td>
                      <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                      <Td><SlotChip>{sl(r.departure_slot)}</SlotChip></Td>
                      <Td>{sl(r.return_slot)}</Td>
                    </tr>
                  ))}
                  {!busStats?.registrations?.length && <tr><td colSpan={4} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        )}

        {/* ── 숙소 배정 탭 ── */}
        {activeTab === 'room' && (
          <div>
            <RoomStats>
              <RoomStatItem><RoomStatNum>{total}</RoomStatNum><RoomStatLabel>전체</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#278f5a'}}>{assigned}</RoomStatNum><RoomStatLabel>배정완료</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#d93025'}}>{total-assigned}</RoomStatNum><RoomStatLabel>미배정</RoomStatLabel></RoomStatItem>
            </RoomStats>
            <RoomChips>
              {Object.entries(roomGroups).sort(([a],[b])=>a.localeCompare(b)).map(([room, cnt]) => (
                <RoomChip key={room} active={roomFilter===(room==='미배정'?'unassigned':room)}
                  onClick={() => setRoomFilter(roomFilter===(room==='미배정'?'unassigned':room)?'':(room==='미배정'?'unassigned':room))}>
                  {room} ({cnt})
                </RoomChip>
              ))}
              {roomFilter && <ClearChip onClick={()=>setRoomFilter('')}>✕ 해제</ClearChip>}
            </RoomChips>
            <ToolRow>
              <SearchBox>
                <SearchIn placeholder="이름 / 그룹 / 연락처" value={search}
                  onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setAppliedSearch(search)} />
                <SearchBtn onClick={()=>setAppliedSearch(search)}>검색</SearchBtn>
                {appliedSearch && <SearchBtn onClick={()=>{setSearch('');setAppliedSearch('');}} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>}
                <ExportBtn onClick={() => exportToExcel(registrations, '허브업_숙소배정')}>📥 엑셀 다운로드</ExportBtn>
              </SearchBox>
              {selectedIds.size > 0 && (
                <BulkBox>
                  <span style={{fontSize:'13px',color:'#5f6368'}}>{selectedIds.size}명 선택</span>
                  <BulkIn placeholder="호수" value={bulkRoom} onChange={e=>setBulkRoom(e.target.value)} />
                  <BulkBtn disabled={!bulkRoom||bulkMutation.isPending} onClick={()=>bulkMutation.mutate()}>일괄 배정</BulkBtn>
                </BulkBox>
              )}
            </ToolRow>
            {isLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th style={{width:36}}><input type="checkbox" checked={selectedIds.size===registrations.length&&registrations.length>0} onChange={() => toggleAll(registrations)}/></Th>
                      <Th>이름</Th><Th>그룹</Th><Th>성별</Th><Th>출발</Th><Th>복귀</Th><Th>강의</Th><Th>입금</Th><Th>숙소</Th><Th>메모</Th><Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map(r => (
                      <tr key={r.id}>
                        <Td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={()=>toggleSelect(r.id)}/></Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td>{r.gender}</Td>
                        <Td>{sl(r.departure_slot)}</Td>
                        <Td>{sl(r.return_slot)}</Td>
                        <Td style={{fontSize:'13px'}}>{r.elective_lecture}</Td>
                        <Td><DepBadge ok={r.admin_deposit_confirm}>{r.admin_deposit_confirm ? '입금완료' : '미확인'}</DepBadge></Td>
                        <Td>
                          {editingId===r.id
                            ? <RoomIn value={editRoom} onChange={e=>setEditRoom(e.target.value)} placeholder="호수" autoFocus/>
                            : <RoomBadge ok={!!r.room_number}>{r.room_number||'미배정'}</RoomBadge>}
                        </Td>
                        <Td>
                          {editingId===r.id
                            ? <RoomIn value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="메모"/>
                            : <span style={{fontSize:'13px',color:'#5f6368'}}>{r.room_note||'-'}</span>}
                        </Td>
                        <Td>
                          {editingId===r.id
                            ? <BtnGrp>
                                <SaveBtn onClick={()=>patchMutation.mutate({id:r.id,room_number:editRoom,room_note:editNote})} disabled={patchMutation.isPending}>저장</SaveBtn>
                                <CancelBtn onClick={()=>setEditingId(null)}>취소</CancelBtn>
                              </BtnGrp>
                            : <EditBtn onClick={()=>startEdit(r)}>배정</EditBtn>}
                        </Td>
                      </tr>
                    ))}
                    {registrations.length===0 && <tr><td colSpan={11} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        )}

        {/* ── 티셔츠 주문 탭 ── */}
        {activeTab === 'tshirt' && (
          <div>
            <DepositSummary>
              <RoomStatItem><RoomStatNum>{tshirts.length}</RoomStatNum><RoomStatLabel>전체 주문자</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#278f5a'}}>{tshirts.filter((t:any) => t.status === 'confirmed').length}</RoomStatNum><RoomStatLabel>입금완료</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#d93025'}}>{tshirts.filter((t:any) => t.status !== 'confirmed').length}</RoomStatNum><RoomStatLabel>미확인/취소</RoomStatLabel></RoomStatItem>
              <RoomStatItem>
                <RoomStatNum>
                  {tshirts.reduce((acc: number, t: any) => acc + (t.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0), 0)}장
                </RoomStatNum>
                <RoomStatLabel>총 판매 티셔츠</RoomStatLabel>
              </RoomStatItem>
            </DepositSummary>

            {(() => {
              const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
              const COLORS = ['white', 'black', 'navy'] as const;
              const colorTotals: Record<string, number> = { white: 0, black: 0, navy: 0 };
              const sizeTotals: Record<string, number> = {};
              // 색상×사이즈 교차 집계
              const colorSizeTotals: Record<string, Record<string, number>> = {
                white: {}, black: {}, navy: {},
              };
              SIZES.forEach(s => {
                sizeTotals[s] = 0;
                COLORS.forEach(c => { colorSizeTotals[c][s] = 0; });
              });
              tshirts.forEach((t: any) => {
                (t.items || []).forEach((item: any) => {
                  const c = item.color?.toLowerCase();
                  if (COLORS.includes(c)) {
                    colorTotals[c] += item.quantity;
                    if (colorSizeTotals[c][item.size] !== undefined)
                      colorSizeTotals[c][item.size] += item.quantity;
                  }
                  if (sizeTotals[item.size] !== undefined) sizeTotals[item.size] += item.quantity;
                });
              });
              return (
                <div>
                  <TshirtStatsWrap>
                    <TshirtStatGroup>
                      <TshirtStatTitle>색상별</TshirtStatTitle>
                      <TshirtStatRow>
                        <TshirtStatItem color="#fff" border>
                          <TshirtStatLabel>White</TshirtStatLabel>
                          <TshirtStatNum>{colorTotals.white}장</TshirtStatNum>
                        </TshirtStatItem>
                        <TshirtStatItem color="#222">
                          <TshirtStatLabel style={{color:'#fff'}}>Black</TshirtStatLabel>
                          <TshirtStatNum style={{color:'#fff'}}>{colorTotals.black}장</TshirtStatNum>
                        </TshirtStatItem>
                        <TshirtStatItem color="#1e3a5f">
                          <TshirtStatLabel style={{color:'#fff'}}>Navy</TshirtStatLabel>
                          <TshirtStatNum style={{color:'#fff'}}>{colorTotals.navy}장</TshirtStatNum>
                        </TshirtStatItem>
                      </TshirtStatRow>
                    </TshirtStatGroup>
                    <TshirtStatGroup>
                      <TshirtStatTitle>사이즈별</TshirtStatTitle>
                      <TshirtStatRow>
                        {SIZES.map(s => (
                          <TshirtStatItem key={s} color="#f8f9fa" border>
                            <TshirtStatLabel>{s}</TshirtStatLabel>
                            <TshirtStatNum>{sizeTotals[s]}장</TshirtStatNum>
                          </TshirtStatItem>
                        ))}
                      </TshirtStatRow>
                    </TshirtStatGroup>
                  </TshirtStatsWrap>
                  <TshirtCrossTable>
                    <thead>
                      <tr>
                        <TshirtCrossTh>색상 \ 사이즈</TshirtCrossTh>
                        {SIZES.map(s => <TshirtCrossTh key={s}>{s}</TshirtCrossTh>)}
                        <TshirtCrossTh>합계</TshirtCrossTh>
                      </tr>
                    </thead>
                    <tbody>
                      {COLORS.map(c => (
                        <tr key={c}>
                          <TshirtCrossTd bold>
                            <ColorDot color={c === 'white' ? '#e8eaed' : c === 'black' ? '#222' : '#1e3a5f'} />
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </TshirtCrossTd>
                          {SIZES.map(s => (
                            <TshirtCrossTd key={s}>{colorSizeTotals[c][s] || 0}</TshirtCrossTd>
                          ))}
                          <TshirtCrossTd bold>{colorTotals[c]}</TshirtCrossTd>
                        </tr>
                      ))}
                      <tr>
                        <TshirtCrossTd bold>합계</TshirtCrossTd>
                        {SIZES.map(s => <TshirtCrossTd key={s} bold>{sizeTotals[s]}</TshirtCrossTd>)}
                        <TshirtCrossTd bold>{Object.values(colorTotals).reduce((a,b)=>a+b,0)}</TshirtCrossTd>
                      </tr>
                    </tbody>
                  </TshirtCrossTable>
                </div>
              );
            })()}

            <ToolRow>
              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end'}}>
                {selectedIds.size > 0 && (
                  <>
                    <span style={{fontSize:'13px',color:'#5f6368'}}>{selectedIds.size}명 선택</span>
                    <BulkBtn onClick={() => tshirtDepositMutation.mutate({ ids: Array.from(selectedIds), status: 'confirmed' })} disabled={tshirtDepositMutation.isPending}>
                      ✅ 관리자 입금확인 완료
                    </BulkBtn>
                    <CancelBtn onClick={() => tshirtDepositMutation.mutate({ ids: Array.from(selectedIds), status: 'pending' })}>
                      확인 취소
                    </CancelBtn>
                  </>
                )}
                <ExportBtn onClick={() => exportTshirtExcel(tshirts)}>
                  📥 티셔츠 내역 엑셀
                </ExportBtn>
              </div>
            </ToolRow>

            {isTshirtsLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th><input type="checkbox" checked={tshirts.length > 0 && selectedIds.size === tshirts.length} onChange={() => toggleAll(tshirts)} /></Th>
                      <Th>이름</Th><Th>그룹</Th><Th>연락처</Th><Th>주문내역</Th><Th>총수량(총액)</Th><Th>자기신고</Th><Th>입금확인</Th><Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {tshirts.map((t:any) => (
                      <tr key={t.id} style={{background: t.status === 'confirmed' ? '#f0fdf4' : undefined}}>
                        <Td><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} /></Td>
                        <Td><strong>{t.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{t.group_name}</Td>
                        <Td style={{fontSize:'13px'}}>{t.phone}</Td>
                        <Td style={{fontSize:'13px'}}>
                          {t.items?.map((item:any, idx:number) => (
                            <div key={idx}>{item.color} {item.size} ({item.quantity}장)</div>
                          ))}
                        </Td>
                        <Td>
                          <strong>{t.items?.reduce((sum:number, item:any)=>sum+item.quantity, 0)}장</strong>
                          <div style={{fontSize:'11px', color:'#5f6368'}}>
                            ({(t.items?.reduce((sum:number, item:any) => sum + item.quantity * (item.price || 20000), 0) || 0).toLocaleString()}원)
                          </div>
                        </Td>
                        <Td><DepBadge ok={t.deposit_confirm}>{t.deposit_confirm ? '입금했다고 함' : '미신고'}</DepBadge></Td>
                        <Td><DepBadge ok={t.status === 'confirmed'}>{t.status === 'confirmed' ? '입금완료' : '확인중'}</DepBadge></Td>
                        <Td>
                          <BtnGrp>
                            {t.status === 'confirmed'
                              ? <CancelBtn onClick={()=>tshirtDepositMutation.mutate({ids: [t.id], status: 'pending'})}>취소</CancelBtn>
                              : <SaveBtn onClick={()=>tshirtDepositMutation.mutate({ids: [t.id], status: 'confirmed'})}>입금완료</SaveBtn>
                            }
                          </BtnGrp>
                        </Td>
                      </tr>
                    ))}
                    {tshirts.length === 0 && <tr><td colSpan={9} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>주문자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        )}
      </TabContent>
    </Wrap>
  );
}

// ── Styles ──────────────────────────────────────────────────
const Wrap = styled.div`padding: 20px; font-family: 'Pretendard', sans-serif; background: #f8f9fa; min-height: 100%;`;
const PageHeader = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;`;
const PageTitle = styled.h2`font-size: 18px; font-weight: 700; color: #202124; margin: 0;`;
const HeaderBadges = styled.div`display: flex; gap: 6px;`;
const Badge = styled.span<{color:string}>`padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${p=>p.color}18; color: ${p=>p.color}; border: 1px solid ${p=>p.color}30;`;
const ExportBtn = styled.button`padding: 7px 14px; background: #1d4ed8; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; margin-left: auto; &:hover{background:#1e40af;}`;
const TabBar = styled.div`display: flex; border-bottom: 2px solid #e8eaed; margin-bottom: 20px; gap: 2px;`;
const Tab = styled.button<{active:boolean}>`padding: 10px 16px; background: none; border: none; font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid ${p=>p.active?'#278f5a':'transparent'}; margin-bottom: -2px; color: ${p=>p.active?'#278f5a':'#9aa0a6'};`;
const TabContent = styled.div``;
const Loading = styled.div`text-align: center; padding: 40px; color: #9aa0a6;`;
const StatsWrap = styled.div`display: flex; flex-direction: column; gap: 14px;`;
const KpiRow = styled.div`display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;`;
const KpiCard = styled.div<{accent:string}>`background: white; border-radius: 10px; padding: 16px; text-align: center; border-top: 3px solid ${p=>p.accent}; box-shadow: 0 1px 4px rgba(0,0,0,0.06);`;
const KpiNum = styled.div`font-size: 28px; font-weight: 800; color: #202124;`;
const KpiLabel = styled.div`font-size: 12px; color: #9aa0a6; margin-top: 4px;`;
const Card = styled.div`background: white; border-radius: 10px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);`;
const CardTitle = styled.div`font-size: 12px; font-weight: 700; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;`;
const GenderBarWrap = styled.div`height: 10px; border-radius: 5px; overflow: hidden; display: flex; background: #f1f3f4; margin-bottom: 8px;`;
const GenderSeg = styled.div<{w:number;color:string}>`height: 100%; width: ${p=>p.w}%; background: ${p=>p.color};`;
const GenderLegend = styled.div`display: flex; gap: 16px;`;
const GenderItem = styled.span<{color:string}>`font-size: 13px; font-weight: 600; color: ${p=>p.color};`;
const TwoCol = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 14px;`;
const ThreeCol = styled.div`display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;`;
const DenseTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const DTh = styled.th<{right?:boolean}>`padding: 6px 8px; background: #f8f9fa; text-align: ${p=>p.right?'right':'left'}; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap;`;
const DTd = styled.td<{right?:boolean}>`padding: 6px 8px; border-bottom: 1px solid #f1f3f4; text-align: ${p=>p.right?'right':'left'};`;
const TeamNum = styled.div`font-size: 22px; font-weight: 800; color: #202124;`;
const TeamLabel = styled.div`font-size: 11px; color: #9aa0a6; margin-top: 3px;`;
const LecRow = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 8px;`;
const VolunteerTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const VolTh = styled.th`text-align: center; padding: 5px 8px; color: #9aa0a6; font-weight: 600; font-size: 11px; border-bottom: 1px solid #e8eaed;`;
const VolTd = styled.td`text-align: center; padding: 6px 8px; color: #3c4043; border-bottom: 1px solid #f1f3f4; &:first-of-type { text-align: left; }`;
const VolTdBold = styled(VolTd)`font-weight: 700; color: #202124;`;
const LecName = styled.div`font-size: 13px; color: #3c4043; width: 80px; flex-shrink: 0;`;
const LecCnt = styled.div`font-size: 13px; font-weight: 700; width: 36px; flex-shrink: 0;`;
const LecBar = styled.div`flex: 1; height: 6px; background: #f1f3f4; border-radius: 3px; overflow: hidden;`;
const LecFill = styled.div<{w:number}>`height: 100%; width: ${p=>p.w}%; background: #278f5a;`;
const DepositSummary = styled.div`display: flex; gap: 12px; margin-bottom: 14px;`;
const FilterBtn = styled.button<{active:boolean}>`padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid ${p=>p.active?'#278f5a':'#dadce0'}; background: ${p=>p.active?'#e6f4ea':'white'}; color: ${p=>p.active?'#278f5a':'#5f6368'};`;
const PeriodBar = styled.div`display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;`;
const PeriodBtn = styled.button<{active:boolean}>`display: flex; flex-direction: column; align-items: center; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: 2px solid ${p=>p.active?'#1d4ed8':'#dadce0'}; background: ${p=>p.active?'#eff6ff':'white'}; color: ${p=>p.active?'#1d4ed8':'#5f6368'}; transition: all 0.15s;`;
const PeriodDate = styled.span`font-size: 10px; font-weight: 400; color: inherit; opacity: 0.75; margin-top: 2px;`;
const BusGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px;`;
const BusCard = styled.div<{full:boolean}>`background: white; border-radius: 10px; padding: 14px; text-align: center; border: 2px solid ${p=>p.full?'#d93025':'#e8eaed'}; position: relative; box-shadow: 0 1px 4px rgba(0,0,0,0.05);`;
const BusCardLabel = styled.div`font-size: 12px; font-weight: 600; color: #5f6368; margin-bottom: 6px;`;
const BusCardCount = styled.div`display: flex; align-items: baseline; justify-content: center; gap: 2px;`;
const BusNum = styled.span`font-size: 26px; font-weight: 800; color: #202124;`;
const BusMax = styled.span`font-size: 12px; color: #9aa0a6;`;
const BusBarWrap = styled.div`height: 4px; background: #f1f3f4; border-radius: 2px; margin-top: 6px; overflow: hidden;`;
const BusFill = styled.div<{pct:number;full:boolean}>`height: 100%; width: ${p=>p.pct}%; background: ${p=>p.full?'#d93025':p.pct>80?'#f59e0b':'#278f5a'};`;
const FullTag = styled.div`position: absolute; top: 6px; right: 6px; background: #d93025; color: white; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 3px;`;
const SlotChip = styled.span`padding: 2px 7px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #e8f0fe; color: #1d4ed8;`;
const RoomStats = styled.div`display: flex; gap: 12px; margin-bottom: 14px;`;
const RoomStatItem = styled.div`background: white; border-radius: 8px; padding: 12px 16px; text-align: center; flex: 1; box-shadow: 0 1px 4px rgba(0,0,0,0.05);`;
const RoomStatNum = styled.div`font-size: 22px; font-weight: 800; color: #202124;`;
const RoomStatLabel = styled.div`font-size: 12px; color: #9aa0a6; margin-top: 2px;`;
const RoomChips = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;`;
const RoomChip = styled.button<{active:boolean}>`padding: 4px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; border: 1px solid ${p=>p.active?'#2563eb':'#dadce0'}; background: ${p=>p.active?'#e8f0fe':'white'}; color: ${p=>p.active?'#2563eb':'#5f6368'};`;
const ClearChip = styled.button`padding: 4px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; border: 1px solid #dadce0; background: #f8f9fa; color: #d93025;`;
const ToolRow = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;`;
const SearchBox = styled.div`display: flex; gap: 6px; flex-wrap: wrap; align-items: center;`;
const SearchIn = styled.input`flex: 1; max-width: 280px; padding: 7px 12px; border: 1px solid #dadce0; border-radius: 7px; font-size: 13px; outline: none; &:focus{border-color:#2563eb;}`;
const SearchBtn = styled.button`padding: 7px 14px; background: #2563eb; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; &:hover{background:#1d4ed8;}`;
const BulkBox = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;
const BulkIn = styled.input`padding: 6px 10px; border: 1px solid #dadce0; border-radius: 6px; font-size: 13px; width: 100px; outline: none;`;
const BulkBtn = styled.button`padding: 6px 12px; background: #278f5a; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; &:disabled{background:#dadce0;cursor:not-allowed;} &:not(:disabled):hover{background:#1e7046;}`;
const TableWrap = styled.div`overflow-x: auto; border-radius: 10px; border: 1px solid #e8eaed; background: white;`;
const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const Th = styled.th`padding: 9px 10px; background: #f8f9fa; text-align: left; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap;`;
const SortTh = styled.th`padding: 9px 10px; background: #f8f9fa; text-align: left; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap; cursor: pointer; user-select: none; &:hover { background: #e8eaed; color: #202124; }`;
const Td = styled.td`padding: 9px 10px; border-bottom: 1px solid #f1f3f4; vertical-align: middle;`;
const DepBadge = styled.span<{ok:boolean}>`padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${p=>p.ok?'#e6f4ea':'#fce8e6'}; color: ${p=>p.ok?'#278f5a':'#d93025'};`;
const RoomBadge = styled.span<{ok:boolean}>`padding: 2px 7px; border-radius: 4px; font-size: 12px; font-weight: 600; background: ${p=>p.ok?'#e8f0fe':'#f1f3f4'}; color: ${p=>p.ok?'#1d4ed8':'#9aa0a6'};`;
const RoomIn = styled.input`width: 70px; padding: 3px 7px; border: 1px solid #2563eb; border-radius: 4px; font-size: 12px; outline: none;`;
const BtnGrp = styled.div`display: flex; gap: 3px;`;
const EditBtn = styled.button`padding: 3px 9px; background: #e8f0fe; color: #1d4ed8; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;`;
const SaveBtn = styled.button`padding: 3px 9px; background: #278f5a; color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; &:disabled{opacity:0.6;}`;
const CancelBtn = styled.button`padding: 3px 9px; background: #f1f3f4; color: #5f6368; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;`;
const TshirtStatsWrap = styled.div`display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap;`;
const TshirtStatGroup = styled.div`background: #fff; border: 1px solid #e8eaed; border-radius: 8px; padding: 16px; flex: 1; min-width: 200px;`;
const TshirtStatTitle = styled.div`font-size: 13px; font-weight: 700; color: #5f6368; margin-bottom: 10px;`;
const TshirtStatRow = styled.div`display: flex; gap: 8px; flex-wrap: wrap;`;
const TshirtStatItem = styled.div<{ color: string; border?: boolean }>`
  flex: 1; min-width: 60px; padding: 10px 12px; border-radius: 6px;
  background: ${p => p.color};
  border: ${p => p.border ? '1px solid #e8eaed' : 'none'};
  text-align: center;
`;
const TshirtStatLabel = styled.div`font-size: 11px; font-weight: 600; color: #5f6368; margin-bottom: 4px;`;
const TshirtStatNum = styled.div`font-size: 18px; font-weight: 700; color: #202124;`;
const TshirtCrossTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e8eaed;`;
const TshirtCrossTh = styled.th`padding: 8px 12px; background: #f8f9fa; text-align: center; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; border-right: 1px solid #e8eaed; white-space: nowrap; &:first-of-type { text-align: left; }`;
const TshirtCrossTd = styled.td<{bold?:boolean}>`padding: 8px 12px; text-align: center; border-bottom: 1px solid #f1f3f4; border-right: 1px solid #f1f3f4; font-weight: ${p=>p.bold?'700':'400'}; color: ${p=>p.bold?'#202124':'#3c4043'}; &:first-of-type { text-align: left; display: flex; align-items: center; gap: 6px; }`;
const ColorDot = styled.span<{color:string}>`display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p=>p.color}; border: 1px solid #dadce0; flex-shrink: 0;`;
