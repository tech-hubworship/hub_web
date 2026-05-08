import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';

// ── Types ──────────────────────────────────────────────────
interface Registration {
  id: string; created_at: string; name: string; group_name: string;
  community: string; gender: string; phone: string; birthdate: string;
  departure_slot: string; return_slot: string; elective_lecture: string;
  intercessor_team: string; volunteer_team: string;
  deposit_confirm: boolean; admin_deposit_confirm: boolean;
  admin_deposit_confirmed_at: string | null;
  room_number: string | null; room_note: string | null;
  leader_name: string;
  is_waitlist?: boolean;
  waitlist_approved_at?: string | null;
}
interface SlotStat { value: string; label: string; max_count: number; current_count: number; is_full: boolean; }

interface UnpaidEntry {
  id: string;
  name: string;
  phone: string;
  sms_sent: boolean;
  registered: boolean;
  deposit_confirmed: boolean; // registrations.admin_deposit_confirm 자동 매칭
  memo: string;
  created_at: string;
}

// 미입금자 추적 접근 허용 이메일
const UNPAID_ALLOWED_EMAILS = ['skj45691234@gmail.com', 'jhp6413@gmail.com', 'dlwldnjs7138@gmail.com'];
interface Stats {
  total: number;
  gender: { male: number; female: number; other: number };
  deposited: number; depositRate: number;
  departureCounts: Record<string, number>;
  returnCounts: Record<string, number>;
  carRoleCounts: Record<string, number>;
  groupCounts: Record<string, { male: number; female: number; total: number }>;
  topGroupCounts: Record<string, { male: number; female: number; total: number }>;
  volunteerCount: number; volunteerCounts: Record<string, number>;
  electiveCounts: Record<string, number>;
  communityCounts: Record<string, number>;
}

const sl = (slot: string) => slot === 'car' ? '자차' : slot.replace('bus-', '');

