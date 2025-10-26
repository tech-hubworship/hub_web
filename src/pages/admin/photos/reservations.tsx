import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import * as S from "@src/views/AdminPage/style";
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

// 예약 관리 전용 스타일드 컴포넌트
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

const QRModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QRModal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const QRModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
`;

const QRModalDescription = styled.p`
  margin: 0 0 24px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
`;

const QRInput = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: monospace;
  margin-bottom: 16px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const QRModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const QRModalButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: #10b981;
        color: white;
        &:hover { background: #059669; }
      `;
    }
    if (props.variant === 'danger') {
      return `
        background: #ef4444;
        color: white;
        &:hover { background: #dc2626; }
      `;
    }
    return `
      background: #f3f4f6;
      color: #374151;
      &:hover { background: #e5e7eb; }
    `;
  }}
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
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
  overflow: hidden;

  /* QR Reader 비디오 전체화면 스타일 */
  video {
    width: 100vw !important;
    height: 100vh !important;
    object-fit: cover !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
  }

  /* QR Reader 컨테이너 스타일 */
  > div > div {
    width: 100% !important;
    height: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
  }
`;

const CameraControls = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  z-index: 1003;
  backdrop-filter: blur(10px);
`;

const CameraButton = styled.button<{ variant?: 'danger' }>`
  padding: 18px 32px;
  background: ${props => props.variant === 'danger' ? '#ef4444' : '#10b981'};
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: ${props => props.variant === 'danger' ? '#dc2626' : '#059669'};
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  border: 3px solid #10b981;
  border-radius: 16px;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  z-index: 1001;
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
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 20px 24px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);

  span {
    display: block;
    font-size: 14px;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 4px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 32px;
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

const SortContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SortButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${props => props.active ? '#007bff' : '#ddd'};
  border-radius: 6px;
  background: ${props => props.active ? '#007bff' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.active ? '#0056b3' : '#f8f9fa'};
  }
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
  min-width: 250px;
  
  &::placeholder {
    color: #9ca3af;
  }
  
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
  
  &:hover {
    background: #f9fafb;
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

const ReservationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ReservationDetails = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
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
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 200px;
`;

const ActionButton = styled.button<{ variant?: string }>`
  padding: 8px 14px;
  border: 2px solid transparent;
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

  ${props => props.variant === 'cancel' && `
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  `}

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    background: ${props => 
      props.variant === 'complete' ? '#059669' :
      props.variant === 'cancel' ? '#dc2626' :
      '#5a67d8'
    };
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 16px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #ef4444;
  font-size: 16px;
  padding: 40px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
`;

// 상세 모달 스타일
const DetailModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const DetailModal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const DetailModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
`;

const DetailModalTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
  
  &:hover {
    color: #1f2937;
  }
`;

const DetailSection = styled.div`
  margin-bottom: 20px;
`;

const DetailLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const DetailValue = styled.div`
  font-size: 15px;
  color: #1f2937;
  line-height: 1.6;
`;

const DetailImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 8px;
`;

const ClickableRow = styled(TableRow)`
  cursor: pointer;
  
  &:hover {
    background: #f0f9ff !important;
  }
`;

const CheckboxCell = styled.td`
  padding: 12px;
  text-align: center;
  width: 50px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
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

const BatchButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #6c757d;
          color: white;
          &:hover { background: #545b62; }
        `;
    }
  }}
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SortableHeader = styled.th<{ sortable?: boolean }>`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  user-select: none;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${props => props.sortable ? '#f3f4f6' : '#f9fafb'};
  }
`;

const SortIcon = styled.span<{ active?: boolean }>`
  margin-left: 8px;
  color: ${props => props.active ? '#3b82f6' : '#9ca3af'};
  font-size: 12px;
  transition: color 0.2s ease;
`;

const ScannedListModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ScannedListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ScannedListTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const ScannedPhotoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
  background: #f9fafb;
`;

const ScannedPhotoImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e5e7eb;
`;

const ScannedPhotoInfo = styled.div`
  flex: 1;
