/**
 * WallpaperDownload 컴포넌트
 * 
 * 배경화면 다운로드 기능을 제공합니다.
 * - 배경화면 목록 표시
 * - 개별/일괄 다운로드 기능
 * - 드래그 스크롤 지원
 * - 다운로드 카운트 관리
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useState, useRef, useEffect } from 'react';
import * as S from './style';

/**
 * 배경화면 이미지 목록
 * 각 배경화면의 메타데이터를 포함합니다.
 */
const wallpapers = [
  {
    id: 1,
    title: "1",
    subtitle: "1",
    verse: "1",
    thumbnail: "/images/wallpapers/thumbnail/1.png",
    mobile: "/images/wallpapers/1.png",
  },
  {
    id: 2,
    title: "2",
    subtitle: "2",
    verse: "2",
    thumbnail: "/images/wallpapers/thumbnail/2.png",
    mobile: "/images/wallpapers/2.png",
  },
  {
    id: 3,
    title: "3",
    subtitle: "3",
    verse: "3",
    thumbnail: "/images/wallpapers/thumbnail/3.png",
    mobile: "/images/wallpapers/3.png",
  },
  {
    id: 4,
    title: "4",
    subtitle: "4",
    verse: "4",
    thumbnail: "/images/wallpapers/thumbnail/4.png",
    mobile: "/images/wallpapers/4.png",
  },
];

/**
 * WallpaperDownload 컴포넌트
 * 
 * 배경화면 다운로드 기능을 제공하는 메인 컴포넌트입니다.
 */
