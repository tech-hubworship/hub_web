import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';
import QRCode from 'qrcode';
import { Folder, Calendar, Download, X, QrCode, ChevronRight } from 'lucide-react';

// iOS 26 스타일 디자인
const GalleryContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  color: white;
  padding-top: 60px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
`;

const FolderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const FolderApp = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 24px;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 140px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.5),
      transparent
    );
  }

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
`;

const FolderIconWrapper = styled.div`
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  border-radius: 18px;
  margin-bottom: 12px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
`;

const FolderName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 6px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.2px;
`;

const PhotoCount = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

const ReservationButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 15px;
  font-weight: 600;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
    transition: all 0.15s ease;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;

  @media (min-width: 1024px) {
    padding: 10px 18px;
    font-size: 13px;
    min-width: 100px;
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
    width: 100%;
    max-width: 200px;
  }

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ReservationModal = styled.div`
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


const ReservationContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  max-width: 800px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  @media (min-width: 1024px) {
    max-width: 1000px;
    width: 95%;
    padding: 40px;
  }
  
  @media (max-width: 768px) {
    max-width: 95%;
    width: 95%;
    padding: 24px;
    max-height: 90vh;
  }
`;

const ReservationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ReservationTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
  }
`;

const ReservationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  @media (min-width: 1024px) {
    gap: 20px;
  }
`;

const ReservationItem = styled.div`
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.2s ease-in-out;
  min-width: 0;
  width: 100%;

  @media (min-width: 1024px) {
    padding: 20px;
    gap: 20px;
    min-width: 400px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 16px;
    min-width: 0;
  }

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
`;

const ReservationThumbnail = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  @media (min-width: 1024px) {
    width: 100px;
    height: 100px;
  }

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }
`;

const ReservationInfo = styled.div`
  flex: 1;
  min-width: 0; /* 텍스트 오버플로우 방지 */

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ReservationPhotoTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  word-break: break-word;

  @media (min-width: 1024px) {
    font-size: 18px;
    margin-bottom: 6px;
  }

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 8px;
  }
`;

const ReservationDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
  word-break: break-word;

  @media (min-width: 1024px) {
    font-size: 15px;
    margin-bottom: 3px;
  }

  @media (max-width: 768px) {
    font-size: 15px;
    margin-bottom: 4px;
  }
`;

const ReservationStatus = styled.div<{ status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  background: ${props => 
    props.status === '예약중' ? 'rgba(59, 130, 246, 0.1)' :
    props.status === '예약완료' ? 'rgba(34, 197, 94, 0.1)' :
    'rgba(239, 68, 68, 0.1)'
  };
  color: ${props => 
    props.status === '예약중' ? '#2563eb' :
    props.status === '예약완료' ? '#16a34a' :
    '#dc2626'
  };
`;

const CancelButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;

  @media (min-width: 1024px) {
    padding: 10px 18px;
    font-size: 13px;
    min-width: 80px;
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
    width: 100%;
    max-width: 200px;
  }

  &:hover {
    background: #dc2626;
  }
`;

const ExchangeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;

  @media (min-width: 1024px) {
    padding: 10px 18px;
    font-size: 13px;
    min-width: 90px;
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
    width: 100%;
    max-width: 200px;
  }

  &:hover {
    background: #059669;
  }
`;

const EmptyReservations = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 16px;
`;

const QRModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const QRContent = styled.div`
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const QRTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
`;

const QRCodeContainer = styled.div`
  margin: 24px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
`;

const QRInfo = styled.p`
  margin: 16px 0 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const BatchExchangeContainer = styled.div`
  margin-bottom: 20px;
  text-align: center;
  padding: 20px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  max-width: 500px;
  margin: 0 auto 20px auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const BatchExchangeTitle = styled.div`
  font-size: 16px;
  color: #059669;
  margin-bottom: 12px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 10px;
  }
`;

const BatchExchangeButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  font-size: 16px;
  padding: 14px 28px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
  width: 100%;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  margin: 0 auto;

  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 12px 24px;
    max-width: 250px;
  }
`;

interface Folder {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  photo_count: number;
  subfolder_count?: number;
}

