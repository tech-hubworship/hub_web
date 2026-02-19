import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { LATE_GRACE_MINUTES } from '@src/lib/attendance/late-fee';
import * as S from '../users/style';

export default function AttendanceList() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editAttendedAt, setEditAttendedAt] = useState('');
  const [editStatus, setEditStatus] = useState('present');
  const [editNote, setEditNote] = useState('');
  const [editLateFee, setEditLateFee] = useState('');
  const [editReportRequired, setEditReportRequired] = useState(false);
  const [editExcused, setEditExcused] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionTarget, setExceptionTarget] = useState<{ userId: string; name: string } | null>(null);
  const [excuseLateFee, setExcuseLateFee] = useState(true);
  const [excuseReport, setExcuseReport] = useState(true);
  const [exceptionNote, setExceptionNote] = useState('');
  const [exceptionSubmitting, setExceptionSubmitting] = useState(false);

  const [filterGroup, setFilterGroup] = useState('');
  const [filterCell, setFilterCell] = useState('');
  const [filterName, setFilterName] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const queryClient = useQueryClient();

  const { data: attendanceData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-attendance', date],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/list?date=${date}`);
      return res.json();
    }
  });

  const list = attendanceData?.data || [];
  const stats = attendanceData?.stats;
  const lateCriteria = attendanceData?.late_criteria || { start_hour: 10, start_minute: 0 };

  const groupOptions = Array.from(new Set(list.map((r: any) => r.group_name).filter((g: any): g is string => !!g && g !== '-'))) as string[];
  const cellOptions = Array.from(new Set(list.map((r: any) => r.cell_name).filter((c: any): c is string => !!c && c !== '-'))) as string[];
  groupOptions.sort();
  cellOptions.sort();
  const filteredList = list.filter((row: any) => {
    if (filterGroup && (row.group_name ?? '-') !== filterGroup) return false;
    if (filterCell && (row.cell_name ?? '-') !== filterCell) return false;
    if (filterName && !(row.name || '').toLowerCase().includes(filterName.trim().toLowerCase())) return false;
    return true;
  });
  const filteredAttendedCount = filteredList.filter((d: any) => d.attended_at != null).length;
  const filteredTotal = filteredList.length;
  const filteredStats = filteredTotal
    ? {
        attended_count: filteredAttendedCount,
        total_members: filteredTotal,
        attendance_rate: Math.round((filteredAttendedCount / filteredTotal) * 100),
      }
    : stats;

  // 그룹장만 / 다락방장만 (필터 적용 기준, 각각 재적·출석·출석율)
  const groupLeadersList = filteredList.filter((r: any) => r.is_group_leader);
  const groupLeadersAttended = groupLeadersList.filter((r: any) => r.attended_at != null).length;
  const groupLeadersStats = {
    total: groupLeadersList.length,
    attended: groupLeadersAttended,
    rate: groupLeadersList.length ? Math.round((groupLeadersAttended / groupLeadersList.length) * 100) : 0,
  };
  const cellLeadersList = filteredList.filter((r: any) => r.is_cell_leader);
  const cellLeadersAttended = cellLeadersList.filter((r: any) => r.attended_at != null).length;
  const cellLeadersStats = {
    total: cellLeadersList.length,
    attended: cellLeadersAttended,
    rate: cellLeadersList.length ? Math.round((cellLeadersAttended / cellLeadersList.length) * 100) : 0,
  };

  // 다락방별 통계: 그룹장·다락방장 제외, 트리 구조 (그룹 → 다락방)
  const treeStats = (() => {
    const membersOnly = filteredList.filter((r: any) => !r.is_group_leader && !r.is_cell_leader);
    const byGroup = new Map<string, Map<string, { total: number; attended: number }>>();
    for (const row of membersOnly) {
      const gn = row.group_name ?? '-';
      const cn = row.cell_name ?? '-';
      if (!byGroup.has(gn)) byGroup.set(gn, new Map());
      const cells = byGroup.get(gn)!;
      if (!cells.has(cn)) cells.set(cn, { total: 0, attended: 0 });
      const cur = cells.get(cn)!;
      cur.total += 1;
      if (row.attended_at != null) cur.attended += 1;
    }
    const result: { group_name: string; cells: { cell_name: string; total: number; attended: number; rate: number }[] }[] = [];
    Array.from(byGroup.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([group_name, cells]) => {
        const cellList = Array.from(cells.entries())
          .map(([cell_name, v]) => ({
            cell_name,
            ...v,
            rate: v.total ? Math.round((v.attended / v.total) * 100) : 0,
          }))
          .sort((a, b) => a.cell_name.localeCompare(b.cell_name));
        result.push({ group_name, cells: cellList });
      });
    return result;
  })();

  const pad = (n: number) => String(n).padStart(2, "0");
  const sh = Number(lateCriteria.start_hour ?? 10);
  const sm = Number(lateCriteria.start_minute ?? 0);
  const startTime = `${pad(sh)}:${pad(sm)}`;
  const graceEndM = sh * 60 + sm + LATE_GRACE_MINUTES;
  const graceEndTime = `${pad(Math.floor(graceEndM / 60) % 24)}:${pad(graceEndM % 60)}`;
  const fmt = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const seg1 = `${fmt(graceEndM + 1)}~${fmt(graceEndM + 10)}`;
  const seg2 = `${fmt(graceEndM + 11)}~${fmt(graceEndM + 20)}`;
  const seg3 = `${fmt(graceEndM + 21)}~${fmt(graceEndM + 30)}`;
  const seg4 = `${fmt(graceEndM + 31)}~`;

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const note = "수동 처리";

    try {
      const res = await fetch('/api/admin/attendance/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekDate: date,
          status: newStatus,
          note,
          category: 'OD'
        }),
      });

      if (res.ok) {
        refetch();
      } else {
        const err = await res.json();
        alert(err.error || "변경 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  const openExceptionModal = (userId: string, name: string) => {
    setExceptionTarget({ userId, name });
    setExcuseLateFee(true);
    setExcuseReport(true);
    setExceptionNote('');
    setExceptionModalOpen(true);
  };

  const submitException = async () => {
    if (!exceptionTarget) return;
    if (!exceptionNote.trim()) {
      alert("변경 사유를 입력해주세요.");
      return;
    }
    setExceptionSubmitting(true);
    try {
      const res = await fetch('/api/admin/attendance/exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: exceptionTarget.userId,
          weekDate: date,
          excuseLateFee,
          excuseReport,
          note: exceptionNote.trim(),
          category: 'OD'
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "예외 처리되었습니다.");
        setExceptionModalOpen(false);
        setExceptionTarget(null);
        refetch();
      } else {
        alert(data.error || "처리 실패");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setExceptionSubmitting(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditTarget(item);
    setEditAttendedAt(item.attended_at ? dayjs(item.attended_at).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm'));
    setEditStatus(item.status || 'present');
    setEditNote(item.note || '');
    setEditLateFee(item.late_fee != null ? String(item.late_fee) : '0');
    setEditReportRequired(!!item.is_report_required);
    setEditExcused(!!item.is_excused);
    setEditModalOpen(true);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const lateFeeNum = parseInt(editLateFee, 10);
    if (Number.isNaN(lateFeeNum) || lateFeeNum < 0) {
      alert('지각비는 0 이상 숫자를 입력해주세요.');
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch('/api/admin/attendance/manual-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editTarget.user_id,
          weekDate: date,
          category: 'OD',
          attended_at: editAttendedAt ? new Date(editAttendedAt).toISOString() : null,
          status: editStatus,
          note: editNote.trim() || null,
          late_fee: lateFeeNum,
          is_report_required: editReportRequired,
          is_excused: editExcused,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || '저장되었습니다.');
        setEditModalOpen(false);
        setEditTarget(null);
        refetch();
      } else {
        alert(data.error || '저장 실패');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>📋 OD 출석 관리</S.Title>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {/* 지각 로직 안내: N분까지 정상, (N+1)분부터 지각 */}
        <div
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            background: '#f0f9ff',
            border: '1px solid #7dd3fc',
            borderRadius: '12px',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0369a1', margin: '0 0 12px 0' }}>
            📌 지각 로직 ({LATE_GRACE_MINUTES}분까지 정상, {LATE_GRACE_MINUTES + 1}분부터 지각)
          </h4>
          <p style={{ fontSize: '13px', color: '#0c4a6e', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            지각 기준 시각: <strong>{startTime}</strong> (late_at, QR 생성 시 설정)
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0369a1',
                background: 'white',
                border: '1px solid #7dd3fc',
                borderRadius: '6px',
                cursor: isRefetching ? 'not-allowed' : 'pointer',
              }}
            >
              {isRefetching ? '갱신 중…' : '지각 시간 업데이트'}
            </button>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px', fontSize: '14px', color: '#0c4a6e' }}>
            <span>
              <strong>정상 출석</strong>: {startTime} ~ {graceEndTime} ({LATE_GRACE_MINUTES}분까지)
            </span>
            <span>
              <strong>지각</strong>: {graceEndTime} 이후 · {seg1} 1,000원 · {seg2} 2,000원 · {seg3} 3,000원 · {seg4} 4,000원
            </span>
            <span>
              <strong>무단 결석</strong>: 출석 관리에서 무단 결석 버튼으로 체크 시 5,000원
            </span>
          </div>
        </div>

        {/* 예외처리 모달 */}
        {exceptionModalOpen && exceptionTarget && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
            }}
            onClick={() => setExceptionModalOpen(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
                예외처리 – {exceptionTarget.name}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={excuseLateFee}
                    onChange={(e) => setExcuseLateFee(e.target.checked)}
                  />
                  <span>지각비 예외처리</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={excuseReport}
                    onChange={(e) => setExcuseReport(e.target.checked)}
                  />
                  <span>OD 보고서 예외처리</span>
                </label>
                {(!excuseLateFee && !excuseReport) && (
                  <span style={{ fontSize: '13px', color: '#dc2626' }}>하나 이상 선택해주세요.</span>
                )}
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>변경 사유 (필수)</label>
                  <textarea
                    value={exceptionNote}
                    onChange={(e) => setExceptionNote(e.target.value)}
                    placeholder="예: 병결, 사전 연락됨"
                    rows={3}
                    style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setExceptionModalOpen(false)}
                    style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={submitException}
                    disabled={exceptionSubmitting || (!excuseLateFee && !excuseReport) || !exceptionNote.trim()}
                    style={{
                      padding: '10px 20px',
                      background: (exceptionSubmitting || (!excuseLateFee && !excuseReport) || !exceptionNote.trim()) ? '#94a3b8' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: (exceptionSubmitting || (!excuseLateFee && !excuseReport) || !exceptionNote.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {exceptionSubmitting ? '처리 중...' : '예외 처리'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 수동 입력 모달 (출석시간·상태·비고·지각비·OD보고서·예외처리) */}
        {editModalOpen && editTarget && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1002,
            }}
            onClick={() => !editSubmitting && setEditModalOpen(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '440px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0', color: '#374151' }}>
                수동 입력 – {editTarget.name}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>출석 시간</label>
                  <input
                    type="datetime-local"
                    value={editAttendedAt}
                    onChange={(e) => setEditAttendedAt(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>상태</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%', background: 'white' }}
                  >
                    <option value="present">정상</option>
                    <option value="late">지각</option>
                    <option value="unexcused_absence">무단 결석</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>비고</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="수정 사유 등"
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>지각비 (원)</label>
                  <input
                    type="number"
                    min={0}
                    value={editLateFee}
                    onChange={(e) => setEditLateFee(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editReportRequired} onChange={(e) => setEditReportRequired(e.target.checked)} />
                  <span>OD 보고서 대상</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editExcused} onChange={(e) => setEditExcused(e.target.checked)} />
                  <span>예외 처리 여부</span>
                </label>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => !editSubmitting && setEditModalOpen(false)}
                    style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={submitEdit}
                    disabled={editSubmitting}
                    style={{
                      padding: '10px 20px',
                      background: editSubmitting ? '#94a3b8' : '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: editSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {editSubmitting ? '저장 중…' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 통계 요약 카드 + 다락방별 펼치기 */}
        {!isLoading && (stats || filteredStats) && (
          <div style={{
            marginBottom: '20px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                  📊 출석 현황 요약
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  OD 명단 기준 · {date}
                  {(filterGroup || filterCell || filterName) && (
                    <span style={{ marginLeft: '8px', color: '#0284c7' }}> (필터: {filteredTotal}명)</span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                    {(filteredStats || stats).attended_count}명 <span style={{ fontSize: '16px', color: '#94a3b8' }}>/ {(filteredStats || stats).total_members}명</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: ((filteredStats || stats).attendance_rate >= 80 ? '#16a34a' : '#f59e0b') }}>
                    출석률 {(filteredStats || stats).attendance_rate}%
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSummaryExpanded((v) => !v)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {summaryExpanded ? '접기 ▲' : '다락방별 보기 ▼'}
                </button>
              </div>
            </div>
            {summaryExpanded && (
              <div style={{
                borderTop: '1px solid #e2e8f0',
                padding: '16px 20px',
                background: '#f8fafc',
              }}>
                {/* 그룹장들끼리 재적·출석·출석율 */}
                {(groupLeadersList.length > 0 || cellLeadersList.length > 0) && (
                  <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {groupLeadersList.length > 0 && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '10px 16px', background: '#eff6ff', fontWeight: '600', color: '#1e40af', fontSize: '14px', borderLeft: '3px solid #3b82f6' }}>
                          그룹장
                        </div>
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <span>재적 <strong style={{ color: '#334155' }}>{groupLeadersStats.total}명</strong></span>
                          <span>출석 <strong style={{ color: '#2563eb' }}>{groupLeadersStats.attended}명</strong></span>
                          <span>출석율 <strong style={{ color: groupLeadersStats.rate >= 80 ? '#16a34a' : '#f59e0b' }}>{groupLeadersStats.rate}%</strong></span>
                        </div>
                      </div>
                    )}
                    {cellLeadersList.length > 0 && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                        <div style={{ padding: '10px 16px', background: '#f0fdf4', fontWeight: '600', color: '#166534', fontSize: '14px', borderLeft: '3px solid #22c55e' }}>
                          다락방장
                        </div>
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <span>재적 <strong style={{ color: '#334155' }}>{cellLeadersStats.total}명</strong></span>
                          <span>출석 <strong style={{ color: '#2563eb' }}>{cellLeadersStats.attended}명</strong></span>
                          <span>출석율 <strong style={{ color: cellLeadersStats.rate >= 80 ? '#16a34a' : '#f59e0b' }}>{cellLeadersStats.rate}%</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 다락방별 통계 (그룹장·다락방장 제외) - 트리 형태, 그리드로 가로 활용 */}
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '10px' }}>
                  다락방별 재적 · 출석 · 출석율 (그룹장·다락방장 제외)
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {treeStats.length === 0 ? (
                    <div style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', gridColumn: '1 / -1', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                      그룹장·다락방장을 제외한 멤버가 없거나 필터 결과가 없습니다.
                    </div>
                  ) : (
                    treeStats.map((group) => (
                      <div
                        key={group.group_name}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'white',
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 16px',
                            background: '#f1f5f9',
                            fontWeight: '600',
                            color: '#1e293b',
                            fontSize: '14px',
                            borderLeft: '3px solid #3b82f6',
                          }}
                        >
                          📁 {group.group_name}
                        </div>
                        {group.cells.map((cell) => (
                          <div
                            key={`${group.group_name}|${cell.cell_name}`}
                            style={{
                              padding: '8px 16px 8px 24px',
                              borderTop: '1px solid #f1f5f9',
                              fontSize: '13px',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ color: '#64748b', flex: '0 0 auto' }}>└ {cell.cell_name}</span>
                            <span>재적 <strong style={{ color: '#334155' }}>{cell.total}명</strong></span>
                            <span>출석 <strong style={{ color: '#2563eb' }}>{cell.attended}명</strong></span>
                            <span>출석율 <strong style={{ color: cell.rate >= 80 ? '#16a34a' : '#f59e0b' }}>{cell.rate}%</strong></span>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 날짜 선택 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
          />
          <button
            onClick={() => refetch()}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            조회
          </button>
        </div>

        {/* 필터 (그룹 / 다락방 / 이름) - OD 명단 관리와 동일 */}
        {list.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>필터</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#64748b' }}>이름</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="이름 검색"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '120px',
                  background: 'white',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#64748b' }}>그룹</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '140px',
                  background: 'white',
                }}
              >
                <option value="">전체</option>
                {groupOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#64748b' }}>다락방</label>
              <select
                value={filterCell}
                onChange={(e) => setFilterCell(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '140px',
                  background: 'white',
                }}
              >
                <option value="">전체</option>
                {cellOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {(filterGroup || filterCell || filterName) && (
              <button
                type="button"
                onClick={() => { setFilterGroup(''); setFilterCell(''); setFilterName(''); }}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  color: '#64748b',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                필터 초기화
              </button>
            )}
          </div>
        )}

        {/* 테이블 영역 (그룹 → 다락방 → 이름 순) */}
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>데이터를 불러오는 중...</div>
        ) : (
          <S.TableContainer>
            <S.Table>
              <S.TableHeader>
                <S.TableRow>
                  <S.TableHead>이름</S.TableHead>
                  <S.TableHead>소속 (그룹 / 다락방)</S.TableHead>
                  <S.TableHead>출석 시간</S.TableHead>
                  <S.TableHead>상태</S.TableHead>
                  <S.TableHead>비고 (수정 사유)</S.TableHead>
                  <S.TableHead>지각비</S.TableHead>
                  <S.TableHead>OD 보고서</S.TableHead>
                  <S.TableHead>관리</S.TableHead>
                </S.TableRow>
              </S.TableHeader>
              <tbody>
                {filteredList.length === 0 ? (
                  <S.TableRow>
                    <S.TableData colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                      {list.length === 0
                        ? 'OD 명단이 비어 있습니다. OD 명단 관리에서 회원을 추가해주세요.'
                        : '해당 조건에 맞는 명단이 없습니다.'}
                    </S.TableData>
                  </S.TableRow>
                ) : (
                  filteredList.map((item: any) => {
                    const hasAttended = item.attended_at != null;
                    const isExcused = item.is_excused === true;
                    const isUnexcusedAbsence = item.status === 'unexcused_absence';
                    const isLate = item.status === 'late';
                    const rowBg = item.is_group_leader ? { background: '#eff6ff' } : item.is_cell_leader ? { background: '#fefce8' } : undefined;

                    return (
                      <S.TableRow key={item.id} style={rowBg}>
                        <S.TableData>
                          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{item.name}</span>
                        </S.TableData>
                        <S.TableData>
                          {item.group_name || '-'} / {item.cell_name || '-'}
                        </S.TableData>
                        <S.TableData>
                          {hasAttended ? dayjs(item.attended_at).format('HH:mm:ss') : '-'}
                        </S.TableData>

                        <S.TableData>
                          {!hasAttended ? (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>미출석</span>
                          ) : isExcused ? (
                            <span style={{ color: '#059669', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                              사유 인정
                            </span>
                          ) : isUnexcusedAbsence ? (
                            <span style={{ color: '#ffffff', background: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                              무단 결석
                            </span>
                          ) : isLate ? (
                            <span style={{ color: '#dc2626', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                              지각
                            </span>
                          ) : (
                            <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                              정상
                            </span>
                          )}
                        </S.TableData>

                        <S.TableData>
                          {item.note ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                              <span title={item.note} style={{ fontSize: '13px', color: '#374151', textAlign: 'left' }}>
                                {item.note.length > 15 ? item.note.slice(0, 15) + '...' : item.note}
                              </span>
                              {item.updated_by && (
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                  (by {item.updated_by})
                                </span>
                              )}
                            </div>
                          ) : '-'}
                        </S.TableData>

                        <S.TableData>
                          {item.late_fee > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                              {item.late_fee.toLocaleString()}원
                            </span>
                          ) : '-'}
                        </S.TableData>
                        <S.TableData>
                          {item.is_report_required ? (
                            <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '13px' }}>📝 대상</span>
                          ) : '-'}
                        </S.TableData>

                        <S.TableData>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.user_id, 'present')}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                background: '#dcfce7',
                                color: '#166534',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              출석
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.user_id, 'unexcused_absence')}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              무단결석
                            </button>
                            <button
                              type="button"
                              onClick={() => openExceptionModal(item.user_id, item.name)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                background: '#dbeafe',
                                color: '#1e40af',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              예외처리
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                background: '#78716c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              수동 입력
                            </button>
                          </div>
                        </S.TableData>
                      </S.TableRow>
                    );
                  })
                )}
              </tbody>
            </S.Table>
          </S.TableContainer>
        )}
      </S.Container>
    </>
  );
}
