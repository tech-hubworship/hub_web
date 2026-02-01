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

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['admin-attendance', date],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/list?date=${date}`);
      return res.json();
    }
  });

  const list = attendanceData?.data || [];
  const stats = attendanceData?.stats;

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
                    alert(data.message || '출석 처리되었습니다. 지각비는 출석 시간에 맞게 자동 계산됩니다.');
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
          <>
            <S.TableContainer>
              <S.Table>
                <S.TableHeader>
                  <S.TableRow>
                    <S.TableHead>이름</S.TableHead>
                    <S.TableHead>소속 (그룹 / 다락방)</S.TableHead>
                    <S.TableHead>출석 시간</S.TableHead>
                    <S.TableHead>상태</S.TableHead>
                    <S.TableHead>지각비</S.TableHead>
                    <S.TableHead>OD 보고서</S.TableHead>
                  </S.TableRow>
                </S.TableHeader>
                <tbody>
                  {list.length === 0 ? (
                    <S.TableRow>
                      <S.TableData colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        OD 명단이 비어 있습니다. OD 명단 관리에서 회원을 추가해주세요.
                      </S.TableData>
                    </S.TableRow>
                  ) : (
                    list.map((item: any) => {
                      const hasAttended = item.attended_at != null;
                      const isLate = item.status !== 'present' && item.status != null;
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
                            ) : (
                              <span style={{
                                color: isLate ? '#dc2626' : '#16a34a',
                                fontWeight: 'bold',
                                padding: '4px 8px',
                                background: isLate ? '#fef2f2' : '#f0fdf4',
                                borderRadius: '4px',
                                fontSize: '13px'
                              }}>
                                {isLate ? '지각' : '정상'}
                              </span>
                            )}
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
                        </S.TableRow>
                      );
                    })
                  )}
                </tbody>
              </S.Table>
            </S.TableContainer>
          </>
        )}
      </S.Container>
    </>
  );
}