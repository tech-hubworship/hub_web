import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as S from '../users/style';
import ManualUserSearch from './ManualUserSearch';

export default function AttendanceList() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualUserName, setManualUserName] = useState('');
  const [manualCheckInAt, setManualCheckInAt] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [manualChecking, setManualChecking] = useState(false);

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionTarget, setExceptionTarget] = useState<{ userId: string; name: string } | null>(null);
  const [excuseLateFee, setExcuseLateFee] = useState(true);
  const [excuseReport, setExcuseReport] = useState(true);
  const [exceptionNote, setExceptionNote] = useState('');
  const [exceptionSubmitting, setExceptionSubmitting] = useState(false);

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

  const pad = (n: number) => String(n).padStart(2, "0");
  const sh = Number(lateCriteria.start_hour ?? 10);
  const sm = Number(lateCriteria.start_minute ?? 0);
  const startTime = `${pad(sh)}:${pad(sm)}`;

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

  const doManualCheckIn = async () => {
    if (!manualUserId) { alert('회원을 선택해주세요.'); return; }
    setManualChecking(true);
    try {
      const res = await fetch('/api/admin/attendance/manual-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: manualUserId,
          weekDate: date,
          category: 'OD',
          attendedAt: manualCheckInAt ? new Date(manualCheckInAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || '출석 처리되었습니다.');
        setManualUserId(''); setManualUserName('');
        setManualModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
      } else {
        alert(data.error || '처리 실패');
      }
    } catch {
      alert('오류 발생');
    } finally {
      setManualChecking(false);
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
        {/* 지각 로직 안내: late_at = 지각 시작 시각(10:00), 정상은 그로부터 40분까지 */}
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
            📌 지각 로직 (late_at = 지각 시작 시각)
          </h4>
          <p style={{ fontSize: '13px', color: '#0c4a6e', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            지각 시작 시각: <strong>{startTime}</strong> (late_at에 기록된 시각, QR 생성 시 설정)
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
              <strong>정상 출석</strong>: {startTime} 전
            </span>
            <span>
              <strong>지각</strong>: {startTime}부터 (10분까지 1,000원 · 20분까지 2,000원 · 30분까지 3,000원 · 그 이후 4,000원)
            </span>
            <span>
              <strong>무단 결석</strong>: 출석 관리에서 무단 결석 버튼으로 체크 시 5,000원
            </span>
          </div>
        </div>

        {/* 수동 출석체크 버튼 */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setManualUserId('');
              setManualUserName('');
              setManualCheckInAt(dayjs().format('YYYY-MM-DDTHH:mm'));
              setManualModalOpen(true);
            }}
            style={{
              padding: '12px 24px',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✏️ 수동 출석체크
          </button>
        </div>

        {/* 수동 출석 모달 */}
        {manualModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setManualModalOpen(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '420px',
                width: '90%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0', color: '#0369a1' }}>
                ✏️ 수동 출석체크
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ManualUserSearch
                  value={manualUserId}
                  displayName={manualUserName}
                  onSelect={(id, name) => { setManualUserId(id); setManualUserName(name || ''); }}
                />
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>출석 시간</label>
                  <input
                    type="datetime-local"
                    value={manualCheckInAt}
                    onChange={(e) => setManualCheckInAt(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={doManualCheckIn}
                    disabled={manualChecking || !manualUserId}
                    style={{
                      padding: '10px 20px',
                      background: manualChecking || !manualUserId ? '#94a3b8' : '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: manualChecking || !manualUserId ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {manualChecking ? '처리 중...' : '출석 처리'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* 통계 요약 카드 */}
        {!isLoading && stats && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                📊 출석 현황 요약
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                OD 명단 기준 · {date}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                {stats.attended_count}명 <span style={{ fontSize: '16px', color: '#94a3b8' }}>/ {stats.total_members}명</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: stats.attendance_rate >= 80 ? '#16a34a' : '#f59e0b' }}>
                출석률 {stats.attendance_rate}%
              </div>
            </div>
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

        {/* 테이블 영역 */}
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
                {list.length === 0 ? (
                  <S.TableRow>
                    <S.TableData colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                      OD 명단이 비어 있습니다. OD 명단 관리에서 회원을 추가해주세요.
                    </S.TableData>
                  </S.TableRow>
                ) : (
                  list.map((item: any) => {
                    const hasAttended = item.attended_at != null;
                    const isExcused = item.status === 'excused';
                    const isUnexcusedAbsence = item.status === 'unexcused_absence';
                    const isLate = item.status === 'late';

                    return (
                      <S.TableRow key={item.id}>
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
