import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as S from '../users/style'; 
import { Combobox } from '@src/components/ui/combobox';
import { useGroups } from '@src/hooks/useGroups';
import { useCells } from '@src/hooks/useCells';

export default function AttendanceList() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [category, setCategory] = useState('OD');
  
  // 필터 상태
  const [groupId, setGroupId] = useState('');
  const [cellId, setCellId] = useState('');
  const [page, setPage] = useState(1);

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

      const res = await fetch(`/api/admin/attendance/list?${params}`);
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
                  </S.TableRow>
                </S.TableHeader>
                <tbody>
                  {list.length === 0 ? (
                    <S.TableRow>
                      <S.TableData colSpan={5} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
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