export default function MediaGallery() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReservations, setShowReservations] = useState(false);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRData, setCurrentQRData] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      console.log('폴더 로딩 시작...');
      setLoading(true);
      setError(null);
      
      // 루트 폴더만 로드
      const response = await fetch('/api/public/photo-folders?parent_id=null');
      const data = await response.json();
      
      console.log('폴더 응답:', data);
      
      if (response.ok) {
        const folderData = data.folders || [];
        console.log('폴더 데이터 설정:', folderData.length, '개');
        setFolders(folderData);
        // 폴더 데이터 설정 후 로딩 완료
        setLoading(false);
        console.log('폴더 로딩 완료');
      } else {
        console.error('폴더 로드 실패:', data.error);
        setError(data.error || '폴더를 불러오는 데 실패했습니다.');
        setLoading(false);
      }
    } catch (error) {
      console.error('폴더 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: Folder) => {
    router.push(`/media-gallery/${folder.id}`);
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

  // 예약 현황 로드
  const loadUserReservations = async () => {
    // 세션이 로딩 중인 경우 대기
    if (status === 'loading') return;

    // 세션이 없거나 인증되지 않은 경우
    if (status === 'unauthenticated' || !session?.user?.id) {
      // 현재 URL을 쿼리 파라미터로 전달하여 로그인 후 돌아올 수 있도록 함
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    try {
      setLoadingReservations(true);
      console.log('사용자 ID:', session.user.id);
      const response = await fetch(`/api/public/photo-reservations?user_id=${session.user.id}`);
      const data = await response.json();

      if (response.ok) {
        // 취소된 예약은 제외하고 표시
        const activeReservations = (data.reservations || []).filter(
          (reservation: any) => reservation.status !== '취소됨'
        );
        setUserReservations(activeReservations);
        setShowReservations(true);
      } else {
        console.error('예약 현황 로드 오류:', data.error);
        alert('예약 현황을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('예약 현황 로드 오류:', error);
      alert('예약 현황을 불러오는 데 실패했습니다.');
    } finally {
      setLoadingReservations(false);
    }
  };

  // 교환권 QR 코드 표시
  const showExchangeQR = async (reservationId: number) => {
    try {
      // QR 코드 데이터 생성
      const qrData = {
        reservationId: reservationId,
        timestamp: Date.now(),
        type: 'exchange_ticket'
      };
      
      const qrString = JSON.stringify(qrData);
      
      // QR 코드 생성
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setCurrentQRData(qrCodeDataURL);
      setShowQRModal(true);
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      alert('QR 코드 생성 중 오류가 발생했습니다.');
    }
  };

  // 일괄 교환권 QR 코드 표시
  const showBatchExchangeQR = async () => {
    try {
      // 예약완료 상태인 예약들만 필터링
      const completedReservations = userReservations.filter(r => r.status === '예약완료');
      
      if (completedReservations.length === 0) {
        alert('교환 가능한 예약이 없습니다.');
        return;
      }

      // 일괄 처리 QR 코드 데이터 생성
      const qrData = {
        type: 'batch_exchange',
        reservationIds: completedReservations.map(r => r.id),
        status: '수령완료',
        userId: session?.user?.id,
        timestamp: Date.now(),
        count: completedReservations.length
      };
      
      const qrString = JSON.stringify(qrData);
      
      // QR 코드 생성
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setCurrentQRData(qrCodeDataURL);
      setShowQRModal(true);
    } catch (error) {
      console.error('일괄 QR 코드 생성 오류:', error);
      alert('일괄 QR 코드 생성 중 오류가 발생했습니다.');
    }
  };

  // 예약 취소
  const cancelReservation = async (reservationId: number) => {
    // 세션이 로딩 중인 경우 대기
    if (status === 'loading') return;

    // 세션이 없거나 인증되지 않은 경우
    if (status === 'unauthenticated' || !session?.user?.id) {
      // 현재 URL을 쿼리 파라미터로 전달하여 로그인 후 돌아올 수 있도록 함
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/public/photo-reservations?id=${reservationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || '예약이 취소되었습니다.');
        loadUserReservations(); // 목록 새로고침
      } else {
        alert(data.error || '예약 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('예약 취소 오류:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = async (reservation: any) => {
    if (!reservation?.photos) {
      console.error('예약된 사진 정보가 없습니다.');
      return;
    }

    try {
      setDownloading(true);

      const photo = reservation.photos;
      const imgUrl = convertGoogleDriveUrl(photo.thumbnail_url || photo.image_url);
      
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
      alert('이미지 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDownloading(false);
    }
  };

  // 렌더링 전 상태 확인
  console.log('렌더링 상태:', { loading, folders: folders?.length, error });

  // 로딩 중이거나 폴더 데이터가 아직 없으면 로딩 화면 표시
  if (loading || folders === null) {
    return (
      <GalleryContainer>
        <Header>
          <Title>미디어선교</Title>
          <Subtitle>갤러리</Subtitle>
        </Header>
        <LoadingContainer>
          <Spinner />
          <div>로딩 중...</div>
        </LoadingContainer>
      </GalleryContainer>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <GalleryContainer>
        <Header>
          <Title>미디어선교</Title>
          <Subtitle>갤러리</Subtitle>
        </Header>
        <ErrorMessage>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️</div>
          <div>{error}</div>
        </ErrorMessage>
      </GalleryContainer>
    );
  }

  return (
    <GalleryContainer>
      {/* 로그인 상태일 때만 버튼이 보임*/}
      {status === 'authenticated' && (
        <ReservationButton onClick={loadUserReservations} disabled={loadingReservations}>
          {loadingReservations ? (
            <>
              <Spinner style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              <span>로딩중...</span>
            </>
          ) : (
            <>
              <Calendar size={18} strokeWidth={2.5} />
              <span>내 예약 현황</span>
            </>
          )}
        </ReservationButton>
      )}

      <Header>
        <Title>미디어선교</Title>
        <Subtitle>갤러리</Subtitle>
      </Header>

      <FolderGrid>
        {folders.map((folder) => (
          <FolderApp
            key={folder.id}
            onClick={() => handleFolderClick(folder)}
          >
            <FolderIconWrapper>
              <Folder 
                size={32} 
                color="white" 
                strokeWidth={2}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
              />
            </FolderIconWrapper>
            <FolderName>{folder.name}</FolderName>
          </FolderApp>
        ))}
      </FolderGrid>

      {showReservations && (
        <ReservationModal onClick={() => setShowReservations(false)}>
          <ReservationContent onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <ReservationHeader>
              <ReservationTitle>내 예약 현황</ReservationTitle>
              <CloseButton onClick={() => setShowReservations(false)}>
                <X size={20} strokeWidth={2.5} />
              </CloseButton>
            </ReservationHeader>
            
            {/* 일괄 교환권 버튼 */}
            {userReservations.filter(r => r.status === '예약완료').length > 0 && (
              <BatchExchangeContainer>
                <BatchExchangeTitle>
                  교환 가능한 사진: {userReservations.filter(r => r.status === '예약완료').length}개
                </BatchExchangeTitle>
                <BatchExchangeButton onClick={showBatchExchangeQR}>
                  <QrCode size={20} strokeWidth={2.5} />
                  일괄 교환권
                </BatchExchangeButton>
              </BatchExchangeContainer>
            )}
            
            {userReservations.length === 0 ? (
              <EmptyReservations>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div>예약한 사진이 없습니다.</div>
              </EmptyReservations>
            ) : (
              <ReservationList>
                {userReservations.map((reservation) => (
                  <ReservationItem key={reservation.id}>
                    <ReservationThumbnail 
                      src={convertGoogleDriveUrl(reservation.photos?.image_url || '') || '/placeholder-image.png'} 
                      alt={reservation.photos?.title || '사진'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder-image.png';
                      }}
                      />
                    {/* 예약 정보 */}
                    <ReservationInfo>
                      <ReservationStatus status={reservation.status}>
                        {reservation.status}
                      </ReservationStatus>
                      <ReservationPhotoTitle>
                        {reservation.photos?.title || '제목 없음'}
                      </ReservationPhotoTitle>
                      <ReservationDetails>
                        📁 {reservation.photos?.photo_folders?.name || '알 수 없음'}
                      </ReservationDetails>
                      <ReservationDetails>
                        📅 {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                      </ReservationDetails>
                    </ReservationInfo>
                    {reservation.status === '예약중' && (
                      <CancelButton onClick={() => cancelReservation(reservation.id)}>
                        취소
                      </CancelButton>
                    )}
                    {reservation.status === '예약완료' && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        minWidth: '200px',
                        flex: '0 0 auto'
                      }}>
                        <DownloadButton 
                          onClick={() => handleDownload(reservation)} 
                          disabled={downloading}
                        >
                          <Download size={14} strokeWidth={2.5} />
                          {downloading ? '다운로드 중...' : '다운로드'}
                        </DownloadButton>
                        <ExchangeButton onClick={() => showExchangeQR(reservation.id)}>
                          <QrCode size={14} strokeWidth={2.5} />
                          교환권
                        </ExchangeButton>
                      </div>
                    )}
                  </ReservationItem>
                ))}
              </ReservationList>
            )}
          </ReservationContent>
        </ReservationModal>
      )}

      {/* QR 코드 모달 */}
      {showQRModal && (
        <QRModal onClick={() => setShowQRModal(false)}>
          <QRContent onClick={(e) => e.stopPropagation()}>
            <QRTitle>교환권</QRTitle>
            <QRCodeContainer>
              {currentQRData && (
                <img src={currentQRData} alt="교환권 QR 코드" style={{ maxWidth: '100%', height: 'auto' }} />
              )}
            </QRCodeContainer>
            <QRInfo>
              {currentQRData && currentQRData.includes('batch_exchange') ? (
                <>
                  이 QR 코드로 모든 교환 가능한 사진을 한 번에 수령하실 수 있습니다.
                  <br />
                  관리자에게 이 QR 코드를 보여주시면 모든 사진이 일괄 처리됩니다.
                  <br />
                  <strong>QR 코드는 한 번만 사용 가능합니다.</strong>
                </>
              ) : (
                <>
                  이 QR 코드를 관리자에게 보여주시면 사진을 수령하실 수 있습니다.
                  <br />
                  QR 코드는 한 번만 사용 가능합니다.
                </>
              )}
            </QRInfo>
            <CloseButton onClick={() => setShowQRModal(false)}>
              닫기
            </CloseButton>
          </QRContent>
        </QRModal>
      )}
    </GalleryContainer>
  );
}
