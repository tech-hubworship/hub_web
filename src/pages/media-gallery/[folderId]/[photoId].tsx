import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';

// iOS 26 스타일 디자인
const DetailContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  color: white;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const PhotoInfo = styled.div`
  flex: 1;
  text-align: center;
`;

const PhotoTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const PhotoSubtitle = styled.p`
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: #667eea;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: white;
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0) scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ReservationButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${props => props.disabled 
    ? 'rgba(34, 197, 94, 0.3)' 
    : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: ${props => props.disabled ? '#22c55e' : '#667eea'};
  font-size: 20px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.8 : 1};

  &:hover {
    background: ${props => props.disabled 
      ? 'rgba(34, 197, 94, 0.4)' 
      : 'white'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px) scale(1.1)'};
    box-shadow: ${props => props.disabled 
      ? 'none' 
      : '0 8px 32px rgba(0, 0, 0, 0.2)'};
  }

  &:active {
    transform: translateY(0) scale(1.05);
  }
`;

const PhotoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;
`;

const PhotoWrapper = styled.div`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
`;

const PhotoImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  display: block;
  object-fit: contain;
`;

const PhotoDetails = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 600px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: white;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
`;

const DetailValue = styled.span`
  font-size: 14px;
  opacity: 0.8;
`;

const Description = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  margin: 20px auto;
  max-width: 400px;
`;

interface Photo {
  id: number;
  title?: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
  file_format?: string;
  created_at: string;
}

interface Folder {
  id: number;
  name: string;
}

