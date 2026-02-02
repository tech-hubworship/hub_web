import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as S from '../users/style';
import ManualUserSearch from './ManualUserSearch';

export default function AttendanceList() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [manualUserId, setManualUserId] = useState('');
  const [manualUserName, setManualUserName] = useState('');
  const [manualCheckInAt, setManualCheckInAt] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [manualChecking, setManualChecking] = useState(false);
  
  const queryClient = useQueryClient();

  // ⚠️ 중요: 조회 API(src/app/api/attendance/list/route.ts)에서 'updated_by', 'note'도 select 해야 함
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['admin-attendance', date],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/list?date=${date}`);
      return res.json();
    }
  });

  const list = attendanceData?.data || [];
  const stats = attendanceData?.stats;

  // 상태 변경 핸들러
  // currentNote 인자를 제거했습니다. 항상 빈 칸으로 시작합니다.
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    let statusText = newStatus;
    if (newStatus === 'excused') statusText = '사유 인정(면제)';
    if (newStatus === 'present') statusText = '정상 출석';
    if (newStatus === 'unexcused_absence') statusText = '무단 결석';
    if (newStatus === 'late') statusText = '지각';

    // ⭐️ [수정] 기본값을 ""(빈 문자열)로 설정하여 입력창을 깨끗하게 비움
    const note = prompt(`'${statusText}' 처리 사유를 입력해주세요. (필수 입력)\n예: 다리 부상, 사전 연락됨`, "");
    
    // 취소 버튼을 눌렀으면 중단
    if (note === null) return; 
    
    // ⭐️ [방어] 빈 값이나 공백만 입력하고 엔터치면 경고 후 중단
    if (note.trim() === "") {
      alert("변경 사유는 필수입니다. 내용을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch('/api/admin/attendance/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekDate: date,
          status: newStatus,
          note: note, // 입력받은 사유 전송
          category: 'OD'
        }),
      });

      if (res.ok) {
        alert("저장되었습니다.");
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

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>📋 OD 출석 관리</S.Title>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {/* 수동 출석체크 */}
        <div style={{ marginBottom: '20px', padding: '20px', background: '#f0f9ff', border: '1px solid #7dd3fc', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#0369a1', marginBottom: '12px' }}>
            ✏️ 수동 출석체크
          </h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <ManualUserSearch
              value={manualUserId}
              displayName={manualUserName}
              onSelect={(id, name) => { setManualUserId(id); setManualUserName(name || ''); }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b' }}>출석 시간</label>
              <input
                type="datetime-local"
                value={manualCheckInAt}
                onChange={(e) => setManualCheckInAt(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
            <button
              onClick={async () => {
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
                    queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
                  } else {
                    alert(data.error || '처리 실패');
                  }
                } catch {
                  alert('오류 발생');
                } finally {
                  setManualChecking(false);
                }
              }}
              disabled={manualChecking || !manualUserId}
              style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: manualChecking || !manualUserId ? 'not-allowed' : 'pointer' }}
            >
              {manualChecking ? '처리 중...' : '출석 처리'}
            </button>
          </div>
        </div>

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

                        {/* 비고(사유) 및 변경자 표시 컬럼 */}
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
                          <select
                            style={{ 
                              padding: '6px', 
                              fontSize: '12px', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '6px', 
                              background: 'white',
                              cursor: 'pointer'
                            }}
                            onChange={(e) => {
                              if (e.target.value) {
                                // ⭐️ [수정] 더 이상 기존 사유(item.note)를 넘기지 않습니다.
                                handleUpdateStatus(item.user_id, e.target.value); 
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>상태 변경</option>
                            <option value="excused">✅ 사유 인정 (면제)</option>
                            <option value="present">⏰ 정상 출석 처리</option>
                            <option value="late">⚠️ 지각 처리</option>
                            <option value="unexcused_absence">🚨 무단 결석 처리</option>
                          </select>
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