// 날짜+시간 포맷 (M/D H:mm)
const fmtDateTime = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}시${String(d.getMinutes()).padStart(2,'0')}분`;
};

// 티셔츠 가격 계산: 1~2장 = 10,000원/장, 3장 이상 = 9,000원/장
function calcTshirtPrice(items: any[]): number {
  const totalQty = (items || []).reduce((acc: number, i: any) => acc + i.quantity, 0);
  const unitPrice = totalQty >= 3 ? 9000 : 10000;
  return totalQty * unitPrice;
}

// ── Excel Export ──────────────────────────────────────────
function exportToExcel(registrations: Registration[], filename: string) {
  const headers = ['이름','그룹','공동체','성별','연락처','순장','출발','복귀','선택강의','자원봉사','자기입금','입금확인','숙소','메모','신청일시'];
  const rows = registrations.map(r => [
    r.name, r.group_name, r.community, r.gender, r.phone, r.leader_name,
    sl(r.departure_slot), sl(r.return_slot), r.elective_lecture,
    r.volunteer_team,
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
    const totalPrice = calcTshirtPrice(o.items || []);
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

const GROUP_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  '링크': { bg: '#f0fdf4', border: '#86efac', text: '#166534', accent: '#16a34a' },
  '믿음': { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a', accent: '#2563eb' },
  '사랑': { bg: '#fff1f2', border: '#fca5a5', text: '#991b1b', accent: '#dc2626' },
  '소망': { bg: '#fefce8', border: '#fde047', text: '#854d0e', accent: '#ca8a04' },
  '새가족': { bg: '#faf7f2', border: '#d6c9b0', text: '#6b5c3e', accent: '#a08050' },
};

export default function HubUpAdminPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stats' | 'deposit' | 'list' | 'room' | 'bus' | 'tshirt' | 'unpaid' | 'waitlist' | 'challenge'>('stats');

  // 미입금자 추적 접근 권한
  const userEmail = (session?.user as any)?.email ?? '';
  const userName = (session?.user as any)?.name ?? '';
  const isAdmin = (session?.user as any)?.isAdmin ?? false;
  const canAccessUnpaid = isAdmin && UNPAID_ALLOWED_EMAILS.includes(userEmail);
  // 전체 명단 수정 권한: MC 이지원
  const canFullEdit = isAdmin && UNPAID_ALLOWED_EMAILS.includes(userEmail);

  // 미입금자 추적 상태
  const [unpaidName, setUnpaidName] = useState('');
  const [unpaidPhone, setUnpaidPhone] = useState('');
  const [unpaidAddError, setUnpaidAddError] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [listGroupFilter, setListGroupFilter] = useState('');
  const [listCellFilter, setListCellFilter] = useState('');
  const [listVolunteerFilter, setListVolunteerFilter] = useState('');
  const [listElectiveFilter, setListElectiveFilter] = useState('');
  const [listElective1Filter, setListElective1Filter] = useState('');
  const [listElective2Filter, setListElective2Filter] = useState('');
  const [busSlotFilter, setBusSlotFilter] = useState('');
  const [busReturnFilter, setBusReturnFilter] = useState('');
  const [busGroupFilter, setBusGroupFilter] = useState('');
  const [busCellFilter, setBusCellFilter] = useState('');
  const [busCarRoleFilter, setBusCarRoleFilter] = useState('');
  const [tshirtSearch, setTshirtSearch] = useState('');
  const [tshirtReceiveFilter, setTshirtReceiveFilter] = useState<'all' | 'received' | 'pending'>('all');
  const [roomGroupFilter, setRoomGroupFilter] = useState('');
  const [roomCellFilter, setRoomCellFilter] = useState('');
  // 페이지네이션 (전체 명단)
  const [listPage, setListPage] = useState(1);
  const LIST_PAGE_SIZE = 100;
  // 전체 명단 인라인 수정 상태
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<Partial<Registration>>({});

  // 입금 기간 정의
  const DEPOSIT_PERIODS = [
    { key: '1', label: '1차', start: new Date('2026-04-12T00:00:00+09:00'), end: new Date('2026-04-15T09:10:59+09:00') },
    { key: '2', label: '2차', start: new Date('2026-04-15T09:11:00+09:00'), end: new Date('2026-04-20T09:10:59+09:00') },
    { key: '3', label: '3차', start: new Date('2026-04-20T09:11:00+09:00'), end: new Date('2026-04-27T09:10:59+09:00') },
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
    refetchOnWindowFocus: true,
  });  const { data: busStats } = useQuery<{ slotStats: SlotStat[]; registrations: Registration[] }>({
    queryKey: ['hub-up-bus-stats'],
    queryFn: () => fetch('/api/admin/hub-up/bus-stats').then(r => r.json()),
    refetchOnWindowFocus: true,
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

  // 대기자 목록
  const { data: waitlistEntries = [], isLoading: isWaitlistLoading } = useQuery<Registration[]>({
    queryKey: ['hub-up-waitlist'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hub-up/registrations?waitlist=true');
      if (!res.ok) throw new Error('조회 실패');
      return res.json();
    },
    refetchOnWindowFocus: true,
  });

  // 수정용 폼 옵션 (슬롯/강의/그룹)
  const { data: formOptions } = useQuery<{
    departureSlots: { value: string; label: string }[];
    returnSlots: { value: string; label: string }[];
    electives: { value: string; label: string }[];
    groupOptions: string[];
  }>({
    queryKey: ['hub-up-form-options'],
    queryFn: async () => {
      const [slotRes, groupsRes, cellsRes] = await Promise.all([
        fetch('/api/hub-up/form-data').then(r => r.json()),
        fetch('/api/common/groups').then(r => r.json()),
        fetch('/api/common/cells').then(r => r.json()),
      ]);
      // 그룹/다락방 목록 조합 (RegisterForm과 동일 로직)
      const groupMap = new Map<number, string>();
      if (Array.isArray(groupsRes)) {
        groupsRes.forEach((g: any) => groupMap.set(g.id, g.name));
      }
      const cellsArray: any[] = Array.isArray(cellsRes?.cells) ? cellsRes.cells : Array.isArray(cellsRes) ? cellsRes : [];
      const formatted = cellsArray
        .map((cell: any) => {
          const groupName = groupMap.get(cell.group_id);
          const cellName = cell.name || '';
          return { groupName, cellName, label: `${groupName}그룹 ${cellName}다락방` };
        })
        .filter(({ groupName, cellName }: any) => {
          if (!groupName?.trim() || !cellName?.trim()) return false;
          if (groupName.includes('해당없음') || cellName.includes('해당없음')) return false;
          if (groupName.includes('실타') || cellName.includes('실타')) return false;
          if (groupName.toUpperCase() === 'MC' || cellName.toUpperCase().includes('MC')) return false;
          return true;
        })
        .map(({ label }: any) => label)
        .sort((a: string, b: string) => a.localeCompare(b));
      const groupOptions = ['MC', '그룹장', '타공동체', '타교회', ...Array.from(new Set(formatted)) as string[]];
      return {
        departureSlots: slotRes.departureSlots || [],
        returnSlots: slotRes.returnSlots || [],
        electives: slotRes.electives || [],
        groupOptions,
      };
    },
    enabled: canFullEdit,
    staleTime: 60000,
  });

  const { data: unpaidEntries = [], isLoading: isUnpaidLoading } = useQuery<UnpaidEntry[]>({
    queryKey: ['hub-up-unpaid-tracker'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hub-up/unpaid-tracker');
      if (!res.ok) throw new Error('조회 실패');
      return res.json();
    },
    enabled: canAccessUnpaid,
    refetchOnWindowFocus: true,
  });

  const unpaidAddMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/hub-up/unpaid-tracker', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: unpaidName, phone: unpaidPhone }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? '추가 실패'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-unpaid-tracker'] });
      setUnpaidName(''); setUnpaidPhone(''); setUnpaidAddError('');
    },
    onError: (e: any) => setUnpaidAddError(e.message),
  });

  const unpaidSmsMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const res = await fetch(`/api/admin/hub-up/unpaid-tracker/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms_sent: value }),
      });
      if (!res.ok) throw new Error('업데이트 실패');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hub-up-unpaid-tracker'] }),
  });

  const unpaidMemoMutation = useMutation({
    mutationFn: async ({ id, memo }: { id: string; memo: string }) => {
      const res = await fetch(`/api/admin/hub-up/unpaid-tracker/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo }),
      });
      if (!res.ok) throw new Error('메모 저장 실패');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hub-up-unpaid-tracker'] }),
  });

  const unpaidDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/hub-up/unpaid-tracker/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hub-up-unpaid-tracker'] }),
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

  const tshirtCancelMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch(`/api/admin/hub-up/tshirts`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('취소 실패');
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

  const waitlistApproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/admin/hub-up/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('승인 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-stats'] });
    },
  });

  const waitlistCancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/hub-up/registrations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('취소 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-stats'] });
    },
  });

  const fullEditMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Registration> }) => {
      const res = await fetch(`/api/admin/hub-up/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('저장 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-up-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['hub-up-stats'] });
      setEditingRowId(null);
      setEditRowData({});
    },
  });

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (list: Registration[]) => setSelectedIds(selectedIds.size === list.length ? new Set() : new Set(list.map(r => r.id)));
  const startEdit = (r: Registration) => { setEditingId(r.id); setEditRoom(r.room_number || ''); setEditNote(r.room_note || ''); };

  const sortedRegistrations = useMemo(() => {
    // 그룹/다락방/자원봉사 필터 적용
    let filtered = registrations;
    if (appliedSearch) {
      filtered = filtered.filter(r => r.name.includes(appliedSearch) || r.group_name.includes(appliedSearch) || r.phone.includes(appliedSearch));
    }
    if (listGroupFilter) {
      const FIXED = ['MC', '타공동체', '타교회'];
      filtered = filtered.filter(r => {
        if (FIXED.includes(listGroupFilter)) return r.group_name === listGroupFilter;
        const match = r.group_name?.match(/^(.+?)그룹/);
        return match ? match[1] === listGroupFilter : false;
      });
    }
    if (listCellFilter) {
      filtered = filtered.filter(r => r.group_name?.includes(listCellFilter));
    }
    if (listVolunteerFilter) {
      filtered = filtered.filter(r => r.volunteer_team === listVolunteerFilter);
    }
    if (listElectiveFilter) {
      filtered = filtered.filter(r => r.elective_lecture?.includes(listElectiveFilter));
    }
    if (listElective1Filter) {
      filtered = filtered.filter(r => {
        const first = r.elective_lecture?.split(',')[0]?.trim();
        return first === listElective1Filter;
      });
    }
    if (listElective2Filter) {
      filtered = filtered.filter(r => {
        const second = r.elective_lecture?.split(',')[1]?.trim();
        return second === listElective2Filter;
      });
    }
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'ko');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [registrations, sortKey, sortDir, listGroupFilter, listCellFilter, listVolunteerFilter, listElectiveFilter, listElective1Filter, listElective2Filter]);

  // 페이지네이션 적용된 명단
  const pagedRegistrations = useMemo(() => {
    const start = (listPage - 1) * LIST_PAGE_SIZE;
    return sortedRegistrations.slice(start, start + LIST_PAGE_SIZE);
  }, [sortedRegistrations, listPage, LIST_PAGE_SIZE]);

  const listTotalPages = Math.max(1, Math.ceil(sortedRegistrations.length / LIST_PAGE_SIZE));

  const total = registrations.length;
  const assigned = registrations.filter(r => r.room_number).length;
  const roomGroups = registrations.reduce<Record<string, number>>((acc, r) => {
    const k = r.room_number || '미배정'; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  const filteredDeposit = registrations.filter(r => {
    const matchSearch = !appliedSearch || r.name.includes(appliedSearch) || r.group_name.includes(appliedSearch) || r.phone.includes(appliedSearch);

    // 기간 기준 입금확인 여부 계산
    const isConfirmedInPeriod = (periodKey: string) => {
      if (!r.admin_deposit_confirm) return false;
      // confirmed_at이 없으면(구 데이터) 모든 기간에서 입금완료로 표시
      if (!r.admin_deposit_confirmed_at) return true;
      const confirmedAt = new Date(r.admin_deposit_confirmed_at);
      // confirmed_at이 created_at보다 이전이면 데이터 오염 → 미확인으로 처리
      if (confirmedAt < new Date(r.created_at)) return false;
      const period = DEPOSIT_PERIODS.find(p => p.key === periodKey);
      return period ? confirmedAt >= period.start && confirmedAt <= period.end : false;
    };

    const effectiveConfirmed = periodFilter === 'all'
      ? r.admin_deposit_confirm
      : isConfirmedInPeriod(periodFilter);

    const matchDeposit = depositFilter === 'all'
      || (depositFilter === 'confirmed' && effectiveConfirmed)
      || (depositFilter === 'pending' && !effectiveConfirmed);

    const matchPeriod = (() => {
      if (periodFilter === 'all') return true;
      const now = new Date();
      const createdAt = new Date(r.created_at);
      const currentPeriodIdx = DEPOSIT_PERIODS.findIndex(p => p.key === periodFilter);
      for (let i = 0; i <= currentPeriodIdx; i++) {
        const p = DEPOSIT_PERIODS[i];
        const inThisPeriod = createdAt >= p.start && createdAt <= p.end;
        if (inThisPeriod) {
          // 현재 선택한 기간이면 무조건 포함
          if (i === currentPeriodIdx) return true;
          // 이전 기간이면: 해당 기간이 실제로 지났고, 아직 입금확인이 안 된 경우만 누적
          // (어느 기간에 확인됐든 이미 입금완료면 이전 기간 누적에서 제외)
          const periodHasPassed = now > p.end;
          if (periodHasPassed && !r.admin_deposit_confirm) return true;
        }
      }
      return false;
    })();
    return matchSearch && matchDeposit && matchPeriod;
  });

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

  // 현재 선택된 기간이 현재 시각 기준 활성 기간인지 확인
  const isActivePeriod = (() => {
    if (periodFilter === 'all') return true;
    const now = new Date();
    const period = DEPOSIT_PERIODS.find(p => p.key === periodFilter);
    if (!period) return true;
    return now >= period.start && now <= period.end;
  })();

  // 현재 선택된 기간이 아직 시작 안 됐는지
  const isFuturePeriod = (() => {
    if (periodFilter === 'all') return false;
    const now = new Date();
    const period = DEPOSIT_PERIODS.find(p => p.key === periodFilter);
    if (!period) return false;
    return now < period.start;
  })();

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
        <RefreshBtn onClick={() => queryClient.invalidateQueries({ queryKey: ['hub-up'] })}>
          🔄 새로고침
        </RefreshBtn>
      </PageHeader>

      <TabBar>
        <Tab active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>📊 통계</Tab>
        <Tab active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>💰 입금 확인</Tab>
        <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>📋 전체 명단</Tab>
        <Tab active={activeTab === 'room'} onClick={() => setActiveTab('room')}>🏠 숙소 배정</Tab>
        <Tab active={activeTab === 'bus'} onClick={() => setActiveTab('bus')}>🚌 버스 현황</Tab>
        <Tab active={activeTab === 'tshirt'} onClick={() => setActiveTab('tshirt')}>👕 단체티 주문</Tab>
        {canAccessUnpaid && <Tab active={activeTab === 'unpaid'} onClick={() => setActiveTab('unpaid')}>📋 미입금 추적</Tab>}
        <Tab active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')}>⏳ 대기자 승인{waitlistEntries.length > 0 ? ` (${waitlistEntries.length})` : ''}</Tab>
        <Tab active={activeTab === 'challenge'} onClick={() => setActiveTab('challenge')}>🏆 챌린지</Tab>
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
                  <CardTitle>그룹별 신청 현황</CardTitle>
                  <TopGroupCardGrid>
                    {Object.entries(stats.topGroupCounts || {})
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([g, c]) => (
                        <TopGroupCard key={g} color={GROUP_COLORS[g]?.bg ?? '#f8fafc'} border={GROUP_COLORS[g]?.border ?? '#e8eaed'}>
                          <TopGroupAccentBar color={GROUP_COLORS[g]?.accent ?? '#e8eaed'} />
                          <TopGroupName color={GROUP_COLORS[g]?.text ?? '#374151'}>{g}</TopGroupName>
                          <TopGroupNum>{c.total}<TopGroupUnit>명</TopGroupUnit></TopGroupNum>
                          <TopGroupGenderRow>
                            <TopGroupGenderItem male>남 {c.male}</TopGroupGenderItem>
                            <TopGroupGenderDivider />
                            <TopGroupGenderItem>여 {c.female}</TopGroupGenderItem>
                          </TopGroupGenderRow>
                          <TopGroupPct color={GROUP_COLORS[g]?.accent ?? '#278f5a'}>{pct(c.total, stats.total)}%</TopGroupPct>
                        </TopGroupCard>
                      ))}
                  </TopGroupCardGrid>
                </Card>
                <GenderCard>
                  <CardTitle>성별 비율</CardTitle>
                  <GenderDonut>
                    <GenderArc male={pct(stats.gender?.male ?? 0, stats.total)} />
                    <GenderDonutInner>
                      <GenderDonutNum>{pct(stats.gender?.male ?? 0, stats.total)}%</GenderDonutNum>
                      <GenderDonutLabel>남성</GenderDonutLabel>
                    </GenderDonutInner>
                  </GenderDonut>
                  <GenderStatRow>
                    <GenderStatItem>
                      <GenderStatDot color="#2563eb" />
                      <GenderStatLabel>남</GenderStatLabel>
                      <GenderStatNum color="#2563eb">{stats.gender?.male ?? 0}명</GenderStatNum>
                      <GenderStatPct>{pct(stats.gender?.male ?? 0, stats.total)}%</GenderStatPct>
                    </GenderStatItem>
                    <GenderStatItem>
                      <GenderStatDot color="#d93025" />
                      <GenderStatLabel>여</GenderStatLabel>
                      <GenderStatNum color="#d93025">{stats.gender?.female ?? 0}명</GenderStatNum>
                      <GenderStatPct>{pct(stats.gender?.female ?? 0, stats.total)}%</GenderStatPct>
                    </GenderStatItem>
                  </GenderStatRow>
                  <GenderBarWrap>
                    <GenderSeg w={pct(stats.gender?.male ?? 0, stats.total)} color="#2563eb" />
                    <GenderSeg w={pct(stats.gender?.female ?? 0, stats.total)} color="#d93025" />
                  </GenderBarWrap>
                </GenderCard>
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
                  <GroupTable>
                    <thead>
                      <tr>
                        <GTh>그룹</GTh>
                        <GTh right male>남</GTh>
                        <GTh right female>여</GTh>
                        <GTh right>합계</GTh>
                        <GTh right>비율</GTh>
                        <GTh right>비율 바</GTh>
                      </tr>
                    </thead>
                    <tbody>{(() => {
                      const FIXED = ['MC', '그룹장', '타공동체', '타교회', '기타'];
                      const entries = Object.entries(stats.groupCounts || {});
                      const fixed = entries.filter(([g]) => FIXED.includes(g)).sort(([a],[b]) => FIXED.indexOf(a) - FIXED.indexOf(b));
                      const rest = entries.filter(([g]) => !FIXED.includes(g)).sort(([a],[b]) => a.localeCompare(b, 'ko'));
                      return [...rest, ...fixed].map(([g, c], i) => {
                        const topKey = g.match(/^(.+?)그룹/)?.[1] ?? g;
                        const color = GROUP_COLORS[topKey];
                        return (
                          <GTr key={g} even={i % 2 === 0}>
                            <GTd>
                              <GroupDot color={color?.accent ?? '#9aa0a6'} />
                              {g}
                            </GTd>
                            <GTd right><MaleNum>{c.male}</MaleNum></GTd>
                            <GTd right><FemaleNum>{c.female}</FemaleNum></GTd>
                            <GTd right><TotalNum>{c.total}</TotalNum></GTd>
                            <GTd right><PctNum>{pct(c.total, stats.total)}%</PctNum></GTd>
                            <GTd right>
                              <MiniBarWrap>
                                <MiniBarMale w={pct(c.male, c.total)} />
                                <MiniBarFemale w={pct(c.female, c.total)} />
                              </MiniBarWrap>
                            </GTd>
                          </GTr>
                        );
                      });
                    })()}</tbody>
                  </GroupTable>
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
            {isFuturePeriod && (
              <div style={{padding:'40px', textAlign:'center', color:'#9aa0a6', fontSize:'14px'}}>
                아직 시작되지 않은 기간입니다.
              </div>
            )}
            {!isActivePeriod && !isFuturePeriod && periodFilter !== 'all' && (
              <div style={{marginBottom:'12px', padding:'8px 12px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'8px', fontSize:'13px', color:'#c2410c'}}>
                ⚠️ 해당 기간이 종료되어 입금확인 버튼이 비활성화됩니다. 조회만 가능합니다.
              </div>
            )}
            {!isFuturePeriod && (<>
            <DepositSummary>
              <RoomStatItem><RoomStatNum>{filteredDeposit.length}</RoomStatNum><RoomStatLabel>조회된 신청</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#278f5a'}}>{filteredDeposit.filter(r => {
                if (periodFilter === 'all') return r.admin_deposit_confirm;
                if (!r.admin_deposit_confirm) return false;
                if (!r.admin_deposit_confirmed_at) return true;
                const confirmedAt = new Date(r.admin_deposit_confirmed_at);
                const period = DEPOSIT_PERIODS.find(p => p.key === periodFilter);
                return period ? confirmedAt >= period.start && confirmedAt <= period.end : r.admin_deposit_confirm;
              }).length}</RoomStatNum><RoomStatLabel>입금완료</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#d93025'}}>{filteredDeposit.filter(r => {
                if (periodFilter === 'all') return !r.admin_deposit_confirm;
                if (!r.admin_deposit_confirm) return true;
                if (!r.admin_deposit_confirmed_at) return false;
                const confirmedAt = new Date(r.admin_deposit_confirmed_at);
                const period = DEPOSIT_PERIODS.find(p => p.key === periodFilter);
                return period ? !(confirmedAt >= period.start && confirmedAt <= period.end) : !r.admin_deposit_confirm;
              }).length}</RoomStatNum><RoomStatLabel>미확인</RoomStatLabel></RoomStatItem>
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
                    <BulkBtn onClick={() => bulkDepositMutation.mutate(true)} disabled={bulkDepositMutation.isPending || !isActivePeriod}>
                      ✅ 일괄 입금완료
                    </BulkBtn>
                    <CancelBtn onClick={() => bulkDepositMutation.mutate(false)} disabled={!isActivePeriod}>
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
                      <Th>이름</Th><Th>그룹</Th><Th>연락처</Th><Th>자기신고</Th><Th>입금확인</Th><Th>확인시간</Th><Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposit.map(r => {
                      // 기간 필터가 있을 때: 해당 기간 내에 입금확인된 경우만 입금완료로 표시
                      const depositConfirmedInPeriod = (() => {
                        if (periodFilter === 'all') return r.admin_deposit_confirm;
                        if (!r.admin_deposit_confirm) return false;
                        // confirmed_at이 없으면(구 데이터) 모든 기간에서 입금완료로 표시
                        if (!r.admin_deposit_confirmed_at) return true;
                        const confirmedAt = new Date(r.admin_deposit_confirmed_at);
                        const period = DEPOSIT_PERIODS.find(p => p.key === periodFilter);
                        if (!period) return r.admin_deposit_confirm;
                        return confirmedAt >= period.start && confirmedAt <= period.end;
                      })();                      return (
                      <tr key={r.id} style={{background: depositConfirmedInPeriod ? '#f0fdf4' : undefined}}>
                        <Td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)}/></Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td style={{fontSize:'13px'}}>{r.phone}</Td>
                        <Td><DepBadge ok={r.deposit_confirm}>{r.deposit_confirm ? '입금했다고 함' : '미신고'}</DepBadge></Td>
                        <Td><DepBadge ok={depositConfirmedInPeriod}>{depositConfirmedInPeriod ? '입금완료' : '확인중'}</DepBadge></Td>
                        <Td style={{fontSize:'12px',color:'#9aa0a6'}}>{r.admin_deposit_confirmed_at ? fmtDateTime(r.admin_deposit_confirmed_at) : '-'}</Td>
                        <Td>
                          {r.admin_deposit_confirm
                            ? <CancelBtn onClick={() => depositMutation.mutate({ id: r.id, confirmed: false })} disabled={!isActivePeriod}>취소</CancelBtn>
                            : <SaveBtn onClick={() => depositMutation.mutate({ id: r.id, confirmed: true })} disabled={depositMutation.isPending || !isActivePeriod}>입금완료</SaveBtn>}
                        </Td>
                      </tr>
                      );
                    })}
                    {filteredDeposit.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
            </>)}
          </div>
        )}

        {/* ── 전체 명단 탭 ── */}
        {activeTab === 'list' && (
          <div>
            <ToolRow>
              <SearchBox>
                <FilterLabel>필터</FilterLabel>
                <SearchIn placeholder="이름 검색" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setAppliedSearch(search); setListPage(1); } }}
                  style={{maxWidth: '140px'}} />
                <FilterLabel>그룹</FilterLabel>
                <FilterSelect value={listGroupFilter} onChange={e => { setListGroupFilter(e.target.value); setListCellFilter(''); setListPage(1); }}>
                  <option value="">전체</option>
                  {(() => {
                    const FIXED = ['MC', '타공동체', '타교회'];
                    const groups = Array.from(new Set(registrations.map(r => {
                      const match = r.group_name?.match(/^(.+?)그룹/);
                      if (match) return match[1];
                      if (FIXED.includes(r.group_name ?? '')) return r.group_name;
                      return null;
                    }).filter(Boolean) as string[]));
                    const normal = groups.filter(g => !FIXED.includes(g)).sort((a,b) => a.localeCompare(b, 'ko'));
                    const fixed = FIXED.filter(f => groups.includes(f));
                    return [...normal, ...fixed].map(g => <option key={g} value={g}>{g}</option>);
                  })()}
                </FilterSelect>
                <FilterLabel>다락방</FilterLabel>
                <FilterSelect value={listCellFilter} onChange={e => setListCellFilter(e.target.value)}>
                  <option value="">전체</option>
                  {Array.from(new Set(
                    registrations
                      .filter(r => !listGroupFilter || r.group_name?.match(/^(.+?)그룹/)?.[1] === listGroupFilter)
                      .map(r => { const m = r.group_name?.match(/그룹\s*(.+다락방)/); return m?.[1]; })
                      .filter(Boolean)
                  )).sort((a,b) => a!.localeCompare(b!, 'ko')).map(c => (
                    <option key={c} value={c!}>{c}</option>
                  ))}
                </FilterSelect>
                <FilterLabel>자원봉사</FilterLabel>
                <FilterSelect value={listVolunteerFilter} onChange={e => setListVolunteerFilter(e.target.value)}>
                  <option value="">전체</option>
                  {Array.from(new Set(registrations.map(r => r.volunteer_team).filter(Boolean))).sort().map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </FilterSelect>
                <FilterLabel>선택강의</FilterLabel>
                <FilterSelect value={listElective1Filter} onChange={e => setListElective1Filter(e.target.value)}>
                  <option value="">1순위 전체</option>
                  {Array.from(new Set(
                    registrations.map(r => r.elective_lecture?.split(',')[0]?.trim()).filter(Boolean)
                  )).sort((a, b) => a!.localeCompare(b!, 'ko')).map(e => (
                    <option key={e} value={e!}>{e}</option>
                  ))}
                </FilterSelect>
                <FilterSelect value={listElective2Filter} onChange={e => setListElective2Filter(e.target.value)}>
                  <option value="">2순위 전체</option>
                  {Array.from(new Set(
                    registrations.map(r => r.elective_lecture?.split(',')[1]?.trim()).filter(Boolean)
                  )).sort((a, b) => a!.localeCompare(b!, 'ko')).map(e => (
                    <option key={e} value={e!}>{e}</option>
                  ))}
                </FilterSelect>
                {(listGroupFilter || listCellFilter || listVolunteerFilter || listElective1Filter || listElective2Filter || appliedSearch) && (
                  <SearchBtn onClick={() => { setListGroupFilter(''); setListCellFilter(''); setListVolunteerFilter(''); setListElectiveFilter(''); setListElective1Filter(''); setListElective2Filter(''); setSearch(''); setAppliedSearch(''); setListPage(1); }} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>
                )}
              </SearchBox>
              <ExportBtn onClick={() => {
                  const parts = ['허브업'];
                  if (listGroupFilter) parts.push(listGroupFilter + '그룹');
                  if (listCellFilter) parts.push(listCellFilter);
                  if (listVolunteerFilter) parts.push(listVolunteerFilter);
                  if (listElective1Filter) parts.push(`1순위_${listElective1Filter}`);
                  if (listElective2Filter) parts.push(`2순위_${listElective2Filter}`);
                  if (appliedSearch) parts.push(appliedSearch);
                  if (parts.length === 1) parts.push('전체명단');
                  exportToExcel(sortedRegistrations, parts.join('_'));
                }}>📥 엑셀 다운로드</ExportBtn>
            </ToolRow>
            {isLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <SortTh onClick={() => handleSort('name')}>이름{sortIcon('name')}</SortTh>
                      <SortTh onClick={() => handleSort('group_name')}>그룹{sortIcon('group_name')}</SortTh>
                      <Th>순장</Th>
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
                      {canFullEdit && <Th style={{background:'#fef9c3',color:'#854d0e'}}>✏️ 수정</Th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRegistrations.map((r, i) => {
                      const isEditing = editingRowId === r.id;
                      const ed = editRowData;
                      const depSlots = formOptions?.departureSlots || [];
                      const retSlots = formOptions?.returnSlots || [];
                      const electives = formOptions?.electives || [];
                      const VOLUNTEER_OPTIONS = ['외부 안내팀', '시설팀', '식사팀', '허브런팀', '해당 없음'];
                      const COMMUNITY_OPTIONS = ['허브', '타공동체(온누리교회)', '타교회'];
                      const GENDER_OPTIONS = ['남자', '여자'];
                      const groupOptions = formOptions?.groupOptions || [];

                      return (
                        <tr key={r.id} style={isEditing ? {background:'#fefce8'} : undefined}>
                          <Td style={{color:'#9aa0a6',fontSize:'12px'}}>{(listPage - 1) * LIST_PAGE_SIZE + i + 1}</Td>
                          {/* 이름 */}
                          <Td>
                            {isEditing
                              ? <InlineInput value={ed.name ?? r.name} onChange={e => setEditRowData(p => ({...p, name: e.target.value}))} style={{width:70}} />
                              : <strong>{r.name}</strong>}
                          </Td>
                          {/* 그룹 */}
                          <Td style={{fontSize:'13px',color:'#5f6368'}}>
                            {isEditing
                              ? <InlineSelect value={ed.group_name ?? r.group_name} onChange={e => setEditRowData(p => ({...p, group_name: e.target.value}))}>
                                  {groupOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </InlineSelect>
                              : r.group_name}
                          </Td>
                          {/* 순장 */}
                          <Td style={{fontSize:'13px',color:'#5f6368'}}>
                            {isEditing
                              ? <InlineInput value={ed.leader_name ?? r.leader_name ?? ''} onChange={e => setEditRowData(p => ({...p, leader_name: e.target.value}))} style={{width:70}} />
                              : (r.leader_name || '-')}
                          </Td>
                          {/* 공동체 */}
                          <Td style={{fontSize:'13px'}}>
                            {isEditing
                              ? <InlineSelect value={ed.community ?? r.community} onChange={e => setEditRowData(p => ({...p, community: e.target.value}))}>
                                  {COMMUNITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </InlineSelect>
                              : r.community}
                          </Td>
                          {/* 성별 */}
                          <Td>
                            {isEditing
                              ? <InlineSelect value={ed.gender ?? r.gender} onChange={e => setEditRowData(p => ({...p, gender: e.target.value}))}>
                                  {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </InlineSelect>
                              : r.gender}
                          </Td>
                          {/* 연락처 */}
                          <Td style={{fontSize:'13px'}}>
                            {isEditing
                              ? <InlineInput value={ed.phone ?? r.phone} onChange={e => setEditRowData(p => ({...p, phone: e.target.value}))} style={{width:110}} />
                              : r.phone}
                          </Td>
                          {/* 출발 */}
                          <Td>
                            {isEditing
                              ? <InlineSelect value={ed.departure_slot ?? r.departure_slot} onChange={e => setEditRowData(p => ({...p, departure_slot: e.target.value}))}>
                                  {depSlots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                  <option value="car">자차/대중교통</option>
                                </InlineSelect>
                              : <SlotChip>{sl(r.departure_slot)}</SlotChip>}
                          </Td>
                          {/* 복귀 */}
                          <Td style={{fontSize:'13px'}}>
                            {isEditing
                              ? <InlineSelect value={ed.return_slot ?? r.return_slot} onChange={e => setEditRowData(p => ({...p, return_slot: e.target.value}))}>
                                  {retSlots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                  <option value="car">자차/대중교통</option>
                                </InlineSelect>
                              : sl(r.return_slot)}
                          </Td>
                          {/* 선택강의 */}
                          <Td style={{fontSize:'13px'}}>
                            {isEditing ? (() => {
                              const electiveLabels = electives.map((e: any) => e.label);
                              const currentSelected = (ed.elective_lecture ?? r.elective_lecture ?? '')
                                .split(',').map((s: string) => s.trim()).filter(Boolean);
                              return (
                                <div style={{display:'flex', flexDirection:'column', gap:3}}>
                                  {electiveLabels.map((label: string) => {
                                    const checked = currentSelected.includes(label);
                                    return (
                                      <label key={label} style={{display:'flex', alignItems:'center', gap:4, fontSize:12, cursor:'pointer', whiteSpace:'nowrap'}}>
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => {
                                            let next: string[];
                                            if (checked) {
                                              next = currentSelected.filter((v: string) => v !== label);
                                            } else if (currentSelected.length < 2) {
                                              next = [...currentSelected, label];
                                            } else {
                                              return; // 2개 초과 선택 방지
                                            }
                                            setEditRowData(p => ({...p, elective_lecture: next.join(', ')}));
                                          }}
                                        />
                                        {label}
                                      </label>
                                    );
                                  })}
                                  <span style={{fontSize:11, color:'#9aa0a6'}}>{currentSelected.length}/2 선택</span>
                                </div>
                              );
                            })() : (r.elective_lecture || '-')}
                          </Td>
                          {/* 자원봉사 */}
                          <Td style={{fontSize:'13px'}}>
                            {isEditing
                              ? <InlineSelect value={ed.volunteer_team ?? r.volunteer_team ?? ''} onChange={e => setEditRowData(p => ({...p, volunteer_team: e.target.value}))}>
                                  {VOLUNTEER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </InlineSelect>
                              : (r.volunteer_team || '-')}
                          </Td>
                          {/* 입금 */}
                          <Td><DepBadge ok={r.admin_deposit_confirm}>{r.admin_deposit_confirm ? '입금완료' : '미확인'}</DepBadge></Td>
                          {/* 숙소 */}
                          <Td><RoomBadge ok={!!r.room_number}>{r.room_number || '미배정'}</RoomBadge></Td>
                          {/* 신청일 */}
                          <Td style={{fontSize:'12px',color:'#9aa0a6'}}>{fmtDateTime(r.created_at)}</Td>
                          {/* 관리 */}
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
                          {/* 수정 열 (canFullEdit만 표시) */}
                          {canFullEdit && (
                            <Td style={{background:'#fefce8'}}>
                              {isEditing ? (
                                <BtnGrp>
                                  <SaveBtn
                                    onClick={() => fullEditMutation.mutate({ id: r.id, data: ed })}
                                    disabled={fullEditMutation.isPending}
                                  >
                                    저장
                                  </SaveBtn>
                                  <CancelBtn onClick={() => { setEditingRowId(null); setEditRowData({}); }}>
                                    취소
                                  </CancelBtn>
                                </BtnGrp>
                              ) : (
                                <EditBtn onClick={() => { setEditingRowId(r.id); setEditRowData({}); }}>
                                  수정
                                </EditBtn>
                              )}
                            </Td>
                          )}
                        </tr>
                      );
                    })}
                    {registrations.length === 0 && <tr><td colSpan={canFullEdit ? 16 : 15} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
            {/* 페이지네이션 */}
            {listTotalPages > 1 && (
              <PaginationRow>
                <PaginationBtn disabled={listPage === 1} onClick={() => setListPage(1)}>«</PaginationBtn>
                <PaginationBtn disabled={listPage === 1} onClick={() => setListPage(p => p - 1)}>‹</PaginationBtn>
                {Array.from({ length: listTotalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === listTotalPages || Math.abs(p - listPage) <= 2)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...'
                      ? <PaginationEllipsis key={`e${idx}`}>…</PaginationEllipsis>
                      : <PaginationBtn key={p} active={listPage === p} onClick={() => setListPage(p as number)}>{p}</PaginationBtn>
                  )}
                <PaginationBtn disabled={listPage === listTotalPages} onClick={() => setListPage(p => p + 1)}>›</PaginationBtn>
                <PaginationBtn disabled={listPage === listTotalPages} onClick={() => setListPage(listTotalPages)}>»</PaginationBtn>
                <PaginationInfo>{sortedRegistrations.length}명 중 {(listPage - 1) * LIST_PAGE_SIZE + 1}–{Math.min(listPage * LIST_PAGE_SIZE, sortedRegistrations.length)}명</PaginationInfo>
              </PaginationRow>
            )}
          </div>
        )}

        {/* ── 버스 현황 탭 ── */}
        {activeTab === 'bus' && (() => {
          const BUS_SLOTS = [
            { label: '선발대', value: 'bus-선발대' },
            { label: '18:00', value: 'bus-18:00' },
            { label: '18:30', value: 'bus-18:30' },
            { label: '19:00', value: 'bus-19:00' },
            { label: '20:00', value: 'bus-20:00' },
            { label: '자차/대중교통', value: 'car' },
          ];
          const allRegs = busStats?.registrations || [];
          const filteredBus = allRegs
            .filter(r => !busSlotFilter || r.departure_slot === busSlotFilter)
            .filter(r => !busReturnFilter || r.return_slot === busReturnFilter)
            .filter((r: any) => {
              if (!busGroupFilter) return true;
              const FIXED = ['MC', '타공동체', '타교회'];
              if (FIXED.includes(busGroupFilter)) return r.group_name === busGroupFilter;
              const match = r.group_name?.match(/^(.+?)그룹/);
              return match ? match[1] === busGroupFilter : false;
            })
            .filter((r: any) => !busCellFilter || r.group_name?.includes(busCellFilter))
            .filter((r: any) => !busCarRoleFilter || r.car_role === busCarRoleFilter);

          // 실제 데이터에서 복귀 슬롯 추출
          const returnSlots = Array.from(new Set(allRegs.map(r => r.return_slot).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b));
          return (
            <div>
              <ToolRow>
                <SearchBox>
                  <FilterLabel>출발</FilterLabel>
                  {BUS_SLOTS.map(s => (
                    <FilterBtn key={s.value} active={busSlotFilter === s.value} onClick={() => setBusSlotFilter(busSlotFilter === s.value ? '' : s.value)}>
                      {s.label}
                    </FilterBtn>
                  ))}
                  {busSlotFilter && <SearchBtn onClick={() => setBusSlotFilter('')} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>}
                </SearchBox>
                <SearchBox>
                  <FilterLabel>복귀</FilterLabel>
                  {returnSlots.map(v => (
                    <FilterBtn key={v} active={busReturnFilter === v} onClick={() => setBusReturnFilter(busReturnFilter === v ? '' : v)}>
                      {sl(v)}
                    </FilterBtn>
                  ))}
                  {busReturnFilter && <SearchBtn onClick={() => setBusReturnFilter('')} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>}
                </SearchBox>
                <SearchBox>
                  <FilterLabel>그룹</FilterLabel>
                  <FilterSelect value={busGroupFilter} onChange={e => { setBusGroupFilter(e.target.value); setBusCellFilter(''); }}>
                    <option value="">전체</option>
                    {(() => {
                      const FIXED = ['MC', '타공동체', '타교회'];
                      const groups = Array.from(new Set((allRegs as any[]).map((r: any) => {
                        const match = r.group_name?.match(/^(.+?)그룹/);
                        if (match) return match[1];
                        if (FIXED.includes(r.group_name ?? '')) return r.group_name;
                        return null;
                      }).filter(Boolean) as string[]));
                      const normal = groups.filter(g => !FIXED.includes(g)).sort((a,b) => a.localeCompare(b, 'ko'));
                      const fixed = FIXED.filter(f => groups.includes(f));
                      return [...normal, ...fixed].map(g => <option key={g} value={g}>{g}</option>);
                    })()}
                  </FilterSelect>
                  <FilterLabel>다락방</FilterLabel>
                  <FilterSelect value={busCellFilter} onChange={e => setBusCellFilter(e.target.value)}>
                    <option value="">전체</option>
                    {Array.from(new Set(
                      (allRegs as any[])
                        .filter((r: any) => {
                          if (!busGroupFilter) return true;
                          const FIXED = ['MC', '타공동체', '타교회'];
                          if (FIXED.includes(busGroupFilter)) return r.group_name === busGroupFilter;
                          const match = r.group_name?.match(/^(.+?)그룹/);
                          return match ? match[1] === busGroupFilter : false;
                        })
                        .map((r: any) => r.group_name?.match(/그룹\s*(.+다락방)/)?.[1])
                        .filter(Boolean)
                    )).sort((a, b) => (a as string).localeCompare(b as string, 'ko')).map(c => (
                      <option key={c as string} value={c as string}>{c as string}</option>
                    ))}
                  </FilterSelect>
                  {(busSlotFilter === 'car' || busReturnFilter === 'car') && <>
                    <FilterLabel>역할</FilterLabel>
                    <FilterSelect value={busCarRoleFilter} onChange={e => setBusCarRoleFilter(e.target.value)}>
                      <option value="">전체</option>
                      {Array.from(new Set((allRegs as any[]).map((r: any) => r.car_role).filter(Boolean))).sort().map(role => (
                        <option key={role as string} value={role as string}>{role as string}</option>
                      ))}
                    </FilterSelect>
                  </>}
                </SearchBox>
                <ExportBtn onClick={() => {
                  const dep = BUS_SLOTS.find(s => s.value === busSlotFilter);
                  const parts = ['허브업_버스'];
                  if (dep) parts.push(`출발_${dep.label}`);
                  if (busReturnFilter) parts.push(`복귀_${sl(busReturnFilter)}`);
                  exportToExcel(filteredBus, parts.join('_'));
                }}>📥 엑셀 다운로드</ExportBtn>
              </ToolRow>
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
                  <thead>
                    <tr>
                      <Th>#</Th><Th>이름</Th><Th>그룹</Th><Th>연락처</Th><Th>출발</Th><Th>복귀</Th>
                      {(busSlotFilter === 'car' || busReturnFilter === 'car') && <>
                        <Th>역할</Th><Th>탑승인원</Th><Th>동승자</Th><Th>차량번호</Th><Th>입소시간</Th><Th>복귀시간</Th>
                      </>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBus.map((r: any, i: number) => (
                      <tr key={r.id}>
                        <Td style={{color:'#9aa0a6',fontSize:'12px'}}>{i+1}</Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td style={{fontSize:'13px'}}>{r.phone}</Td>
                        <Td><SlotChip>{sl(r.departure_slot)}</SlotChip></Td>
                        <Td>{sl(r.return_slot)}</Td>
                        {(busSlotFilter === 'car' || busReturnFilter === 'car') && <>
                          <Td style={{fontSize:'13px'}}>{r.car_role || '-'}</Td>
                          <Td style={{fontSize:'13px'}}>{r.car_passenger_count ? `${r.car_passenger_count}명` : '-'}</Td>
                          <Td style={{fontSize:'13px'}}>{r.car_passenger_names || '-'}</Td>
                          <Td style={{fontSize:'13px'}}>{r.car_plate_number || '-'}</Td>
                          <Td style={{fontSize:'13px'}}>{r.car_arrival_time || '-'}</Td>
                          <Td style={{fontSize:'13px'}}>{r.car_departure_time || '-'}</Td>
                        </>}
                      </tr>
                    ))}
                    {filteredBus.length === 0 && <tr><td colSpan={(busSlotFilter === 'car' || busReturnFilter === 'car') ? 12 : 6} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            </div>
          );
        })()}

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
                <FilterLabel>그룹</FilterLabel>
                <FilterSelect value={roomGroupFilter} onChange={e => { setRoomGroupFilter(e.target.value); setRoomCellFilter(''); }}>
                  <option value="">전체</option>
                  {(() => {
                    const FIXED = ['MC', '타공동체', '타교회'];
                    const groups = Array.from(new Set(registrations.map((r: any) => {
                      const match = r.group_name?.match(/^(.+?)그룹/);
                      if (match) return match[1];
                      if (FIXED.includes(r.group_name ?? '')) return r.group_name;
                      return null;
                    }).filter(Boolean) as string[]));
                    const normal = groups.filter(g => !FIXED.includes(g)).sort((a, b) => a.localeCompare(b, 'ko'));
                    const fixed = FIXED.filter(f => groups.includes(f));
                    return [...normal, ...fixed].map(g => <option key={g} value={g}>{g}</option>);
                  })()}
                </FilterSelect>
                <FilterLabel>다락방</FilterLabel>
                <FilterSelect value={roomCellFilter} onChange={e => setRoomCellFilter(e.target.value)}>
                  <option value="">전체</option>
                  {Array.from(new Set(
                    registrations
                      .filter((r: any) => {
                        if (!roomGroupFilter) return true;
                        const FIXED = ['MC', '타공동체', '타교회'];
                        if (FIXED.includes(roomGroupFilter)) return r.group_name === roomGroupFilter;
                        const match = r.group_name?.match(/^(.+?)그룹/);
                        return match ? match[1] === roomGroupFilter : false;
                      })
                      .map((r: any) => r.group_name?.match(/그룹\s*(.+다락방)/)?.[1])
                      .filter(Boolean)
                  )).sort((a, b) => (a as string).localeCompare(b as string, 'ko')).map(c => (
                    <option key={c as string} value={c as string}>{c as string}</option>
                  ))}
                </FilterSelect>
                {(roomGroupFilter || roomCellFilter) && (
                  <SearchBtn onClick={() => { setRoomGroupFilter(''); setRoomCellFilter(''); }} style={{background:'#f1f3f4',color:'#5f6368'}}>초기화</SearchBtn>
                )}
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
            {isLoading ? <Loading>불러오는 중...</Loading> : (() => {
              const FIXED = ['MC', '타공동체', '타교회'];
              const filteredRoom = registrations.filter((r: any) => {
                if (roomGroupFilter) {
                  if (FIXED.includes(roomGroupFilter)) { if (r.group_name !== roomGroupFilter) return false; }
                  else { const match = r.group_name?.match(/^(.+?)그룹/); if (!match || match[1] !== roomGroupFilter) return false; }
                }
                if (roomCellFilter && !r.group_name?.includes(roomCellFilter)) return false;
                return true;
              });
              return (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th style={{width:36}}><input type="checkbox" checked={selectedIds.size===filteredRoom.length&&filteredRoom.length>0} onChange={() => toggleAll(filteredRoom)}/></Th>
                      <Th>이름</Th><Th>그룹</Th><Th>순장</Th><Th>성별</Th><Th>출발</Th><Th>복귀</Th><Th>강의</Th><Th>입금</Th><Th>숙소</Th><Th>메모</Th><Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoom.map((r: any) => (
                      <tr key={r.id}>
                        <Td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={()=>toggleSelect(r.id)}/></Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.leader_name || '-'}</Td>
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
                    {filteredRoom.length===0 && <tr><td colSpan={12} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>신청자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
              );
            })()}
          </div>
        )}

        {/* ── 티셔츠 주문 탭 ── */}
        {activeTab === 'tshirt' && (
          <div>
            <DepositSummary>
              <RoomStatItem><RoomStatNum>{tshirts.length}</RoomStatNum><RoomStatLabel>전체 주문자</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#278f5a'}}>{tshirts.filter((t:any) => t.status === 'confirmed' || t.status === 'distributed').length}</RoomStatNum><RoomStatLabel>입금완료</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#d93025'}}>{tshirts.filter((t:any) => t.status !== 'confirmed' && t.status !== 'distributed').length}</RoomStatNum><RoomStatLabel>미확인/취소</RoomStatLabel></RoomStatItem>
              <RoomStatItem>
                <RoomStatNum>
                  {tshirts.reduce((acc: number, t: any) => acc + (t.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0), 0)}장
                </RoomStatNum>
                <RoomStatLabel>총 판매 티셔츠</RoomStatLabel>
              </RoomStatItem>
              <RoomStatItem>
                <RoomStatNum style={{color:'#1d4ed8'}}>
                  {tshirts.reduce((acc: number, t: any) => acc + calcTshirtPrice(t.items || []), 0).toLocaleString()}원
                </RoomStatNum>
                <RoomStatLabel>전체 총액</RoomStatLabel>
              </RoomStatItem>
              <RoomStatItem>
                <RoomStatNum style={{color:'#278f5a'}}>
                  {tshirts.filter((t:any) => t.status === 'confirmed').reduce((acc: number, t: any) => acc + calcTshirtPrice(t.items || []), 0).toLocaleString()}원
                </RoomStatNum>
                <RoomStatLabel>입금완료 총액</RoomStatLabel>
              </RoomStatItem>
              <RoomStatItem>
                <RoomStatNum style={{color:'#d93025'}}>
                  {tshirts.filter((t:any) => t.status !== 'confirmed' && t.status !== 'distributed').reduce((acc: number, t: any) => acc + calcTshirtPrice(t.items || []), 0).toLocaleString()}원
                </RoomStatNum>
                <RoomStatLabel>미수금</RoomStatLabel>
              </RoomStatItem>
              <RoomStatItem>
                <RoomStatNum style={{color:'#7c3aed'}}>{tshirts.filter((t:any) => t.status === 'distributed').length}</RoomStatNum>
                <RoomStatLabel>수령완료</RoomStatLabel>
              </RoomStatItem>
              <RoomStatItem>
                <RoomStatNum style={{color:'#f59e0b'}}>{tshirts.filter((t:any) => t.status !== 'distributed').length}</RoomStatNum>
                <RoomStatLabel>미수령</RoomStatLabel>
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

                  {/* ── 수령 현황 ── */}
                  {(() => {
                    const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
                    const COLORS = ['white', 'black', 'navy'] as const;

                    // 색상별 수령 집계
                    const recvByColor: Record<string, number> = { white: 0, black: 0, navy: 0 };
                    tshirts.filter((t: any) => t.status === 'distributed').forEach((t: any) => {
                      (t.items || []).forEach((item: any) => {
                        const c = item.color?.toLowerCase();
                        if (c in recvByColor) recvByColor[c] += item.quantity;
                      });
                    });

                    // 날짜별 수령 집계 (KST 기준)
                    const byDate: Record<string, { sortKey: string; total: number }> = {};
                    tshirts.filter((t: any) => t.status === 'distributed' && t.received_at).forEach((t: any) => {
                      const dt = new Date(t.received_at);
                      const dateKey = dt.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' });
                      const sortKey = dt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
                      if (!byDate[dateKey]) byDate[dateKey] = { sortKey, total: 0 };
                      (t.items || []).forEach((item: any) => { byDate[dateKey].total += item.quantity; });
                    });
                    const dateEntries = Object.entries(byDate).sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey));

                    const totalAll = Object.values(colorTotals).reduce((a, b) => a + b, 0);
                    const totalRecv = Object.values(recvByColor).reduce((a, b) => a + b, 0);
                    const overallPct = totalAll > 0 ? Math.round((totalRecv / totalAll) * 100) : 0;

                    const COLOR_META = [
                      { key: 'white' as const, label: 'White', bg: '#f9f9f9', border: '#e0e0e0', textColor: '#111' },
                      { key: 'black' as const, label: 'Black', bg: '#222',    border: '#222',    textColor: '#fff' },
                      { key: 'navy'  as const, label: 'Navy',  bg: '#1e3a5f', border: '#1e3a5f', textColor: '#fff' },
                    ];

                    return (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#202124', marginBottom: 12 }}>수령 현황</div>

                        {/* 전체 진행률 */}
                        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#5f6368' }}>전체 수령률</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#7c3aed' }}>{totalRecv} / {totalAll}장 ({overallPct}%)</span>
                          </div>
                          <div style={{ height: 8, background: '#e8eaed', borderRadius: 4 }}>
                            <div style={{ width: `${overallPct}%`, height: '100%', background: '#7c3aed', borderRadius: 4, transition: 'width 0.3s' }} />
                          </div>
                        </div>

                        {/* 색상별 카드 */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                          {COLOR_META.map(({ key: c, label, bg, border, textColor }) => {
                            const total = colorTotals[c] || 0;
                            const recv  = recvByColor[c] || 0;
                            const pct   = total > 0 ? Math.round((recv / total) * 100) : 0;
                            return (
                              <div key={c} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: textColor, marginBottom: 6 }}>{label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: textColor }}>{recv}<span style={{ fontSize: 11, fontWeight: 500 }}>/{total}</span></div>
                                <div style={{ fontSize: 11, color: c === 'white' ? '#888' : 'rgba(255,255,255,0.7)', marginBottom: 6 }}>수령/전체</div>
                                <div style={{ height: 4, background: c === 'white' ? '#e0e0e0' : 'rgba(255,255,255,0.25)', borderRadius: 2 }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: c === 'white' ? '#7c3aed' : 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: c === 'white' ? '#7c3aed' : 'rgba(255,255,255,0.9)', marginTop: 4 }}>{pct}%</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 날짜별 수령 */}
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#5f6368', marginBottom: 8 }}>날짜별 수령</div>
                        {dateEntries.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px', color: '#9aa0a6', fontSize: 13, background: '#f8f9fa', borderRadius: 8 }}>
                            아직 수령된 티셔츠가 없습니다.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {dateEntries.map(([date, d]) => (
                              <div key={date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: 8, padding: '10px 14px' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>📅 {date}</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '3px 10px', borderRadius: 20 }}>{d.total}장</span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ede9fe', borderRadius: 8, padding: '10px 14px' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>합계</span>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{totalRecv}장</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            <ToolRow>
              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                <input
                  type="text"
                  placeholder="이름 검색..."
                  value={tshirtSearch}
                  onChange={e => setTshirtSearch(e.target.value)}
                  style={{padding:'6px 10px', border:'1px solid #dadce0', borderRadius:'6px', fontSize:'13px', minWidth:'140px'}}
                />
                {(['all', 'received', 'pending'] as const).map(f => (
                  <FilterChip
                    key={f}
                    active={tshirtReceiveFilter === f}
                    onClick={() => setTshirtReceiveFilter(f)}
                  >
                    {f === 'all' ? '전체' : f === 'received' ? '✅ 수령완료' : '⏳ 미수령'}
                  </FilterChip>
                ))}
              </div>
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
                    <CancelBtn
                      style={{background:'#fce8e6', color:'#c5221f', borderColor:'#f28b82'}}
                      onClick={() => {
                        if (confirm(`${selectedIds.size}명의 티셔츠 신청을 취소(삭제)하시겠습니까?`)) {
                          tshirtCancelMutation.mutate(Array.from(selectedIds));
                        }
                      }}
                      disabled={tshirtCancelMutation.isPending}
                    >
                      🗑 신청 취소
                    </CancelBtn>
                  </>
                )}
                <ExportBtn onClick={() => exportTshirtExcel(tshirts)}>
                  📥 티셔츠 내역 엑셀
                </ExportBtn>
              </div>
            </ToolRow>

            {isTshirtsLoading ? <Loading>불러오는 중...</Loading> : (() => {
              const filtered = tshirts.filter((t: any) => {
                const matchSearch = !tshirtSearch.trim() || t.name?.includes(tshirtSearch.trim());
                const matchReceive =
                  tshirtReceiveFilter === 'all' ? true :
                  tshirtReceiveFilter === 'received' ? t.status === 'distributed' :
                  t.status !== 'distributed';
                return matchSearch && matchReceive;
              });
              return (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th><input type="checkbox" checked={filtered.length > 0 && filtered.every((t:any) => selectedIds.has(t.id))} onChange={() => toggleAll(filtered)} /></Th>
                      <Th>이름</Th><Th>그룹/다락방</Th><Th>연락처</Th><Th>주문내역</Th><Th>총수량(총액)</Th><Th>신청일시</Th><Th>입금확인</Th><Th>수령</Th><Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t:any) => (
                      <tr key={t.id} style={{background: t.status === 'distributed' ? '#f5f3ff' : t.status === 'confirmed' ? '#f0fdf4' : undefined}}>
                        <Td><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} /></Td>
                        <Td><strong>{t.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>
                          {t.community && <div>{t.community}</div>}
                          {(t.group_name || t.cell_name) && (
                            <div style={{color:'#9aa0a6'}}>
                              {[t.group_name, t.cell_name].filter(Boolean).join(' / ')}
                            </div>
                          )}
                        </Td>
                        <Td style={{fontSize:'13px'}}>{t.phone}</Td>
                        <Td style={{fontSize:'13px'}}>
                          {t.items?.map((item:any, idx:number) => (
                            <div key={idx}>{item.color} {item.size} ({item.quantity}장)</div>
                          ))}
                        </Td>
                        <Td>
                          <strong>{t.items?.reduce((sum:number, item:any)=>sum+item.quantity, 0)}장</strong>
                          <div style={{fontSize:'11px', color:'#5f6368'}}>
                            ({calcTshirtPrice(t.items || []).toLocaleString()}원)
                          </div>
                        </Td>
                        <Td style={{fontSize:'12px', color:'#5f6368', whiteSpace:'nowrap'}}>
                          {t.created_at ? new Date(t.created_at).toLocaleString('ko-KR', {
                            month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', hour12: false,
                            timeZone: 'Asia/Seoul',
                          }) : '-'}
                        </Td>
                        <Td><DepBadge ok={t.status === 'confirmed' || t.status === 'distributed'}>{t.status === 'confirmed' || t.status === 'distributed' ? '입금완료' : '확인중'}</DepBadge></Td>
                        <Td>
                          {t.status === 'distributed' ? (
                            <div>
                              <DepBadge ok style={{background:'#ede9fe', color:'#6d28d9'}}>수령완료</DepBadge>
                              {t.received_at && (
                                <div style={{fontSize:'11px', color:'#7c3aed', marginTop:'3px', whiteSpace:'nowrap'}}>
                                  {new Date(t.received_at).toLocaleString('ko-KR', {
                                    timeZone: 'Asia/Seoul',
                                    month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit', hour12: false,
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <DepBadge ok={false}>미수령</DepBadge>
                          )}
                        </Td>
                        <Td>
                          <BtnGrp>
                            {t.status === 'confirmed'
                              ? <CancelBtn onClick={()=>tshirtDepositMutation.mutate({ids: [t.id], status: 'pending'})}>확인취소</CancelBtn>
                              : t.status === 'distributed'
                              ? null
                              : <SaveBtn onClick={()=>tshirtDepositMutation.mutate({ids: [t.id], status: 'confirmed'})}>입금완료</SaveBtn>
                            }
                            <CancelBtn
                              style={{background:'#fce8e6', color:'#c5221f', borderColor:'#f28b82', marginTop:'4px'}}
                              onClick={() => {
                                if (confirm(`${t.name}님의 티셔츠 신청을 취소(삭제)하시겠습니까?`)) {
                                  tshirtCancelMutation.mutate([t.id]);
                                }
                              }}
                            >
                              신청취소
                            </CancelBtn>
                          </BtnGrp>
                        </Td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={10} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>{tshirtSearch ? '검색 결과가 없습니다.' : '주문자가 없습니다.'}</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
              );
            })()}
          </div>
        )}

        {/* ── 미입금 추적 탭 ── */}
        {activeTab === 'unpaid' && canAccessUnpaid && (
          <div>
            <UnpaidSubTitle>입금은 됐으나 신청서를 작성하지 않은 인원을 관리합니다. 연락처가 입금확인 탭에 존재하면 신청완료로 자동 표시됩니다.</UnpaidSubTitle>
            <DepositSummary>
              <RoomStatItem><RoomStatNum>{unpaidEntries.length}</RoomStatNum><RoomStatLabel>전체</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#f59e0b'}}>{unpaidEntries.filter(e=>e.sms_sent).length}</RoomStatNum><RoomStatLabel>문자 발송</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#278f5a'}}>{unpaidEntries.filter(e=>e.registered).length}</RoomStatNum><RoomStatLabel>신청 완료</RoomStatLabel></RoomStatItem>
              <RoomStatItem><RoomStatNum style={{color:'#d93025'}}>{unpaidEntries.filter(e=>!e.registered).length}</RoomStatNum><RoomStatLabel>미신청</RoomStatLabel></RoomStatItem>
            </DepositSummary>

            <UnpaidAddCard>
              <SearchBox>
                <SearchIn placeholder="이름" value={unpaidName} onChange={e => setUnpaidName(e.target.value)} onKeyDown={e => e.key === 'Enter' && unpaidAddMutation.mutate()} style={{maxWidth:'160px'}} />
                <SearchIn placeholder="연락처 (예: 010-0000-0000)" value={unpaidPhone} onChange={e => setUnpaidPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && unpaidAddMutation.mutate()} />
                <BulkBtn onClick={() => unpaidAddMutation.mutate()} disabled={!unpaidName.trim() || unpaidAddMutation.isPending}>+ 추가</BulkBtn>
              </SearchBox>
              {unpaidAddError && <div style={{color:'#d93025',fontSize:'13px',marginTop:'8px'}}>{unpaidAddError}</div>}
            </UnpaidAddCard>

            {isUnpaidLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>#</Th><Th>이름</Th><Th>연락처</Th><Th style={{textAlign:'center'}}>독려 문자</Th><Th style={{textAlign:'center'}}>신청서 작성</Th><Th style={{textAlign:'center'}}>입금확인</Th><Th>메모</Th><Th style={{textAlign:'center'}}>삭제</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidEntries.map((entry, i) => (
                      <tr key={entry.id} style={{background: entry.registered && entry.deposit_confirmed ? '#f0fdf4' : entry.registered ? '#fefce8' : undefined}}>
                        <Td>{i + 1}</Td>
                        <Td><strong>{entry.name}</strong></Td>
                        <Td>{entry.phone || '-'}</Td>
                        <Td style={{textAlign:'center'}}>
                          <FilterBtn active={entry.sms_sent} onClick={() => unpaidSmsMutation.mutate({id: entry.id, value: !entry.sms_sent})}>
                            {entry.sms_sent ? '✅ 발송완료' : '📱 미발송'}
                          </FilterBtn>
                        </Td>
                        <Td style={{textAlign:'center'}}>
                          <DepBadge ok={entry.registered}>{entry.registered ? '✅ 신청완료' : '⏳ 미신청'}</DepBadge>
                        </Td>
                        <Td style={{textAlign:'center'}}>
                          <DepBadge ok={entry.deposit_confirmed}>
                            {!entry.registered ? '-' : entry.deposit_confirmed ? '✅ 입금완료' : '❌ 미입금'}
                          </DepBadge>
                        </Td>
                        <Td>
                          <UnpaidMemoInput
                            defaultValue={entry.memo || ''}
                            placeholder="메모 입력 후 Enter"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                unpaidMemoMutation.mutate({ id: entry.id, memo: (e.target as HTMLInputElement).value });
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            onBlur={e => unpaidMemoMutation.mutate({ id: entry.id, memo: e.target.value })}
                          />
                        </Td>
                        <Td style={{textAlign:'center'}}>
                          <CancelBtn onClick={() => { if (confirm(`${entry.name}을(를) 삭제할까요?`)) unpaidDeleteMutation.mutate(entry.id); }}>삭제</CancelBtn>
                        </Td>
                      </tr>
                    ))}
                    {unpaidEntries.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>등록된 미입금자가 없습니다.</td></tr>}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        )}

        {/* ── 대기자 승인 탭 ── */}
        {activeTab === 'waitlist' && (
          <div>
            <WaitlistHeader>
              <WaitlistDesc>
                정원(700명) 초과로 대기 중인 신청자 목록입니다. <strong>명단 포함</strong> 버튼을 누르면 정식 명단으로 이동하며 버스·숙소 탭에도 연동됩니다.
              </WaitlistDesc>
              <DepositSummary>
                <RoomStatItem><RoomStatNum>{waitlistEntries.length}</RoomStatNum><RoomStatLabel>대기 중</RoomStatLabel></RoomStatItem>
              </DepositSummary>
            </WaitlistHeader>
            {isWaitlistLoading ? <Loading>불러오는 중...</Loading> : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>이름</Th>
                      <Th>그룹</Th>
                      <Th>순장</Th>
                      <Th>공동체</Th>
                      <Th>성별</Th>
                      <Th>연락처</Th>
                      <Th>출발</Th>
                      <Th>복귀</Th>
                      <Th>선택강의</Th>
                      <Th>자원봉사</Th>
                      <Th>자기입금</Th>
                      <Th>신청일</Th>
                      <Th>관리</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistEntries.map((r, i) => (
                      <tr key={r.id} style={{background: '#fffbeb'}}>
                        <Td style={{color:'#9aa0a6',fontSize:'12px'}}>{i + 1}</Td>
                        <Td><strong>{r.name}</strong></Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.group_name}</Td>
                        <Td style={{fontSize:'13px',color:'#5f6368'}}>{r.leader_name || '-'}</Td>
                        <Td style={{fontSize:'13px'}}>{r.community}</Td>
                        <Td>{r.gender}</Td>
                        <Td style={{fontSize:'13px'}}>{r.phone}</Td>
                        <Td><SlotChip>{sl(r.departure_slot)}</SlotChip></Td>
                        <Td style={{fontSize:'13px'}}>{sl(r.return_slot)}</Td>
                        <Td style={{fontSize:'13px'}}>{r.elective_lecture || '-'}</Td>
                        <Td style={{fontSize:'13px'}}>{r.volunteer_team || '-'}</Td>
                        <Td><DepBadge ok={r.deposit_confirm}>{r.deposit_confirm ? '입금했다고 함' : '미신고'}</DepBadge></Td>
                        <Td style={{fontSize:'12px',color:'#9aa0a6'}}>{fmtDateTime(r.created_at)}</Td>
                        <Td>
                          <BtnGrp>
                            <SaveBtn
                              onClick={() => {
                                if (confirm(`${r.name}님을 정식 명단에 포함하시겠습니까?\n버스·숙소 탭에도 연동됩니다.`)) {
                                  waitlistApproveMutation.mutate(r.id);
                                }
                              }}
                              disabled={waitlistApproveMutation.isPending}
                            >
                              ✅ 명단 포함
                            </SaveBtn>
                            <CancelBtn
                              style={{marginTop:'4px'}}
                              onClick={() => {
                                if (confirm(`${r.name}님의 대기 신청을 취소하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                                  waitlistCancelMutation.mutate(r.id);
                                }
                              }}
                              disabled={waitlistCancelMutation.isPending}
                            >
                              신청취소
                            </CancelBtn>
                          </BtnGrp>
                        </Td>
                      </tr>
                    ))}
                    {waitlistEntries.length === 0 && (
                      <tr>
                        <td colSpan={14} style={{textAlign:'center',padding:'40px',color:'#9aa0a6'}}>
                          대기자가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        )}

        {/* ── 챌린지 탭 ── */}
        {activeTab === 'challenge' && (
          <ChallengeTabContent />
        )}
      </TabContent>
    </Wrap>
  );
}

// ── 챌린지 탭 컴포넌트 ──────────────────────────────────────
function ChallengeTabContent() {
  const [data, setData] = useState<{
    participants: {
      user_id: string;
      name: string;
      affiliation: string;
      completed_days: number[];
      completed_count: number;
      total_shares: number;
      last_share_dt: string;
    }[];
    totalShares: number;
    totalParticipants: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Day별 나눔 조회
  const [view, setView] = useState<'participants' | 'day'>('participants');
  const [selectedDay, setSelectedDay] = useState(1);
  const [dayShares, setDayShares] = useState<{
    share_id: string; seq: number; name: string; affiliation: string; content: string; reg_dt: string;
  }[]>([]);
  const [daySharesLoading, setDaySharesLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hub-challenge/participants')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view !== 'day') return;
    setDaySharesLoading(true);
    fetch(`/api/admin/hub-challenge/day-shares?day=${selectedDay}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setDayShares(d.shares || []); })
      .catch(console.error)
      .finally(() => setDaySharesLoading(false));
  }, [view, selectedDay]);

  const filtered = (data?.participants || []).filter((p) =>
    p.name.includes(search) || p.affiliation.includes(search)
  );

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['이름', '소속', '참여일수', '총나눔수', '완료일', '마지막나눔'],
      ...data.participants.map((p) => [
        p.name,
        p.affiliation,
        String(p.completed_count),
        String(p.total_shares),
        p.completed_days.join(', '),
        p.last_share_dt ? new Date(p.last_share_dt).toLocaleDateString('ko-KR') : '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `챌린지_참여현황_${new Date().toLocaleDateString('ko-KR')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading>불러오는 중...</Loading>;
  if (!data) return <Loading style={{ color: '#d93025' }}>데이터를 불러올 수 없습니다.</Loading>;

  return (
    <ChallengeWrap>
      {/* KPI */}
      <ChallengeKpiRow>
        <ChallengeKpiCard accent="#2D478C">
          <ChallengeKpiNum>{data.totalParticipants}</ChallengeKpiNum>
          <ChallengeKpiLabel>참여자 수</ChallengeKpiLabel>
        </ChallengeKpiCard>
        <ChallengeKpiCard accent="#8DADFF">
          <ChallengeKpiNum style={{ color: '#2D478C' }}>{data.totalShares}</ChallengeKpiNum>
          <ChallengeKpiLabel>총 나눔 수</ChallengeKpiLabel>
        </ChallengeKpiCard>
        <ChallengeKpiCard accent="#278f5a">
          <ChallengeKpiNum style={{ color: '#278f5a' }}>
            {data.participants.filter((p) => p.completed_count >= 19).length}
          </ChallengeKpiNum>
          <ChallengeKpiLabel>19일 완주</ChallengeKpiLabel>
        </ChallengeKpiCard>
        <ChallengeKpiCard accent="#f59e0b">
          <ChallengeKpiNum style={{ color: '#f59e0b' }}>
            {data.participants.length > 0
              ? Math.round(
                  (data.participants.reduce((s, p) => s + p.completed_count, 0) /
                    data.participants.length) *
                    10
                ) / 10
              : 0}
          </ChallengeKpiNum>
          <ChallengeKpiLabel>평균 참여일</ChallengeKpiLabel>
        </ChallengeKpiCard>
      </ChallengeKpiRow>

      {/* 뷰 전환 탭 */}
      <ChallengeViewTabs>
        <ChallengeViewTab $active={view === 'participants'} onClick={() => setView('participants')}>
          👥 참여자별 현황
        </ChallengeViewTab>
        <ChallengeViewTab $active={view === 'day'} onClick={() => setView('day')}>
          📅 Day별 나눔 조회
        </ChallengeViewTab>
      </ChallengeViewTabs>

      {/* ── 참여자별 현황 ── */}
      {view === 'participants' && (
        <>
          <ChallengeToolbar>
            <ChallengeSearch
              placeholder="이름 또는 소속 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ExportBtn onClick={exportCsv}>CSV 내보내기</ExportBtn>
          </ChallengeToolbar>

          <ChallengeTableWrap>
            <ChallengeTable>
              <thead>
                <tr>
                  <CTh style={{ width: 40 }}>#</CTh>
                  <CTh>이름</CTh>
                  <CTh>소속</CTh>
                  <CTh style={{ width: 90, textAlign: 'center' }}>참여일수</CTh>
                  <CTh style={{ width: 70, textAlign: 'center' }}>나눔수</CTh>
                  <CTh>완료일 현황 (Day 1→19)</CTh>
                  <CTh style={{ width: 90 }}>마지막 나눔</CTh>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <React.Fragment key={p.user_id}>
                    <tr
                      style={{ cursor: 'pointer', background: expandedUser === p.user_id ? '#f8f9ff' : undefined }}
                      onClick={() => setExpandedUser(expandedUser === p.user_id ? null : p.user_id)}
                    >
                      <CTd style={{ color: '#9aa0a6', textAlign: 'center' }}>{i + 1}</CTd>
                      <CTd><strong>{p.name}</strong></CTd>
                      <CTd style={{ color: '#5f6368', fontSize: 12 }}>{p.affiliation}</CTd>
                      <CTd style={{ textAlign: 'center' }}>
                        <ChallengeDayBadge $count={p.completed_count}>
                          {p.completed_count} / 19
                        </ChallengeDayBadge>
                      </CTd>
                      <CTd style={{ textAlign: 'center', color: '#5f6368' }}>{p.total_shares}</CTd>
                      <CTd>
                        <ChallengeDayDots>
                          {Array.from({ length: 19 }, (_, idx) => idx + 1).map((day) => (
                            <ChallengeDayDot
                              key={day}
                              $done={p.completed_days.includes(day)}
                              title={`Day ${day}`}
                            />
                          ))}
                        </ChallengeDayDots>
                      </CTd>
                      <CTd style={{ fontSize: 12, color: '#9aa0a6' }}>
                        {p.last_share_dt
                          ? new Date(p.last_share_dt).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                            })
                          : '-'}
                      </CTd>
                    </tr>
                    {expandedUser === p.user_id && (
                      <tr>
                        <CTd colSpan={7} style={{ background: '#f0f4ff', padding: '12px 16px' }}>
                          <ChallengeExpandLabel>완료한 Day:</ChallengeExpandLabel>
                          <ChallengeExpandDays>
                            {p.completed_days.map((d) => (
                              <ChallengeExpandDay key={d}>Day {d}</ChallengeExpandDay>
                            ))}
                            {p.completed_days.length === 0 && (
                              <span style={{ color: '#9aa0a6' }}>없음</span>
                            )}
                          </ChallengeExpandDays>
                          <div style={{ marginTop: 6, fontSize: 12, color: '#9aa0a6' }}>
                            미완료: Day{' '}
                            {Array.from({ length: 19 }, (_, i) => i + 1)
                              .filter((d) => !p.completed_days.includes(d))
                              .join(', ') || '없음'}
                          </div>
                        </CTd>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <CTd colSpan={7} style={{ textAlign: 'center', color: '#9aa0a6', padding: '32px' }}>
                      참여자가 없습니다.
                    </CTd>
                  </tr>
                )}
              </tbody>
            </ChallengeTable>
          </ChallengeTableWrap>
        </>
      )}

      {/* ── Day별 나눔 조회 ── */}
      {view === 'day' && (
        <>
          <ChallengeDaySelector>
            {Array.from({ length: 19 }, (_, i) => i + 1).map((d) => {
              const count = data.participants.filter((p) => p.completed_days.includes(d)).length;
              return (
                <ChallengeDaySelectorBtn
                  key={d}
                  $active={selectedDay === d}
                  onClick={() => setSelectedDay(d)}
                >
                  <span>Day {d}</span>
                  <small>{count}명</small>
                </ChallengeDaySelectorBtn>
              );
            })}
          </ChallengeDaySelector>

          {daySharesLoading ? (
            <Loading>불러오는 중...</Loading>
          ) : (
            <ChallengeTableWrap>
              <div style={{ padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14, color: '#202124' }}>Day {selectedDay} 나눔 목록</strong>
                <span style={{ fontSize: 13, color: '#9aa0a6' }}>총 {dayShares.length}개</span>
              </div>
              <ChallengeTable>
                <thead>
                  <tr>
                    <CTh style={{ width: 40 }}>#</CTh>
                    <CTh style={{ width: 80 }}>이름</CTh>
                    <CTh style={{ width: 120 }}>소속</CTh>
                    <CTh>나눔 내용</CTh>
                    <CTh style={{ width: 90 }}>작성일시</CTh>
                  </tr>
                </thead>
                <tbody>
                  {dayShares.map((s) => (
                    <tr key={s.share_id}>
                      <CTd style={{ color: '#9aa0a6', textAlign: 'center' }}>{s.seq}</CTd>
                      <CTd><strong>{s.name}</strong></CTd>
                      <CTd style={{ fontSize: 12, color: '#5f6368' }}>{s.affiliation}</CTd>
                      <CTd style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 13 }}>{s.content}</CTd>
                      <CTd style={{ fontSize: 11, color: '#9aa0a6', whiteSpace: 'nowrap' }}>
                        {new Date(s.reg_dt).toLocaleString('ko-KR', {
                          month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </CTd>
                    </tr>
                  ))}
                  {dayShares.length === 0 && (
                    <tr>
                      <CTd colSpan={5} style={{ textAlign: 'center', color: '#9aa0a6', padding: '32px' }}>
                        아직 나눔이 없습니다.
                      </CTd>
                    </tr>
                  )}
                </tbody>
              </ChallengeTable>
            </ChallengeTableWrap>
          )}
        </>
      )}
    </ChallengeWrap>
  );
}

// ── Styles ──────────────────────────────────────────────────
const Wrap = styled.div`padding: 20px; font-family: 'Pretendard', sans-serif; background: #f8f9fa; min-height: 100%;`;
const PageHeader = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;`;
const PageTitle = styled.h2`font-size: 18px; font-weight: 700; color: #202124; margin: 0;`;
const HeaderBadges = styled.div`display: flex; gap: 6px;`;
const Badge = styled.span<{color:string}>`padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${p=>p.color}18; color: ${p=>p.color}; border: 1px solid ${p=>p.color}30;`;
const ExportBtn = styled.button`padding: 7px 14px; background: #1d4ed8; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; margin-left: auto; &:hover{background:#1e40af;}`;
const RefreshBtn = styled.button`padding: 7px 14px; background: white; color: #5f6368; border: 1px solid #dadce0; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; &:hover{background:#f1f3f4;}`;
const TabBar = styled.div`display: flex; border-bottom: 2px solid #e8eaed; margin-bottom: 20px; gap: 2px;`;
const Tab = styled.button<{active:boolean}>`padding: 10px 16px; background: none; border: none; font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid ${p=>p.active?'#278f5a':'transparent'}; margin-bottom: -2px; color: ${p=>p.active?'#278f5a':'#9aa0a6'};`;
const TabContent = styled.div``;
const Loading = styled.div`text-align: center; padding: 40px; color: #9aa0a6;`;
const StatsWrap = styled.div`display: flex; flex-direction: column; gap: 14px;`;
const KpiRow = styled.div`display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;`;
const KpiCard = styled.div<{accent:string}>`background: white; border-radius: 10px; padding: 16px; text-align: center; border-top: 3px solid ${p=>p.accent}; box-shadow: 0 1px 4px rgba(0,0,0,0.06);`;
const KpiNum = styled.div`font-size: 28px; font-weight: 800; color: #202124;`;
const KpiLabel = styled.div`font-size: 12px; color: #9aa0a6; margin-top: 4px;`;
const TopGroupCardGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;`;
const TopGroupCard = styled.div<{color:string; border:string}>`background: ${p=>p.color}; border-radius: 12px; padding: 0; text-align: center; border: 1px solid ${p=>p.border}; display: flex; flex-direction: column; align-items: center; overflow: hidden; gap: 0;`;
const TopGroupAccentBar = styled.div<{color:string}>`width: 100%; height: 5px; background: ${p=>p.color}; flex-shrink: 0;`;
const TopGroupName = styled.div<{color:string}>`font-size: 14px; font-weight: 700; color: ${p=>p.color}; margin-top: 14px;`;
const TopGroupNum = styled.div`font-size: 36px; font-weight: 800; color: #202124; line-height: 1.1; display: flex; align-items: baseline; gap: 3px; margin-top: 6px;`;
const TopGroupUnit = styled.span`font-size: 14px; font-weight: 500; color: #9aa0a6;`;
const TopGroupGenderRow = styled.div`display: flex; align-items: center; gap: 6px; margin-top: 6px;`;
const TopGroupGenderItem = styled.span<{male?:boolean}>`font-size: 12px; font-weight: 600; color: ${p=>p.male?'#2563eb':'#d93025'};`;
const TopGroupGenderDivider = styled.span`width: 1px; height: 10px; background: #d1d5db;`;
const TopGroupSub = styled.div`font-size: 11px; color: #9aa0a6;`;
const TopGroupPct = styled.div<{color:string}>`font-size: 13px; color: ${p=>p.color}; font-weight: 700; margin: 8px 0 14px;`;
const Card = styled.div`background: white; border-radius: 10px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);`;
const GenderCard = styled.div`background: white; border-radius: 10px; padding: 24px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); display: flex; flex-direction: column; align-items: center;`;
const CardTitle = styled.div`font-size: 12px; font-weight: 700; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; width: 100%;`;
const GenderBarWrap = styled.div`height: 10px; border-radius: 5px; overflow: hidden; display: flex; background: #f1f3f4; width: 100%; margin-top: 16px;`;
const GenderDonut = styled.div`position: relative; width: 160px; height: 160px; margin: 0 auto 16px;`;
const GenderArc = styled.div<{male:number}>`width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(#2563eb ${p=>p.male * 3.6}deg, #d93025 0deg);`;
const GenderDonutInner = styled.div`position: absolute; inset: 28px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
const GenderDonutNum = styled.div`font-size: 22px; font-weight: 800; color: #2563eb; line-height: 1;`;
const GenderDonutLabel = styled.div`font-size: 12px; color: #9aa0a6; margin-top: 3px;`;
const GenderStatRow = styled.div`display: flex; gap: 20px; justify-content: center; width: 100%;`;
const GenderStatItem = styled.div`display: flex; flex-direction: column; align-items: center; gap: 3px;`;
const GenderStatDot = styled.div<{color:string}>`width: 10px; height: 10px; border-radius: 50%; background: ${p=>p.color};`;
const GenderStatLabel = styled.div`font-size: 12px; color: #9aa0a6;`;
const GenderStatNum = styled.div<{color:string}>`font-size: 20px; font-weight: 800; color: ${p=>p.color};`;
const GenderStatPct = styled.div`font-size: 12px; color: #9aa0a6; font-weight: 600;`;
const GenderSeg = styled.div<{w:number;color:string}>`height: 100%; width: ${p=>p.w}%; background: ${p=>p.color};`;
const GenderLegend = styled.div`display: flex; gap: 16px; justify-content: center;`;
const GenderItem = styled.span<{color:string}>`font-size: 13px; font-weight: 600; color: ${p=>p.color};`;
const TwoCol = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 14px;`;
const ThreeCol = styled.div`display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;`;
const DenseTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const DTh = styled.th<{right?:boolean}>`padding: 6px 8px; background: #f8f9fa; text-align: ${p=>p.right?'right':'left'}; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap;`;
const DTd = styled.td<{right?:boolean}>`padding: 6px 8px; border-bottom: 1px solid #f1f3f4; text-align: ${p=>p.right?'right':'left'};`;
const GroupTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const GTh = styled.th<{right?:boolean; male?:boolean; female?:boolean}>`padding: 8px 12px; background: ${p=>p.male?'#dbeafe':p.female?'#fee2e2':'#f1f3f4'}; text-align: ${p=>p.right?'right':'left'}; font-size: 11px; font-weight: 700; color: ${p=>p.male?'#1d4ed8':p.female?'#b91c1c':'#9aa0a6'}; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 2px solid #e8eaed; white-space: nowrap;`;
const GTr = styled.tr<{even:boolean}>`background: ${p=>p.even?'#ffffff':'#f8fafc'}; &:hover { background: #eef2ff; }`;
const GTd = styled.td<{right?:boolean}>`padding: 9px 12px; border-bottom: 1px solid #f1f3f4; text-align: ${p=>p.right?'right':'left'}; font-size: 13px;`;
const GroupDot = styled.span<{color:string}>`display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${p=>p.color}; margin-right: 8px; flex-shrink: 0;`;
const MaleNum = styled.span`color: #2563eb; font-weight: 600;`;
const FemaleNum = styled.span`color: #d93025; font-weight: 600;`;
const TotalNum = styled.span`font-size: 14px; font-weight: 800; color: #202124;`;
const PctNum = styled.span`color: #5f6368; font-size: 12px;`;
const MiniBarWrap = styled.div`display: flex; height: 8px; border-radius: 4px; overflow: hidden; width: 80px; background: #e8eaed;`;
const MiniBarMale = styled.div<{w:number}>`height: 100%; width: ${p=>p.w}%; background: #2563eb;`;
const MiniBarFemale = styled.div<{w:number}>`height: 100%; width: ${p=>p.w}%; background: #d93025;`;
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
const SearchIn = styled.input`flex: 1; max-width: 280px; padding: 7px 12px; border: 1px solid #dadce0; border-radius: 7px; font-size: 13px; outline: none; color: #202124; background: white; &:focus{border-color:#2563eb;}`;
const SearchBtn = styled.button`padding: 7px 14px; background: #2563eb; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; &:hover{background:#1d4ed8;}`;
const FilterLabel = styled.span`font-size: 12px; font-weight: 600; color: #5f6368; white-space: nowrap;`;
const FilterSelect = styled.select`padding: 7px 10px; border: 1px solid #dadce0; border-radius: 7px; font-size: 13px; color: #202124; background: white; outline: none; cursor: pointer; &:focus{border-color:#2563eb;}`;
const BulkBox = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;
const BulkIn = styled.input`padding: 6px 10px; border: 1px solid #dadce0; border-radius: 6px; font-size: 13px; width: 100px; outline: none;`;
const BulkBtn = styled.button`padding: 6px 12px; background: #278f5a; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; &:disabled{background:#dadce0;cursor:not-allowed;} &:not(:disabled):hover{background:#1e7046;}`;
const TableWrap = styled.div`overflow-x: auto; border-radius: 10px; border: 1px solid #e8eaed; background: white;`;
const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const Th = styled.th`padding: 9px 10px; background: #f8f9fa; text-align: left; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap;`;
const SortTh = styled.th`padding: 9px 10px; background: #f8f9fa; text-align: left; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap; cursor: pointer; user-select: none; &:hover { background: #e8eaed; color: #202124; }`;
const Td = styled.td`padding: 9px 10px; border-bottom: 1px solid #f1f3f4; vertical-align: middle;`;
const DepBadge = styled.span<{ok:boolean}>`padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${p=>p.ok?'#e6f4ea':'#fce8e6'}; color: ${p=>p.ok?'#278f5a':'#d93025'};`;
const FilterChip = styled.button<{active:boolean}>`
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid;
  background: ${p => p.active ? '#2D478C' : '#fff'};
  color: ${p => p.active ? '#fff' : '#5f6368'};
  border-color: ${p => p.active ? '#2D478C' : '#dadce0'};
  &:hover { opacity: 0.85; }
`;
const UnpaidSubTitle = styled.p`font-size: 13px; color: #9aa0a6; margin-bottom: 14px; line-height: 1.6;`;
const UnpaidAddCard = styled.div`background: white; border-radius: 10px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 16px;`;
const UnpaidMemoInput = styled.input`width: 100%; min-width: 120px; padding: 4px 8px; border: 1px solid #e8eaed; border-radius: 6px; font-size: 12px; color: #202124; background: white; &:focus { outline: none; border-color: #1d4ed8; }`;
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

// ── 페이지네이션 Styles ──────────────────────────────────────
const InlineInput = styled.input`
  padding: 3px 6px; border: 1px solid #dadce0; border-radius: 4px;
  font-size: 12px; color: #202124; background: white; outline: none;
  &:focus { border-color: #278f5a; }
`;
const InlineSelect = styled.select`
  padding: 3px 4px; border: 1px solid #dadce0; border-radius: 4px;
  font-size: 12px; color: #202124; background: white; outline: none; max-width: 130px;
  &:focus { border-color: #278f5a; }
`;
const PaginationRow = styled.div`display: flex; align-items: center; gap: 4px; justify-content: center; padding: 16px 0; flex-wrap: wrap;`;
const PaginationBtn = styled.button<{active?: boolean; disabled?: boolean}>`
  min-width: 32px; height: 32px; padding: 0 8px;
  border-radius: 6px; border: 1px solid ${p => p.active ? '#278f5a' : '#dadce0'};
  background: ${p => p.active ? '#278f5a' : 'white'};
  color: ${p => p.active ? 'white' : p.disabled ? '#c5c5c5' : '#3c4043'};
  font-size: 13px; font-weight: ${p => p.active ? '700' : '400'};
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  &:hover:not(:disabled) { background: ${p => p.active ? '#1e7a4a' : '#f1f3f4'}; }
`;
const PaginationEllipsis = styled.span`min-width: 32px; text-align: center; color: #9aa0a6; font-size: 13px;`;
const PaginationInfo = styled.span`font-size: 12px; color: #9aa0a6; margin-left: 8px;`;

// ── 대기자 탭 Styles ─────────────────────────────────────────
const WaitlistHeader = styled.div`display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;`;
const WaitlistDesc = styled.p`font-size: 13px; color: #5f6368; margin: 0; padding: 12px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; line-height: 1.6;`;

// ── 챌린지 탭 Styles ────────────────────────────────────────
const ChallengeWrap = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const ChallengeKpiRow = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;`;
const ChallengeKpiCard = styled.div<{accent:string}>`background: white; border-radius: 10px; padding: 16px; text-align: center; border-top: 3px solid ${p=>p.accent}; box-shadow: 0 1px 4px rgba(0,0,0,0.06);`;
const ChallengeKpiNum = styled.div`font-size: 28px; font-weight: 800; color: #2D478C;`;
const ChallengeKpiLabel = styled.div`font-size: 12px; color: #9aa0a6; margin-top: 4px;`;
const ChallengeToolbar = styled.div`display: flex; gap: 10px; align-items: center;`;
const ChallengeSearch = styled.input`flex: 1; padding: 8px 14px; border: 1px solid #e8eaed; border-radius: 8px; font-size: 14px; color: #202124; background: white; &:focus { outline: none; border-color: #2D478C; }`;
const ChallengeTableWrap = styled.div`background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);`;
const ChallengeTable = styled.table`width: 100%; border-collapse: collapse; font-size: 13px;`;
const CTh = styled.th`padding: 10px 12px; background: #f8f9fa; text-align: left; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; white-space: nowrap;`;
const CTd = styled.td`padding: 10px 12px; border-bottom: 1px solid #f1f3f4; vertical-align: middle;`;
const ChallengeDayBadge = styled.span<{$count:number}>`
  display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 700;
  background: ${p => p.$count >= 19 ? '#e6f4ea' : p.$count >= 10 ? '#e8f0fe' : '#f1f3f4'};
  color: ${p => p.$count >= 19 ? '#278f5a' : p.$count >= 10 ? '#1d4ed8' : '#5f6368'};
`;
const ChallengeDayDots = styled.div`display: flex; gap: 3px; flex-wrap: wrap;`;
const ChallengeDayDot = styled.div<{$done:boolean}>`
  width: 10px; height: 10px; border-radius: 50%;
  background: ${p => p.$done ? '#2D478C' : '#e8eaed'};
  flex-shrink: 0;
`;
const ChallengeExpandLabel = styled.span`font-size: 12px; font-weight: 700; color: #5f6368; margin-right: 8px;`;
const ChallengeExpandDays = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;`;
const ChallengeExpandDay = styled.span`padding: 2px 8px; background: #e8f0fe; color: #1d4ed8; border-radius: 4px; font-size: 12px; font-weight: 600;`;

const ChallengeViewTabs = styled.div`display: flex; gap: 4px; border-bottom: 2px solid #e8eaed; margin-bottom: 4px;`;
const ChallengeViewTab = styled.button<{$active:boolean}>`padding: 8px 16px; background: none; border: none; font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid ${p=>p.$active?'#2D478C':'transparent'}; margin-bottom: -2px; color: ${p=>p.$active?'#2D478C':'#9aa0a6'};`;
const ChallengeDaySelector = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;
const ChallengeDaySelectorBtn = styled.button<{$active:boolean}>`
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 12px; border-radius: 8px; cursor: pointer; font-family: inherit;
  background: ${p=>p.$active?'#2D478C':'white'};
  border: 1px solid ${p=>p.$active?'#2D478C':'#e8eaed'};
  span { font-size: 13px; font-weight: 700; color: ${p=>p.$active?'white':'#202124'}; }
  small { font-size: 11px; color: ${p=>p.$active?'rgba(255,255,255,0.7)':'#9aa0a6'}; }
`;
