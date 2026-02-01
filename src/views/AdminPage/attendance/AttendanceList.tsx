import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as S from '../users/style'; 
import { Combobox } from '@src/components/ui/combobox';
import { useGroups } from '@src/hooks/useGroups';
import { useCells } from '@src/hooks/useCells';
import ManualUserSearch from './ManualUserSearch';

export default function AttendanceList() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [category, setCategory] = useState('OD');
  
  // 필터 상태
  const [groupId, setGroupId] = useState('');
  const [cellId, setCellId] = useState('');
  const [page, setPage] = useState(1);

  // OD 대상 업로드 & 수동 출석
  const [uploadingOd, setUploadingOd] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualUserName, setManualUserName] = useState('');
  const [manualCheckInAt, setManualCheckInAt] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [manualChecking, setManualChecking] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // 🔴 [수정됨] 커스텀 훅 반환값 구조 수정 (data 프로퍼티 없음)
  const { groups } = useGroups();
  const { cells } = useCells(groupId ? Number(groupId) : ''); 

  // 데이터 조회 쿼리
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['admin-attendance', date, category, groupId, cellId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        date, 
        category, 
        page: page.toString(),
        limit: '20'
      });
      
      if (groupId) params.append('group_id', groupId);
      if (cellId) params.append('cell_id', cellId);

      const res = await fetch(`/api/attendance/list?${params}`);
      return res.json();
    }
  });

  const list = attendanceData?.data || [];
  const pagination = attendanceData?.pagination;
  const stats = attendanceData?.stats;

  const handleGroupChange = (value: string) => {
    setGroupId(value);
    setCellId(''); 
    setPage(1);
  };

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>📋 출석 관리</S.Title>
          <S.Subtitle>QR 출석 현황 및 통계를 확인합니다.</S.Subtitle>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {/* OD 대상 엑셀 업로드 (OD 카테고리일 때만) */}
        {category === 'OD' && (
          <div style={{ marginBottom: '20px', padding: '20px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#92400e', marginBottom: '12px' }}>
              📤 OD 대상 명단 업로드
            </h4>
            <p style={{ fontSize: '13px', color: '#a16207', marginBottom: '12px' }}>
              엑셀에 &apos;이름&apos;(또는 name) 컬럼이 있어야 합니다. 이메일 컬럼이 있으면 매칭 정확도가 높아집니다.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingOd(true);
                  try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const base64 = (reader.result as string)?.split(',')[1] || reader.result;
                      const res = await fetch('/api/admin/attendance/od-targets/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileData: base64, weekDate: date, category }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert(`매칭 ${data.matched}명 저장됨${data.unmatched?.length ? `\n매칭 안됨: ${data.unmatched.join(', ')}` : ''}`);
                        queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
                      } else {
                        alert(data.error || '업로드 실패');
                      }
                      setUploadingOd(false);
                      e.target.value = '';
                    };
                    reader.readAsDataURL(file);
                  } catch {
                    setUploadingOd(false);
                    alert('업로드 중 오류 발생');
                  }
                }}
              />
              <button
                onClick={() => excelInputRef.current?.click()}
                disabled={uploadingOd}
                style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: uploadingOd ? 'not-allowed' : 'pointer' }}
              >
                {uploadingOd ? '업로드 중...' : '엑셀 파일 선택'}
              </button>
            </div>
          </div>
        )}

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
                      category,
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
                선택된 조건({date}, {category}, {groupId ? '그룹선택' : '전체'}) 기준입니다.
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

        {/* 필터 영역 */}
        <div style={{ display: 'flex', gap: '12px', padding: '20px', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>날짜</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: '0 12px', border: '1px solid #d7d7d7', borderRadius: '6px', fontSize: '14px', height: '48px', boxSizing: 'border-box' }} 
            />
          </div>
          
          <div style={{ width: '140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>카테고리</label>
            <Combobox 
              value={category}
              onChange={setCategory}
              options={[{ value: 'OD', label: 'OD (리더십)' }, { value: 'HUB_UP', label: '허브업' }]}
              placeholder="선택"
            />
          </div>

          <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>그룹</label>
            <Combobox 
              value={groupId}
              onChange={handleGroupChange}
              options={[
                { value: '', label: '전체 그룹' },
                ...(groups?.map(g => ({ value: g.id.toString(), label: g.name })) || [])
              ]}
              placeholder="그룹 선택"
            />
          </div>

          <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>다락방</label>
            <Combobox 
              value={cellId}
              onChange={setCellId}
              options={[
                { value: '', label: '전체 다락방' },
                ...(cells?.map(c => ({ value: c.id.toString(), label: c.name })) || [])
              ]}
              placeholder="다락방 선택"
              disabled={!groupId} 
            />
          </div>
          
          <button 
            onClick={() => refetch()}
            style={{ padding: '0 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '48px', marginLeft: 'auto' }}
          >
            조회하기
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
                        출석 데이터가 없습니다.
                      </S.TableData>
                    </S.TableRow>
                  ) : (
                    list.map((item: any) => {
                      const profile = item.profiles || {};
                      const isLate = item.status !== 'present';
                      return (
                        <S.TableRow key={item.id}>
                          <S.TableData>
                            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{profile.name}</span>
                          </S.TableData>
                          <S.TableData>
                            {profile.groups?.name || '-'} / {profile.cells?.name || '-'}
                          </S.TableData>
                          <S.TableData>
                            {dayjs(item.attended_at).format('HH:mm:ss')}
                          </S.TableData>
                          <S.TableData>
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
            
            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white', cursor: page === 1 ? 'default' : 'pointer' }}
                >
                  이전
                </button>
                <span style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                  {page} / {pagination.totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white', cursor: page >= pagination.totalPages ? 'default' : 'pointer' }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </S.Container>
    </>
  );
}