export default function WallpaperDownload() {
  // 선택된 배경화면 상태
  const [selectedWallpaper, setSelectedWallpaper] = useState<number | null>(null);
  // 구절 표시 상태
  const [showVerse, setShowVerse] = useState(false);
  // 스크롤 참조
  const scrollRef = useRef<HTMLDivElement>(null);
  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  // 다운로드 상태 관리
  const [isDownloading, setIsDownloading] = useState(false);
  const [remainingDownloads, setRemainingDownloads] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  /**
   * 컴포넌트 마운트 시 남은 다운로드 수 조회
   */
  useEffect(() => {
    const fetchRemainingDownloads = async () => {
      console.log('다운로드 수 조회 시작...');
      try {
        const response = await fetch('/api/downloads/decrement');
        console.log('API 응답 상태:', response.status);
        
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (data.success) {
          console.log('다운로드 수 조회 성공:', data.data.remaining_count);
          setRemainingDownloads(data.data.remaining_count);
        } else {
          console.error('API 응답 실패:', data.message);
          // 에러 시 기본값 설정
          setRemainingDownloads(0);
        }
      } catch (error) {
        console.error('다운로드 수 조회 실패:', error);
        setRemainingDownloads(0);
      }
    };

    fetchRemainingDownloads();
  }, []);

  /**
   * 개별 배경화면 다운로드 처리
   * 다운로드 전에 서버에서 카운트 차감을 확인합니다.
   */
  const handleDownload = async () => {
    if (selectedWallpaper === null || isDownloading || (remainingDownloads !== null && remainingDownloads <= 0)) return;
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      console.log('다운로드 카운트 차감 요청 시작...');
      // 먼저 서버에서 다운로드 카운트 차감 시도
      const decrementResponse = await fetch('/api/downloads/decrement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('차감 API 응답 상태:', decrementResponse.status);
      const decrementData = await decrementResponse.json();
      console.log('차감 API 응답 데이터:', decrementData);
      
      if (!decrementData.success) {
        console.log('다운로드 카운트 차감 실패:', decrementData.message);
        setIsDownloading(false);
        setDownloadError(decrementData.message || '다운로드 한도가 초과되었습니다.');
        setRemainingDownloads(decrementData.remaining_count || 0);
        return;
      }
      
      // 카운트 차감 성공 시 남은 다운로드 수 업데이트
      console.log('다운로드 카운트 차감 성공, 남은 수:', decrementData.data.remaining_count);
      setRemainingDownloads(decrementData.data.remaining_count);
      
      const wallpaper = wallpapers.find(w => w.id === selectedWallpaper);
      if (!wallpaper) {
        setIsDownloading(false);
        return;
      }
      
      // 이미지 다운로드를 위한 객체 생성
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = wallpaper.mobile;
      
      image.onload = () => {
        const link = document.createElement('a');
        link.href = wallpaper.mobile;
        link.download = `DtoV_${wallpaper.title}`;
        link.click();
        
        // 다운로드 작업이 시작된 후 약간의 지연시간을 두고 로딩 상태 해제
        setTimeout(() => {
          setIsDownloading(false);
        }, 1000);
      };
      
      image.onerror = () => {
        // 이미지 로드 오류 시 로딩 상태 해제
        setIsDownloading(false);
        setDownloadError('이미지 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      };
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      setIsDownloading(false);
      setDownloadError('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  /**
   * 일괄 다운로드 함수
   * 각 이미지 다운로드 전에 서버에서 카운트 차감을 확인합니다.
   */
  const handleBulkDownload = async () => {
    if (isDownloading || isBulkDownloading || (remainingDownloads !== null && remainingDownloads < wallpapers.length)) return;
    
    setIsBulkDownloading(true);
    setDownloadError(null);
    
    try {
      // 모든 배경화면 다운로드
      for (let i = 0; i < wallpapers.length; i++) {
        // 각 다운로드 전에 카운트 차감 시도
        const decrementResponse = await fetch('/api/downloads/decrement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const decrementData = await decrementResponse.json();
        
        if (!decrementData.success) {
          setDownloadError(decrementData.message || '다운로드 한도가 초과되었습니다.');
          setRemainingDownloads(decrementData.remaining_count || 0);
          break;
        }
        
        // 카운트 차감 성공 시 남은 다운로드 수 업데이트
        setRemainingDownloads(decrementData.data.remaining_count);
        
        const wallpaper = wallpapers[i];
        await new Promise<void>((resolve) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.src = wallpaper.mobile;
          image.onload = () => {
            const link = document.createElement('a');
            link.href = wallpaper.mobile;
            link.download = `DtoV_${wallpaper.title}`;
            link.click();
            setTimeout(resolve, 500); // 약간의 지연
          };
          image.onerror = () => {
            setDownloadError('이미지 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
            resolve(); // 다음 이미지로 진행
          };
        });
      }
      setIsBulkDownloading(false);
    } catch (error) {
      setIsBulkDownloading(false);
      setDownloadError('일괄 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  /**
   * 드래그 스크롤 이벤트 핸들러들
   * 마우스와 터치 이벤트를 모두 지원합니다.
   */
  
  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  // 마우스 이동
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조정
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조정
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // 마우스/터치 종료
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <S.Container>
      <S.ContentWrapper>
        <S.Content>
          <S.TitleSection>
            <S.EssenceTag>D to V</S.EssenceTag>
            <S.Title>배경화면 다운로드</S.Title>
            {/* <S.Subtitle>복음은, 우리 주 예수 그리스도이십니다. (롬 1:2-4)</S.Subtitle>
            <S.SolasIntro>
              The Five Solas
            </S.SolasIntro> */}

          </S.TitleSection>
          
          <S.WallpaperGrid
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
          >
            {wallpapers.map(wallpaper => (
              <S.WallpaperItem 
                key={wallpaper.id}
                $isSelected={selectedWallpaper === wallpaper.id}
                onClick={() => {
                  if (!isDragging) { // 드래그 중이 아닐 때만 선택 가능
                    setSelectedWallpaper(wallpaper.id);
                    setShowVerse(true);
                  }
                }}
              >
                <S.WallpaperImage src={wallpaper.thumbnail} alt={wallpaper.title} />
                {/* <S.WallpaperTitle>{wallpaper.title}</S.WallpaperTitle>
                <S.WallpaperSubtitle>{wallpaper.subtitle}</S.WallpaperSubtitle> */}
              </S.WallpaperItem>
            ))}
          </S.WallpaperGrid>
          

          
          <S.DownloadSection>

            
            <S.DownloadButton 
              onClick={handleDownload}
              disabled={selectedWallpaper === null || isDownloading || isBulkDownloading || (remainingDownloads !== null && remainingDownloads <= 0)}
            >
              <S.ButtonText $isDisabled={selectedWallpaper === null || isDownloading || isBulkDownloading || (remainingDownloads !== null && remainingDownloads <= 0)}>
                {isDownloading ? '다운로드 중...' : '배경화면 다운로드'}
              </S.ButtonText>
            </S.DownloadButton>
            
            
            {downloadError && (
              <S.ErrorMessage>
                {downloadError}
              </S.ErrorMessage>
            )}
          </S.DownloadSection>
        </S.Content>
      </S.ContentWrapper>
    </S.Container>
  );
} 