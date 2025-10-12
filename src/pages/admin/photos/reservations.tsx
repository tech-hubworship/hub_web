import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import * as S from "@src/views/AdminPage/style";
import styled from '@emotion/styled';
import { BrowserQRCodeReader } from '@zxing/library';

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

const QRScanner = styled.div`
  margin-top: 24px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #d1d5db;
`;

const QRInput = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  margin-bottom: 16px;
  font-family: monospace;
`;

const ScanButton = styled.button`
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ScannerTitle = styled.h4`
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
`;

const ScannerDescription = styled.p`
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
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
`;

const CameraVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CameraControls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const CameraButton = styled.button<{ variant?: 'danger' }>`
  padding: 16px 24px;
  background: ${props => props.variant === 'danger' ? '#ef4444' : '#10b981'};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:hover {
    background: ${props => props.variant === 'danger' ? '#dc2626' : '#059669'};
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
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
`;

const ScanGuide = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  text-align: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
  z-index: 1001;
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
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
`;

const ReservationGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const ReservationCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  align-items: center;
`;

const PhotoThumbnail = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
`;

const ReservationInfo = styled.div`
  flex: 1;
`;

const ReservationTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ReservationDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
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
  flex-direction: column;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: string }>`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => 
    props.variant === 'complete' ? '#10b981' :
    props.variant === 'cancel' ? '#ef4444' :
    '#667eea'
  };
  color: white;

  &:hover {
    background: ${props => 
      props.variant === 'complete' ? '#059669' :
      props.variant === 'cancel' ? '#dc2626' :
      '#5a67d8'
    };
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
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

export default function PhotoReservations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
  const [qrInput, setQrInput] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [qrReader, setQrReader] = useState<BrowserQRCodeReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    loadReservations();
  }, [statusFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = statusFilter === 'all' 
        ? '/api/admin/photo-reservations'
        : `/api/admin/photo-reservations?status=${statusFilter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setReservations(data.reservations || []);
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

  const updateReservationStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/photo-reservations', {
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
        loadReservations(); // 목록 새로고침
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

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // QR 코드 리더 초기화
        const reader = new BrowserQRCodeReader();
        setQrReader(reader);
        
        // QR 코드 스캔 시작
        startQRScanning(reader, videoRef.current);
      }
    } catch (error) {
      console.error('카메라 시작 오류:', error);
      alert('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // QR 코드 스캔 시작
  const startQRScanning = async (reader: BrowserQRCodeReader, video: HTMLVideoElement) => {
    try {
      const videoInputDevices = await reader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        alert('사용 가능한 카메라가 없습니다.');
        return;
      }

      // 후면 카메라 찾기
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );

      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

      // QR 코드 스캔 시작
      reader.decodeFromVideoDevice(selectedDeviceId, video, (result, error) => {
        if (result) {
          const qrText = result.getText();
          console.log('QR 코드 스캔 성공:', qrText);
          
          // QR 코드 스캔 중지
          reader.reset();
          stopCamera();
          
          // QR 코드 처리
          processQRCode(qrText);
        }
        
        if (error && error.name !== 'NotFoundException') {
          console.error('QR 스캔 오류:', error);
        }
      });
    } catch (error) {
      console.error('QR 스캔 시작 오류:', error);
      alert('QR 스캔을 시작할 수 없습니다.');
    }
  };

  // 카메라 종료
  const stopCamera = () => {
    if (qrReader) {
      qrReader.reset();
      setQrReader(null);
    }
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // QR 코드 스캔 및 수령 완료 처리
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

      // 예약 ID 확인
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

      // 수령 완료 처리
      const response = await fetch('/api/admin/photo-reservations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: qrData.reservationId,
          status: '수령완료'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${reservation.photos?.title || '사진'}의 수령이 완료되었습니다.`);
        setQrInput('');
        loadReservations(); // 목록 새로고침
        stopCamera(); // 카메라 종료
      } else {
        alert(data.error || '수령 완료 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('QR 스캔 오류:', error);
      alert('QR 코드 처리 중 오류가 발생했습니다.');
    } finally {
      setScanning(false);
    }
  };

  // 수동 입력으로 QR 코드 처리
  const scanQRCode = async () => {
    if (!qrInput.trim()) {
      alert('QR 코드 데이터를 입력해주세요.');
      return;
    }
    await processQRCode(qrInput.trim());
  };

  // 수동 스캔 버튼 (카메라가 QR 코드를 인식하지 못할 때 사용)
  const scanFromCamera = () => {
    if (!qrReader) {
      alert('QR 스캐너가 초기화되지 않았습니다.');
      return;
    }
    
    // 수동으로 한 번 더 스캔 시도
    if (videoRef.current) {
      qrReader.decodeFromVideoElement(videoRef.current)
        .then(result => {
          const qrText = result.getText();
          console.log('수동 QR 스캔 성공:', qrText);
          stopCamera();
          processQRCode(qrText);
        })
        .catch(error => {
          console.error('수동 QR 스캔 오류:', error);
          alert('QR 코드를 인식할 수 없습니다. 다시 시도해주세요.');
        });
    }
  };

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (qrReader) {
        qrReader.reset();
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream, qrReader]);

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
            {!sidebarCollapsed && <S.NavText>사진 관리</S.NavText>}
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
            <S.PageTitle>사진 예약 관리</S.PageTitle>
            <S.Breadcrumb>관리자 페이지 &gt; 사진 관리 &gt; 예약 관리</S.Breadcrumb>
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

      {/* QR 코드 스캐너 */}
      <QRScanner>
        <ScannerTitle>📱 QR 코드 스캐너</ScannerTitle>
        <ScannerDescription>
          사용자가 보여주는 교환권 QR 코드를 스캔하여 수령 완료 처리를 진행합니다.
          <br />
          카메라를 사용하거나 QR 스캐너 앱으로 스캔한 데이터를 입력하세요.
        </ScannerDescription>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <ScanButton onClick={startCamera} disabled={scanning}>
            📷 카메라로 스캔
          </ScanButton>
        </div>
        <QRInput
          placeholder="QR 코드를 스캔하여 여기에 붙여넣으세요..."
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
        />
        <ScanButton onClick={scanQRCode} disabled={scanning}>
          {scanning ? '처리 중...' : '수령 완료 처리'}
        </ScanButton>
      </QRScanner>

      {/* 카메라 모달 */}
      {showCamera && (
        <CameraContainer>
          <ScanGuide>
            QR 코드를 스캔 영역에 맞춰주세요
          </ScanGuide>
          <CameraVideo
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
          <ScanOverlay />
          <CameraControls>
            <CameraButton onClick={stopCamera} variant="danger">
              취소
            </CameraButton>
            <CameraButton onClick={scanFromCamera} disabled={scanning}>
              {scanning ? '스캔 중...' : '스캔'}
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
      </FilterBar>

      <ReservationGrid>
        {reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            예약이 없습니다.
          </div>
        ) : (
          reservations.map((reservation) => (
            <ReservationCard key={reservation.id}>
              <PhotoThumbnail
                src={reservation.photos.image_url}
                alt={reservation.photos.title}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSJyZ2JhKDI0MywgMjQ0LCAyNDYsIDAuNSkiLz4KPHN0eWxlPgp0ZXh0IHsKICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2VnIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmOwogIGZvbnQtc2l6ZTogMTJweDsKICBmaWxsOiByZ2JhKDEwNywgMTE0LCAxMjgsIDAuOCk7Cn0KPC9zdHlsZT4KPHRleHQgeD0iNDAiIHk9IjQ1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7svZzsiqQg7J6I7Iq1PC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
              <ReservationInfo>
                <StatusBadge status={reservation.status}>
                  {reservation.status}
                </StatusBadge>
                <ReservationTitle>
                  {reservation.photos.title || '제목 없음'}
                </ReservationTitle>
                <ReservationDetails>
                  📁 {reservation.photos.photo_folders.name}
                </ReservationDetails>
                <ReservationDetails>
                  👤 {reservation.user_name || reservation.user_email}
                </ReservationDetails>
                <ReservationDetails>
                  📅 {formatDate(reservation.created_at)}
                </ReservationDetails>
                {reservation.message && (
                  <ReservationDetails>
                    💬 {reservation.message}
                  </ReservationDetails>
                )}
              </ReservationInfo>
              <ActionButtons>
                {reservation.status === '예약중' && (
                  <>
                    <ActionButton 
                      variant="complete"
                      onClick={() => updateReservationStatus(reservation.id, '예약완료')}
                    >
                      완료 처리
                    </ActionButton>
                    <ActionButton 
                      variant="cancel"
                      onClick={() => updateReservationStatus(reservation.id, '취소됨')}
                    >
                      취소 처리
                    </ActionButton>
                  </>
                )}
              </ActionButtons>
            </ReservationCard>
            ))
          )}
      </ReservationGrid>

          </ReservationContainer>
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>
  );
}