`;

const ScannedPhotoTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ScannedPhotoDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
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
  transition: all 0.2s ease;
  margin-top: 20px;
  width: 100%;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

export default function PhotoReservations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats>({
    total: 0,
    pending: 0,
    completed: 0,
    received: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrInput, setQrInput] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReservations, setSelectedReservations] = useState<number[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [scannedReservations, setScannedReservations] = useState<any[]>([]);
  const [showScannedList, setShowScannedList] = useState(false);

  useEffect(() => {
    // 인증되지 않았거나, 사진팀 권한이 없는 경우 메인 페이지로 리디렉션
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      alert("관리자만 접근할 수 있는 페이지입니다.");
      router.replace('/');
    }
    if (status === 'authenticated' && !session?.user?.roles?.includes('사진팀')) {
      alert("사진팀 권한이 필요합니다.");
      router.replace('/admin/photos');
    }
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        setError(null);

        // 필터 없이 항상 전체 데이터를 요청합니다.
        const response = await fetch('/api/admin/photos/reservations');
        const data = await response.json();

        if (response.ok) {
          setReservations(data.reservations || []); // 전체 원본 데이터 저장
          setFilteredReservations(data.reservations || []); // 처음에는 필터링 없이 전체를 보여줌
          setStats(data.stats || stats);
        } else {
          setError(data.error || '예약 현황을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('예약 현황 로드 오류:', error);
        setError('예약 현황을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadReservations();
  }, []); // 의존성 배열이 비어있으므로, 컴포넌트가 마운트될 때 한 번만 실행됨

  // 원본 데이터가 변경될 때마다 필터링과 정렬을 다시 실행
  useEffect(() => {
    let filtered = reservations;
    
    // 상태 필터 적용
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }
    
    // 검색어 필터 적용 (이름 또는 이메일)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(reservation => 
        reservation.user_name?.toLowerCase().includes(query) || 
        reservation.user_email?.toLowerCase().includes(query)
      );
    }
    
    // 정렬 적용
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
        case 'photo_id':
          aValue = a.photos.id;
          bValue = b.photos.id;
          break;
        case 'folder':
          aValue = a.photos.photo_folders.name || '';
          bValue = b.photos.photo_folders.name || '';
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredReservations(filtered);
  }, [statusFilter, searchQuery, reservations, sortBy, sortOrder]);
  
  // 상태 업데이트 후 목록을 새로고침 (예: 예약 상태 변경, QR 처리 후)
  const refreshData = async () => {
      // 서버에서 최신 데이터를 다시 가져와 화면 갱신
      const response = await fetch('/api/admin/photos/reservations');
      const data = await response.json();
      if (response.ok) {
          setReservations(data.reservations || []);
          setStats(data.stats || stats);
      }
  };

  const updateReservationStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/photos/reservations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || '예약 상태가 수정되었습니다.');
        await refreshData(); // 목록 새로고침
      } else {
        alert(data.error || '상태 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 수정 오류:', error);
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

  // Google Drive URL 변환 함수
  const convertGoogleDriveUrl = (url: string) => {
    if (!url) return url;
    
    // Google Drive 공유 링크에서 파일 ID 추출
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      // 직접 이미지 URL로 변환
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    return url;
  };

  const handleRowClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReservation(null);
  };

  // QR 스캔 시작 (모달 없이 바로 카메라 실행)
  const startCamera = () => {
    setShowCamera(true);
  };

  // QR 스캔 종료
  const stopCamera = () => {
    setShowCamera(false);
  };


  // QR 코드 스캔 및 처리 (일괄 처리 지원)
  const processQRCode = async (qrString: string) => {
    try {
      setScanning(true);
      
      // QR 코드 데이터 파싱
      let qrData;
      try {
        qrData = JSON.parse(qrString);
      } catch (error) {
        alert('유효하지 않은 QR 코드 형식입니다.');
        return;
      }

      // 일괄 처리 QR 코드인지 확인
      if (qrData.type === 'batch_exchange') {
        await processBatchQR(qrData);
        return;
      }

      // 단일 예약 처리
      if (!qrData.reservationId) {
        alert('예약 ID가 포함되지 않은 QR 코드입니다.');
        return;
      }

      // 해당 예약이 '예약완료' 상태인지 확인
      const reservation = reservations.find(r => r.id === qrData.reservationId);
      if (!reservation) {
        alert('해당 예약을 찾을 수 없습니다.');
        return;
      }

      if (reservation.status !== '예약완료') {
        alert('예약완료 상태가 아닌 예약입니다.');
        return;
      }

      // 스캔된 예약을 목록에 추가하고 사진 목록 표시
      setScannedReservations([reservation]);
      setShowScannedList(true);
      setShowCamera(false);
    } catch (error) {
      console.error('QR 스캔 오류:', error);
      alert('QR 코드 처리 중 오류가 발생했습니다.');
    } finally {
      setScanning(false);
    }
  };

  // 일괄 처리 QR 코드 처리
  const processBatchQR = async (qrData: any) => {
    try {
      const { reservationIds, status, userId } = qrData;
      
      if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
        alert('일괄 처리할 예약이 없습니다.');
        return;
      }

      console.log('일괄 처리 시작:', { reservationIds, status, userId });

      // 해당 예약들을 찾아서 사진 목록에 표시
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
    } catch (error) {
      console.error('일괄 처리 오류:', error);
      alert('일괄 처리 중 오류가 발생했습니다.');
    }
  };

  // 스캔된 예약들 수령완료 처리
  const handleCompleteDelivery = async () => {
    try {
      const reservationIds = scannedReservations.map(r => r.id);
      
      const response = await fetch('/api/admin/photos/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationIds,
          status: '수령완료',
          message: 'QR 코드로 수령 완료'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${result.updatedCount}개의 사진이 수령완료 처리되었습니다!`);
        await refreshData();
        setShowScannedList(false);
        setScannedReservations([]);
      } else {
        alert(result.error || '수령완료 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('수령완료 처리 오류:', error);
      alert('수령완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 정렬 함수
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <SortIcon>↕</SortIcon>;
    }
    return <SortIcon active>{sortOrder === 'asc' ? '↑' : '↓'}</SortIcon>;
  };

  // 일괄 처리 관련 함수들
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        await refreshData();
      } else {
        alert(result.error || '일괄 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('일괄 처리 오류:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        await refreshData();
      } else {
        alert(result.error || '일괄 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('일괄 취소 오류:', error);
      alert('일괄 취소 중 오류가 발생했습니다.');
    }
  };

  // 수동 입력으로 QR 코드 처리
  const handleManualQRInput = async () => {
    if (!qrInput.trim()) {
      alert('QR 코드 데이터를 입력해주세요.');
      return;
    }
    await processQRCode(qrInput.trim());
  };



  // 로딩 중이거나 권한이 없는 경우
  if (status === 'loading' || !session?.user?.isAdmin || !session?.user?.roles?.includes('사진팀')) {
    return (
      <S.AdminLayout>
        <S.LoadingContainer>
          <S.LoadingSpinner />
          <S.LoadingText>Loading...</S.LoadingText>
        </S.LoadingContainer>
      </S.AdminLayout>
    );
  }

  const roles = session.user.roles || [];

  if (loading) {
    return (
      <S.AdminLayout>
        <S.LoadingContainer>
          <S.LoadingSpinner />
          <S.LoadingText>예약 현황을 불러오는 중...</S.LoadingText>
        </S.LoadingContainer>
      </S.AdminLayout>
    );
  }

  if (error) {
    return (
      <S.AdminLayout>
        <S.ContentArea>
          <S.WelcomeCard>
            <S.WelcomeTitle>오류가 발생했습니다</S.WelcomeTitle>
            <S.WelcomeSubtitle>{error}</S.WelcomeSubtitle>
          </S.WelcomeCard>
        </S.ContentArea>
      </S.AdminLayout>
    );
  }

  return (
    <>
    <S.AdminLayout>
      <S.Sidebar collapsed={sidebarCollapsed}>
        <S.SidebarHeader>
          <S.Logo>
            {!sidebarCollapsed && <S.LogoText>HUB Admin</S.LogoText>}
            <S.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '→' : '←'}
            </S.ToggleButton>
          </S.Logo>
        </S.SidebarHeader>
        
        <S.NavMenu>
          <S.NavItem as="a" onClick={() => router.push('/admin')}>
            <S.NavIcon>🏠</S.NavIcon>
            {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
          </S.NavItem>
          
          <S.NavItem as="a" onClick={() => router.push('/admin/photos')}>
            <S.NavIcon>📷</S.NavIcon>
            {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
          </S.NavItem>
          
          <S.NavItem active>
            <S.NavIcon>📋</S.NavIcon>
            {!sidebarCollapsed && <S.NavText>예약 관리</S.NavText>}
          </S.NavItem>
          
          {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
            <S.NavItem as="a" onClick={() => router.push('/admin/design')}>
              <S.NavIcon>🎨</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
            </S.NavItem>
          )}
          
          {roles.includes('서기') && (
            <S.NavItem as="a" onClick={() => router.push('/admin/secretary')}>
              <S.NavIcon>✍️</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
            </S.NavItem>
          )}
        </S.NavMenu>
      </S.Sidebar>

      <S.MainContent>
        <S.TopBar>
          <S.TopBarLeft>
            <S.PageTitle>예약 관리</S.PageTitle>
            <S.Breadcrumb>관리자 페이지 &gt; 사진팀 관리 &gt; 예약 관리</S.Breadcrumb>
          </S.TopBarLeft>
          <S.TopBarRight>
            <S.UserInfo>
              <S.UserAvatar>
                {session.user.name?.charAt(0) || 'U'}
              </S.UserAvatar>
              <S.UserDetails>
                <S.UserName>{session.user.name || '관리자'}</S.UserName>
                <S.UserRole>{roles.join(', ') || '관리자'}</S.UserRole>
              </S.UserDetails>
            </S.UserInfo>
          </S.TopBarRight>
        </S.TopBar>

        <S.ContentArea>
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
        <QRButton onClick={startCamera} disabled={scanning}>
          📷 QR 수령
        </QRButton>
        
        <QRButton 
          onClick={() => setBatchMode(!batchMode)}
          style={{ 
            background: batchMode ? '#dc3545' : '#6c757d'
          }}
        >
          {batchMode ? '일괄처리 종료' : '일괄처리 모드'}
        </QRButton>
      </div>

      {/* QR 수령 모달 */}
      {showQRModal && (
        <QRModalOverlay onClick={() => setShowQRModal(false)}>
          <QRModal onClick={(e) => e.stopPropagation()}>
            <QRModalTitle>QR 수령 처리</QRModalTitle>
            <QRModalDescription>
              사용자가 보여주는 교환권 QR 코드를 스캔하거나, QR 데이터를 직접 입력하여 수령 완료 처리를 진행합니다.
            </QRModalDescription>
            
            <div style={{ marginBottom: 16 }}>
              <QRModalButton 
                variant="primary" 
                onClick={startCamera}
                disabled={scanning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                📷 카메라로 스캔
              </QRModalButton>
            </div>

            <div style={{ 
              borderTop: '1px solid #e5e7eb', 
              paddingTop: 16, 
              marginTop: 16,
              marginBottom: 16 
            }}>
              <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                또는 QR 데이터를 직접 입력
              </div>
              <QRInput
                placeholder='QR 코드 스캔 데이터를 붙여넣으세요...'
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
            </div>

            <QRModalButtons>
              <QRModalButton onClick={() => setShowQRModal(false)}>
                취소
              </QRModalButton>
              <QRModalButton 
                variant="primary" 
                onClick={handleManualQRInput}
                disabled={scanning || !qrInput.trim()}
              >
                {scanning ? '처리 중...' : '수령 완료 처리'}
              </QRModalButton>
            </QRModalButtons>
          </QRModal>
        </QRModalOverlay>
      )}

      {/* 카메라 모달 */}
      {showCamera && (
        <CameraContainer>
          <ScanGuide>
            QR 코드를 스캔 영역에 맞춰주세요
            <br />
            <span style={{ fontSize: 14, opacity: 0.8 }}>자동으로 인식됩니다</span>
          </ScanGuide>
          
          <div style={{ 
            width: '100%', 
            height: '100%',
            maxWidth: '100vw',
            maxHeight: '100vh',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <QrReader
              onResult={(result: any, error: any) => {
                if (result) {
                  console.log('✅ QR 코드 감지:', result.getText());
                  processQRCode(result.getText());
                }
                if (error) {
                  console.log('QR 스캔 에러:', error);
                }
              }}
              constraints={{ 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              }}
              videoId="qr-reader-video"
              ViewFinder={undefined}
              containerStyle={{ width: '100%', height: '100%' }}
            />
          </div>
          
          <CameraControls>
            <CameraButton onClick={stopCamera} variant="danger">
              닫기
            </CameraButton>
          </CameraControls>
        </CameraContainer>
      )}

      <div style={{ height: 20 }} />

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

      {/* 일괄 처리 액션 바 */}
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
        {loading ? (
          <div style={{ fontSize: '14px', textAlign: 'center', padding: '40px', color: '#6b7280' }}>로딩 중...</div>
        ) : filteredReservations.length === 0 ? (
          <div style={{ fontSize: '14px', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            {statusFilter === 'all' ? '예약이 없습니다.' : `"${statusFilter}" 상태의 예약이 없습니다.`}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                {batchMode && <TableHeader style={{ width: '50px' }}>선택</TableHeader>}
                <SortableHeader 
                  sortable 
                  onClick={() => handleSort('status')}
                >
                  상태{renderSortIcon('status')}
                </SortableHeader>
                <SortableHeader 
                  sortable 
                  onClick={() => handleSort('photo_id')}
                >
                  사진 번호{renderSortIcon('photo_id')}
                </SortableHeader>
                <SortableHeader 
                  sortable 
                  onClick={() => handleSort('folder')}
                >
                  폴더{renderSortIcon('folder')}
                </SortableHeader>
                <SortableHeader 
                  sortable 
                  onClick={() => handleSort('user_name')}
                >
                  예약자{renderSortIcon('user_name')}
                </SortableHeader>
                <SortableHeader 
                  sortable 
                  onClick={() => handleSort('created_at')}
                >
                  예약일시{renderSortIcon('created_at')}
                </SortableHeader>
                <TableHeader>메시지</TableHeader>
                <TableHeader style={{ textAlign: 'center' }}>작업</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <ClickableRow key={reservation.id} onClick={() => !batchMode && handleRowClick(reservation)}>
                  {batchMode && (
                    <CheckboxCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        type="checkbox"
                        checked={selectedReservations.includes(reservation.id)}
                        onChange={() => handleSelectReservation(reservation.id)}
                      />
                    </CheckboxCell>
                  )}
                  <TableCell>
                    <StatusBadge status={reservation.status}>
                      {reservation.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <ReservationTitle>
                      #{reservation.photos.id}
                    </ReservationTitle>
                  </TableCell>
                  <TableCell>
                    {reservation.photos.photo_folders.name}
                  </TableCell>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{reservation.user_name}</div>
                    <ReservationDetails>{reservation.user_email}</ReservationDetails>
                  </TableCell>
                  <TableCell style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(reservation.created_at)}
                  </TableCell>
                  <TableCell style={{ maxWidth: '200px' }}>
                    {reservation.message || '-'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {!batchMode && (
                      <ActionButtons>
                        {reservation.status === '예약중' && (
                          <>
                            <ActionButton 
                              variant="complete"
                              onClick={() => updateReservationStatus(reservation.id, '예약완료')}
                            >
                              ✓ 완료 처리
                            </ActionButton>
                            <ActionButton 
                              variant="cancel"
                              onClick={() => updateReservationStatus(reservation.id, '취소됨')}
                            >
                              ✕ 취소 처리
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
                    {batchMode && (
                      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                        일괄처리 모드
                      </div>
                    )}
                  </TableCell>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        )}
      </TableContainer>

          </ReservationContainer>

          {/* 상세 모달 */}
          {showDetailModal && selectedReservation && (
            <DetailModalOverlay onClick={closeDetailModal}>
              <DetailModal onClick={(e) => e.stopPropagation()}>
                <DetailModalHeader>
                  <DetailModalTitle>예약 상세 정보</DetailModalTitle>
                  <CloseButton onClick={closeDetailModal}>×</CloseButton>
                </DetailModalHeader>

                <DetailSection>
                  <DetailLabel>상태</DetailLabel>
                  <DetailValue>
                    <StatusBadge status={selectedReservation.status}>
                      {selectedReservation.status}
                    </StatusBadge>
                  </DetailValue>
                </DetailSection>

                <DetailSection>
                  <DetailLabel>사진 정보</DetailLabel>
                  <DetailValue>
                    <strong>{selectedReservation.photos.title || '제목 없음'}</strong>
                    <div style={{ marginTop: 8, color: '#6b7280' }}>
                      📁 {selectedReservation.photos.photo_folders.name}
                    </div>
                  </DetailValue>
                  {selectedReservation.photos.image_url && (
                    <DetailImage 
                      src={convertGoogleDriveUrl(selectedReservation.photos.image_url)} 
                      alt={selectedReservation.photos.title} 
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxzdHlsZT4KdGV4dCB7CiAgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1NlZ29lIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmOwogIGZvbnQtc2l6ZTogMTZweDsKICBmaWxsOiAjNmI3MjgwOwp9Cjwvc3R5bGU+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7ss7TsnpDsnYQg7IiYIOyXhuydjzwvdGV4dD4KPC9zdmc+Cg==';
                      }}
                    />
                  )}
                </DetailSection>

                <DetailSection>
                  <DetailLabel>예약자 정보</DetailLabel>
                  <DetailValue>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {selectedReservation.user_name}
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      📧 {selectedReservation.user_email}
                    </div>
                  </DetailValue>
                </DetailSection>

                <DetailSection>
                  <DetailLabel>예약 일시</DetailLabel>
                  <DetailValue>
                    📅 {formatDate(selectedReservation.created_at)}
                  </DetailValue>
                </DetailSection>

                {selectedReservation.message && (
                  <DetailSection>
                    <DetailLabel>메시지</DetailLabel>
                    <DetailValue style={{ 
                      background: '#f9fafb', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedReservation.message}
                    </DetailValue>
                  </DetailSection>
                )}

                <DetailSection>
                  <DetailLabel>예약 ID</DetailLabel>
                  <DetailValue style={{ fontFamily: 'monospace', color: '#6b7280' }}>
                    #{selectedReservation.id}
                  </DetailValue>
                </DetailSection>

                <DetailSection style={{ marginBottom: 0, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  <ActionButtons>
                    {selectedReservation.status === '예약중' && (
                      <>
                        <ActionButton 
                          variant="complete"
                          onClick={() => {
                            updateReservationStatus(selectedReservation.id, '예약완료');
                            closeDetailModal();
                          }}
                        >
                          ✓ 완료 처리
                        </ActionButton>
                        <ActionButton 
                          variant="cancel"
                          onClick={() => {
                            updateReservationStatus(selectedReservation.id, '취소됨');
                            closeDetailModal();
                          }}
                        >
                          ✕ 취소 처리
                        </ActionButton>
                      </>
                    )}
                    {selectedReservation.status === '예약완료' && (
                      <ActionButton 
                        variant="complete"
                        onClick={() => {
                          updateReservationStatus(selectedReservation.id, '수령완료');
                          closeDetailModal();
                        }}
                      >
                        ✓ 수령완료
                      </ActionButton>
                    )}
                  </ActionButtons>
                </DetailSection>
              </DetailModal>
            </DetailModalOverlay>
          )}
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>

    {/* 스캔된 사진 목록 모달 */}
    {showScannedList && (
      <ScannedListModal onClick={() => setShowScannedList(false)}>
        <ScannedListContent onClick={(e) => e.stopPropagation()}>
          <ScannedListHeader>
            <ScannedListTitle>
              사진예약 목록 ({scannedReservations.length}개)
            </ScannedListTitle>
            <CloseButton onClick={() => setShowScannedList(false)}>×</CloseButton>
          </ScannedListHeader>
          
          {scannedReservations.map((reservation) => (
            <ScannedPhotoItem key={reservation.id}>
              <ScannedPhotoImage 
                src={convertGoogleDriveUrl(reservation.photos.image_url)}
                alt={reservation.photos.title}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMzMi4yNjggMjAgMjYgMjYuMjY4IDI2IDM0QzI2IDQxLjczMiAzMi4yNjggNDggNDAgNDhDNDcuNzMyIDQ4IDU0IDQxLjczMiA1NCAzNEM1NCAyNi4yNjggNDcuNzMyIDIwIDQwIDIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDAgNTJDMjYuNzQ1IDUyIDE2IDQxLjI1NSAxNiAyOEgyMEMyMCAzOC40OTcgMjkuNTAzIDQ4IDQwIDQ4QzUwLjQ5NyA0OCA2MCAzOC40OTcgNjAgMjhINjRDNjQgNDEuMjU1IDUzLjI1NSA1MiA0MCA1MloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                }}
              />
              <ScannedPhotoInfo>
                <ScannedPhotoTitle>
                  {reservation.photos.title || '제목 없음'}
                </ScannedPhotoTitle>
                <ScannedPhotoDetails>
                  예약자: {reservation.user_name}
                </ScannedPhotoDetails>
                <ScannedPhotoDetails>
                  폴더: {reservation.photos.photo_folders.name}
                </ScannedPhotoDetails>
                <ScannedPhotoDetails>
                  예약일: {formatDate(reservation.created_at)}
                </ScannedPhotoDetails>
              </ScannedPhotoInfo>
            </ScannedPhotoItem>
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
