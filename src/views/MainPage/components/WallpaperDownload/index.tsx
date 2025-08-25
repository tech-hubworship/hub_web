import { useState, useRef, useEffect } from 'react';
import * as S from './style';
import axios from 'axios';

// 배경화면 이미지 목록
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

export default function WallpaperDownload() {
  const [selectedWallpaper, setSelectedWallpaper] = useState<number | null>(null);
  const [showVerse, setShowVerse] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [remainingDownloads, setRemainingDownloads] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // 남은 다운로드 횟수 조회
  useEffect(() => {
    const fetchRemainingDownloads = async () => {
      try {
        const response = await axios.get('/api/downloads/count');
        setRemainingDownloads(response.data.remainingCount);
      } catch (error) {
        console.error('다운로드 횟수 조회 오류:', error);
        setDownloadError('다운로드 횟수를 조회할 수 없습니다.');
      }
    };

    fetchRemainingDownloads();
  }, []);

  const handleDownload = async () => {
    if (selectedWallpaper === null || isDownloading || remainingDownloads === 0) return;
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      // 다운로드 카운트 감소 API 호출
      const response = await axios.post('/api/downloads/count');
      setRemainingDownloads(response.data.remainingCount);
      
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
      
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setRemainingDownloads(0);
        setDownloadError('현재 다운로드를 처리할 수 없습니다. 나중에 다시 시도해주세요.');
      } else {
        setDownloadError('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 일괄 다운로드 함수
  const handleBulkDownload = async () => {
    if (isDownloading || isBulkDownloading || remainingDownloads === 0) return;
    setIsBulkDownloading(true);
    setDownloadError(null);
    try {
      // 다운로드 제한이 있다면 남은 횟수만큼만 다운로드
      let downloadCount = wallpapers.length;
      if (typeof remainingDownloads === 'number') {
        downloadCount = Math.min(downloadCount, remainingDownloads);
      }
      // 다운로드 카운트 감소 API 호출 (일괄로)
      const response = await axios.post('/api/downloads/count', { count: downloadCount });
      setRemainingDownloads(response.data.remainingCount);
      // 실제 이미지 다운로드
      for (let i = 0; i < downloadCount; i++) {
        const wallpaper = wallpapers[i];
        await new Promise<void>((resolve, reject) => {
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
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setRemainingDownloads(0);
        setDownloadError('현재 다운로드를 처리할 수 없습니다. 나중에 다시 시도해주세요.');
      } else {
        setDownloadError('일괄 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

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
          
          {/* {selectedWallpaper !== null && showVerse && (
            <S.VerseContainer>
              <S.Verse>
                {wallpapers.find(w => w.id === selectedWallpaper)?.verse}
              </S.Verse>
            </S.VerseContainer>
          )} */}
          
          <S.DownloadSection>
            <S.DownloadButton 
              onClick={handleDownload}
              disabled={selectedWallpaper === null || isDownloading || remainingDownloads === 0 || isBulkDownloading}
            >
              <S.ButtonText $isDisabled={selectedWallpaper === null || isDownloading || remainingDownloads === 0 || isBulkDownloading}>
                {isDownloading ? '다운로드 중...' : '배경화면 다운로드'}
              </S.ButtonText>
            </S.DownloadButton>
            {/* 일괄 다운로드 버튼 추가 */}
            {/* <S.DownloadButton 
              onClick={handleBulkDownload}
              disabled={isDownloading || isBulkDownloading || remainingDownloads === 0}
            >
              <S.ButtonText $isDisabled={isDownloading || isBulkDownloading || remainingDownloads === 0}>
                {isBulkDownloading ? '일괄 다운로드 중...' : '일괄 다운로드'}
              </S.ButtonText>
            </S.DownloadButton> */}
            
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