export default function PhotoDetail() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { folderId, photoId } = router.query;
  
  const [folder, setFolder] = useState<Folder | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [reservedBy, setReservedBy] = useState<string | null>(null);

  useEffect(() => {
    if (folderId && photoId) {
      loadData();
    }
  }, [folderId, photoId]);

  useEffect(() => {
    // 세션이 로딩 완료되고 사진이 로드된 후 예약 현황 확인
    if (status !== 'loading' && photo && folderId && photoId) {
      checkReservationStatus(Number(photoId));
    }
  }, [status, session, photo, folderId, photoId]);

  // NextAuth 세션에서 사용자 정보 가져오기
  const getUserInfo = () => {
    if (session && session.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      };
    }
    return null;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 폴더 정보와 사진 정보를 병렬로 로드
      const [folderResponse, photosResponse] = await Promise.all([
        fetch(`/api/public/photo-folders/${folderId}`),
        fetch(`/api/public/photos?folder_id=${folderId}`)
      ]);

      const [folderData, photosData] = await Promise.all([
        folderResponse.json(),
        photosResponse.json()
      ]);

      if (folderResponse.ok && photosResponse.ok) {
        setFolder(folderData.folder);
        
        // 특정 사진 찾기
        const targetPhoto = photosData.photos.find((p: Photo) => p.id === Number(photoId));
        if (targetPhoto) {
          setPhoto(targetPhoto);
        } else {
          setError('사진을 찾을 수 없습니다.');
        }
      } else {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!photo) return;

    try {
      setDownloading(true);
      
      const imgUrl = photo.thumbnail_url || photo.image_url;
      
      // 이미지를 fetch로 가져와서 blob으로 다운로드
      const response = await fetch(imgUrl);
      if (!response.ok) {
        throw new Error('이미지를 가져올 수 없습니다.');
      }
      
      const blob = await response.blob();
      
      // Blob URL 생성
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = photo.title ? `${photo.title}.jpg` : `photo_${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Blob URL 정리
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('이미지 다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  // 예약 현황 확인
  const checkReservationStatus = async (photoId: number) => {
    // 세션이 로딩 중이거나 인증되지 않은 경우 스킵
    if (status === 'loading' || !session?.user?.id) return;

    try {
      // 해당 사진의 모든 예약 현황 확인
      const response = await fetch(`/api/public/photo-reservations?photo_id=${photoId}`);
      const data = await response.json();
      
      if (response.ok && data.reservations && data.reservations.length > 0) {
        // 해당 사진의 활성 예약 찾기
        const activeReservation = data.reservations.find((r: any) => 
          r.status === '예약중' || r.status === '예약완료' || r.status === '수령완료'
        );
        
        if (activeReservation) {
          // 현재 사용자의 예약인지 확인
          const isUserReservation = activeReservation.user_id === session.user.id;
          
          if (isUserReservation) {
            setIsReserved(true);
            setReservationStatus(activeReservation.status);
            setIsAvailable(false);
            setReservedBy(null);
          } else {
            // 다른 사용자가 예약한 경우
            setIsReserved(false);
            setReservationStatus(null);
            setIsAvailable(false);
            setReservedBy(activeReservation.user_name || '다른 사용자');
          }
        } else {
          // 활성 예약이 없는 경우
          const userReservation = data.reservations.find((r: any) => r.user_id === session.user.id);
          
          if (userReservation && userReservation.status === '취소됨') {
            // 취소된 예약이 있는 경우 재예약 가능
            setIsReserved(false);
            setReservationStatus(null);
            setIsAvailable(true);
            setReservedBy(null);
          } else {
            // 예약 가능
            setIsReserved(false);
            setReservationStatus(null);
            setIsAvailable(true);
            setReservedBy(null);
          }
        }
      } else {
        // 예약이 없는 경우
        setIsReserved(false);
        setReservationStatus(null);
        setIsAvailable(true);
        setReservedBy(null);
      }
    } catch (error) {
      console.error('예약 현황 확인 오류:', error);
    }
  };

  // 사진 예약
  const handleReservation = async () => {
    if (!photo) return;

    // 세션이 로딩 중인 경우 대기
    if (status === 'loading') return;

    // 세션이 없거나 인증되지 않은 경우
    if (status === 'unauthenticated' || !session?.user?.id) {
      // 현재 URL을 쿼리 파라미터로 전달하여 로그인 후 돌아올 수 있도록 함
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // 이미 예약된 사진인지 확인
    if (!isAvailable) {
      if (reservedBy) {
        alert(`해당 사진은 이미 ${reservedBy}님에게 예약되어 있습니다.`);
      } else {
        alert('이미 예약된 사진입니다.');
      }
      return;
    }

    try {
      setReserving(true);
      
      const response = await fetch('/api/public/photo-reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo_id: photo.id,
          user_id: session.user.id,
          user_name: session.user.name || session.user.email,
          user_email: session.user.email,
          message: `${photo.title || '사진'} 예약`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsReserved(true);
        setReservationStatus('예약중');
        alert(data.message || '예약완료');
      } else {
        alert(data.error || '예약에 실패했습니다.');
      }
    } catch (error) {
      console.error('예약 오류:', error);
      alert('예약 중 오류가 발생했습니다.');
    } finally {
      setReserving(false);
    }
  };

  const handleBackClick = () => {
    router.push(`/media-gallery/${folderId}`);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '알 수 없음';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DetailContainer>
        <LoadingContainer>
          <Spinner />
          <div>로딩 중...</div>
        </LoadingContainer>
      </DetailContainer>
    );
  }

  if (error || !photo || !folder) {
    return (
      <DetailContainer>
        <Header>
          <BackButton onClick={handleBackClick}>
            ← 뒤로가기
          </BackButton>
          <PhotoInfo>
            <PhotoTitle>오류</PhotoTitle>
            <PhotoSubtitle>사진 상세</PhotoSubtitle>
          </PhotoInfo>
          <div style={{ width: '120px' }} />
        </Header>
        <ErrorMessage>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️</div>
          <div>{error || '사진을 찾을 수 없습니다.'}</div>
        </ErrorMessage>
      </DetailContainer>
    );
  }

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={handleBackClick}>
          ← 뒤로가기
        </BackButton>
        <PhotoInfo>
          <PhotoTitle>{photo.title || '제목 없음'}</PhotoTitle>
          <PhotoSubtitle>{folder.name}</PhotoSubtitle>
        </PhotoInfo>
        <div style={{ display: 'flex', gap: '12px' }}>
          <DownloadButton onClick={handleDownload} disabled={downloading}>
            {downloading ? '⏳' : '📥'}
          </DownloadButton>
          
          {!isAvailable && reservedBy ? (
            <ReservationButton 
              disabled={true}
              style={{ 
                background: '#6b7280', 
                cursor: 'not-allowed',
                opacity: 0.6
              }}
            >
              🚫
            </ReservationButton>
          ) : (
            <ReservationButton 
              onClick={handleReservation} 
              disabled={isReserved || reserving || !isAvailable}
            >
              {reserving ? '⏳' : 
               isReserved ? '✅' : '📌'}
            </ReservationButton>
          )}
        </div>
      </Header>

      <PhotoContainer>
        <PhotoWrapper>
          <PhotoImage
            src={photo.thumbnail_url || photo.image_url}
            alt={photo.title || '사진'}
            onError={(e) => {
              // 이미지 로드 실패 시 플레이스홀더
              const img = e.target as HTMLImageElement;
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz4KPHN0eWxlPgp0ZXh0IHsKICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2VnIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmOwogIGZvbnQtc2l6ZTogMTZweDsKICBmaWxsOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOCk7Cn0KPC9zdHlsZT4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuy9nOyKpCDsnojsi7U8L3RleHQ+Cjwvc3ZnPgo=';
            }}
          />
        </PhotoWrapper>

        <PhotoDetails>
          <DetailRow>
            <DetailLabel>폴더</DetailLabel>
            <DetailValue>{folder.name}</DetailValue>
          </DetailRow>
          
          {photo.width && photo.height && (
            <DetailRow>
              <DetailLabel>크기</DetailLabel>
              <DetailValue>{photo.width} × {photo.height}</DetailValue>
            </DetailRow>
          )}
          
          {photo.file_size && (
            <DetailRow>
              <DetailLabel>파일 크기</DetailLabel>
              <DetailValue>{formatFileSize(photo.file_size)}</DetailValue>
            </DetailRow>
          )}
          
          {photo.file_format && (
            <DetailRow>
              <DetailLabel>파일 형식</DetailLabel>
              <DetailValue>{photo.file_format.toUpperCase()}</DetailValue>
            </DetailRow>
          )}
          
          <DetailRow>
            <DetailLabel>예약 상태</DetailLabel>
            <DetailValue>
              {!isAvailable && reservedBy ? 
                `🚫 ${reservedBy}님이 예약함` :
                isReserved ? 
                  `✅ ${reservationStatus === '예약중' ? '예약됨' : 
                         reservationStatus === '예약완료' ? '예약완료' :
                         reservationStatus === '수령완료' ? '수령완료' : '예약됨'}` :
                '📌 예약 가능'}
            </DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>업로드 날짜</DetailLabel>
            <DetailValue>{formatDate(photo.created_at)}</DetailValue>
          </DetailRow>

        </PhotoDetails>
      </PhotoContainer>
    </DetailContainer>
  );
}
