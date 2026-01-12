import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as S from '../users/style'; // 기존 스타일 재사용
import { Combobox } from '@src/components/ui/combobox';

export default function AttendanceList() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [category, setCategory] = useState('OD');
  const [page, setPage] = useState(1);

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['admin-attendance', date, category, page],
    queryFn: async () => {
      const params = new URLSearchParams({ date, category, page: page.toString() });
      const res = await fetch(`/api/admin/attendance/list?${params}`);
      return res.json();
    }
  });

  const list = attendanceData?.data || [];
  const pagination = attendanceData?.pagination;

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>📋 출석 관리</S.Title>
          <S.Subtitle>QR 출석 현황을 확인합니다.</S.Subtitle>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {/* 필터 영역 */}
        <div style={{ display: 'flex', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>날짜 선택</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', height: '42px' }} 
            />
          </div>
          
          <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>카테고리</label>
            <Combobox 
              value={category}
              onChange={setCategory}
              options={[{ value: 'OD', label: 'OD (리더십)' }, { value: 'HUB_UP', label: '허브업' }]}
              placeholder="선택"
            />
          </div>
          
          <button 
            onClick={() => refetch()}
            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}
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
                    <S.TableHead>소속 (그룹/다락방)</S.TableHead>
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