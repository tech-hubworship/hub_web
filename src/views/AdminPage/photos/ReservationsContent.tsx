/**
 * 예약 관리 - 콘텐츠 전용 컴포넌트 (MDI용)
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { QrReader } from 'react-qr-reader';

interface Reservation {
  id: number;
  photo_id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  reservation_date: string;
  message: string;
  created_at: string;
  updated_at: string;
  photos: {
    id: number;
    title: string;
    image_url: string;
    photo_folders: {
      id: number;
      name: string;
    };
  };
}

interface ReservationStats {
  total: number;
  pending: number;
  completed: number;
  received: number;
  cancelled: number;
}

// 스타일드 컴포넌트
const ReservationContainer = styled.div`
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const QRButton = styled.button`
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  flex: 1;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  
  &:hover {
    background: #f0f9ff;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1f2937;
  vertical-align: middle;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => 
    props.status === '예약중' ? 'rgba(59, 130, 246, 0.1)' :
    props.status === '예약완료' ? 'rgba(34, 197, 94, 0.1)' :
    props.status === '수령완료' ? 'rgba(5, 150, 105, 0.1)' :
    'rgba(239, 68, 68, 0.1)'
  };
  color: ${props => 
    props.status === '예약중' ? '#2563eb' :
    props.status === '예약완료' ? '#16a34a' :
    props.status === '수령완료' ? '#059669' :
    '#dc2626'
  };
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button<{ variant?: string }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${props => 
    props.variant === 'complete' ? '#10b981' :
    props.variant === 'cancel' ? '#ef4444' :
    '#667eea'
  };
  color: white;

  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const CameraContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  video {
    width: 100vw !important;
    height: 100vh !important;
    object-fit: cover !important;
  }
`;

const CameraControls = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
  display: flex;
  justify-content: center;
  z-index: 1003;
`;

const CameraButton = styled.button`
  padding: 18px 32px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
`;

const ScanGuide = styled.div`
  position: fixed;
  top: 40px;
  left: 20px;
  right: 20px;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  z-index: 1003;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px 24px;
  border-radius: 16px;
`;

const BatchActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const BatchButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.variant === 'danger' ? '#dc3545' : '#007bff'};
  color: white;
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ScannedListModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ScannedListContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
`;

const CompleteButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;

  &:hover {
    background: #059669;
  }
`;

export default function ReservationsContent() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats>({
    total: 0, pending: 0, completed: 0, received: 0, cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReservations, setSelectedReservations] = useState<number[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [scannedReservations, setScannedReservations] = useState<Reservation[]>([]);
  const [showScannedList, setShowScannedList] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    let filtered = reservations;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.user_name?.toLowerCase().includes(query) || 
        r.user_email?.toLowerCase().includes(query)
      );
    }
    
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'user_name':
          aValue = a.user_name || '';
          bValue = b.user_name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
    
    setFilteredReservations(filtered);
  }, [statusFilter, searchQuery, reservations, sortBy, sortOrder]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/photos/reservations');
      const data = await response.json();
      if (response.ok) {
        setReservations(data.reservations || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('예약 현황 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/photos/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || '예약 상태가 수정되었습니다.');
        loadReservations();
      } else {
        alert(data.error || '상태 수정에 실패했습니다.');
      }
    } catch (error) {
      alert('상태 수정 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const convertGoogleDriveUrl = (url: string) => {
    if (!url) return url;
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
    return url;
  };

  const processQRCode = async (qrString: string) => {
    try {
      setScanning(true);
      
      let qrData;
      try {
        qrData = JSON.parse(qrString);
      } catch {
        alert('유효하지 않은 QR 코드 형식입니다.');
        return;
      }

      if (qrData.type === 'batch_exchange') {
        await processBatchQR(qrData);
        return;
      }

      if (!qrData.reservationId) {
        alert('예약 ID가 포함되지 않은 QR 코드입니다.');
        return;
      }

      const reservation = reservations.find(r => r.id === qrData.reservationId);
      if (!reservation) {
        alert('해당 예약을 찾을 수 없습니다.');
        return;
      }

      if (reservation.status !== '예약완료') {
        alert('예약완료 상태가 아닌 예약입니다.');
        return;
      }

      setScannedReservations([reservation]);
      setShowScannedList(true);
      setShowCamera(false);
    } catch (error) {
      alert('QR 코드 처리 중 오류가 발생했습니다.');
    } finally {
      setScanning(false);
    }
  };

  const processBatchQR = async (qrData: any) => {
    const { reservationIds } = qrData;
    
    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      alert('일괄 처리할 예약이 없습니다.');
      return;
    }

    const foundReservations = reservations.filter(r => 
      reservationIds.includes(r.id) && r.status === '예약완료'
    );

    if (foundReservations.length === 0) {
      alert('교환 가능한 예약이 없습니다.');
      return;
    }

    setScannedReservations(foundReservations);
    setShowScannedList(true);
    setShowCamera(false);
  };

  const handleCompleteDelivery = async () => {
    try {
      const reservationIds = scannedReservations.map(r => r.id);
      
      const response = await fetch('/api/admin/photos/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationIds,
          status: '수령완료',
          message: 'QR 코드로 수령 완료'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${result.updatedCount}개의 사진이 수령완료 처리되었습니다!`);
        loadReservations();
        setShowScannedList(false);
        setScannedReservations([]);
      } else {
        alert(result.error || '수령완료 처리에 실패했습니다.');
      }
    } catch (error) {
      alert('수령완료 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSelectAll = () => {
    if (selectedReservations.length === filteredReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(filteredReservations.map(r => r.id));
    }
  };

  const handleSelectReservation = (reservationId: number) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const handleBatchComplete = async () => {
    if (selectedReservations.length === 0) {
      alert('처리할 예약을 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedReservations.length}개의 예약을 완료 처리하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/photos/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationIds: selectedReservations,
          status: '예약완료',
          message: '일괄 완료 처리됨'
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`${result.updatedCount}개의 예약이 완료 처리되었습니다!`);
        setSelectedReservations([]);
        loadReservations();
      } else {
        alert(result.error || '일괄 처리에 실패했습니다.');
      }
    } catch (error) {
      alert('일괄 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBatchCancel = async () => {
    if (selectedReservations.length === 0) {
      alert('취소할 예약을 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedReservations.length}개의 예약을 취소하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/photos/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationIds: selectedReservations,
          status: '취소됨',
          message: '일괄 취소 처리됨'
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`${result.updatedCount}개의 예약이 취소되었습니다!`);
        setSelectedReservations([]);
        loadReservations();
      } else {
        alert(result.error || '일괄 취소에 실패했습니다.');
      }
    } catch (error) {
      alert('일괄 취소 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <ReservationContainer>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          예약 현황을 불러오는 중...
        </div>
      </ReservationContainer>
    );
  }

  return (
    <>
      <ReservationContainer>
        <StatsGrid>
          <StatCard>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>전체 예약</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: '#2563eb' }}>{stats.pending}</StatValue>
            <StatLabel>예약중</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: '#16a34a' }}>{stats.completed}</StatValue>
            <StatLabel>예약완료</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: '#059669' }}>{stats.received}</StatValue>
            <StatLabel>수령완료</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: '#dc2626' }}>{stats.cancelled}</StatValue>
            <StatLabel>취소됨</StatLabel>
          </StatCard>
        </StatsGrid>

        <div style={{ marginBottom: 24, display: 'flex', gap: '8px' }}>
          <QRButton onClick={() => setShowCamera(true)} disabled={scanning}>
            📷 QR 수령
          </QRButton>
          
          <QRButton 
            onClick={() => setBatchMode(!batchMode)}
            style={{ background: batchMode ? '#dc3545' : '#6c757d' }}
          >
            {batchMode ? '일괄처리 종료' : '일괄처리 모드'}
          </QRButton>
        </div>

        <FilterBar>
          <FilterSelect 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="예약중">예약중</option>
            <option value="예약완료">예약완료</option>
            <option value="수령완료">수령완료</option>
            <option value="취소됨">취소됨</option>
          </FilterSelect>
          
          <SearchInput
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </FilterBar>

        {batchMode && (
          <BatchActionBar>
            <Checkbox
              type="checkbox"
              checked={selectedReservations.length === filteredReservations.length && filteredReservations.length > 0}
              onChange={handleSelectAll}
            />
            <span style={{ fontWeight: '600' }}>
              전체 선택 ({selectedReservations.length}/{filteredReservations.length})
            </span>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <BatchButton 
                variant="primary"
                onClick={handleBatchComplete}
                disabled={selectedReservations.length === 0}
              >
                ✓ 완료 처리 ({selectedReservations.length})
              </BatchButton>
              <BatchButton 
                variant="danger"
                onClick={handleBatchCancel}
                disabled={selectedReservations.length === 0}
              >
                ✕ 취소 처리 ({selectedReservations.length})
              </BatchButton>
            </div>
          </BatchActionBar>
        )}

        <TableContainer>
          {filteredReservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              {statusFilter === 'all' ? '예약이 없습니다.' : `"${statusFilter}" 상태의 예약이 없습니다.`}
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  {batchMode && <TableHeader style={{ width: '50px' }}>선택</TableHeader>}
                  <TableHeader>상태</TableHeader>
                  <TableHeader>사진 번호</TableHeader>
                  <TableHeader>폴더</TableHeader>
                  <TableHeader>예약자</TableHeader>
                  <TableHeader>예약일시</TableHeader>
                  <TableHeader>메시지</TableHeader>
                  <TableHeader>작업</TableHeader>
                </tr>
              </TableHead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    {batchMode && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          type="checkbox"
                          checked={selectedReservations.includes(reservation.id)}
                          onChange={() => handleSelectReservation(reservation.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge status={reservation.status}>
                        {reservation.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>#{reservation.photos.id}</TableCell>
                    <TableCell>{reservation.photos.photo_folders.name}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{reservation.user_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{reservation.user_email}</div>
                    </TableCell>
                    <TableCell>{formatDate(reservation.created_at)}</TableCell>
                    <TableCell style={{ maxWidth: '200px' }}>{reservation.message || '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {!batchMode && (
                        <ActionButtons>
                          {reservation.status === '예약중' && (
                            <>
                              <ActionButton 
                                variant="complete"
                                onClick={() => updateReservationStatus(reservation.id, '예약완료')}
                              >
                                ✓ 완료
                              </ActionButton>
                              <ActionButton 
                                variant="cancel"
                                onClick={() => updateReservationStatus(reservation.id, '취소됨')}
                              >
                                ✕ 취소
                              </ActionButton>
                            </>
                          )}
                          {reservation.status === '예약완료' && (
                            <ActionButton 
                              variant="complete"
                              onClick={() => updateReservationStatus(reservation.id, '수령완료')}
                            >
                              ✓ 수령완료
                            </ActionButton>
                          )}
                        </ActionButtons>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </TableContainer>
      </ReservationContainer>

      {/* 카메라 모달 */}
      {showCamera && (
        <CameraContainer>
          <ScanGuide>
            QR 코드를 스캔 영역에 맞춰주세요
            <br />
            <span style={{ fontSize: 14, opacity: 0.8 }}>자동으로 인식됩니다</span>
          </ScanGuide>
          
          <QrReader
            onResult={(result: any, error: any) => {
              if (result) {
                processQRCode(result.getText());
              }
            }}
            constraints={{ facingMode: 'environment' }}
            containerStyle={{ width: '100%', height: '100%' }}
          />
          
          <CameraControls>
            <CameraButton onClick={() => setShowCamera(false)}>
              닫기
            </CameraButton>
          </CameraControls>
        </CameraContainer>
      )}

      {/* 스캔된 사진 목록 모달 */}
      {showScannedList && (
        <ScannedListModal onClick={() => setShowScannedList(false)}>
          <ScannedListContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                사진예약 목록 ({scannedReservations.length}개)
              </h2>
              <CloseButton onClick={() => setShowScannedList(false)}>×</CloseButton>
            </div>
            
            {scannedReservations.map((reservation) => (
              <div key={reservation.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                marginBottom: '12px',
                background: '#f9fafb'
              }}>
                <img 
                  src={convertGoogleDriveUrl(reservation.photos.image_url)}
                  alt={reservation.photos.title}
                  style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {reservation.photos.title || '제목 없음'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    예약자: {reservation.user_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    폴더: {reservation.photos.photo_folders.name}
                  </div>
                </div>
              </div>
            ))}
            
            <CompleteButton onClick={handleCompleteDelivery}>
              ✓ 수령완료 처리 ({scannedReservations.length}개)
            </CompleteButton>
          </ScannedListContent>
        </ScannedListModal>
      )}
    </>
  );
}

