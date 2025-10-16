import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';

// iOS 26 스타일 디자인
const GalleryContainer = styled.div`
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

const FolderInfo = styled.div`
  flex: 1;
  text-align: center;
`;

const FolderTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const FolderSubtitle = styled.p`
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto;
`;

const PhotoItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  &:hover .photo-overlay {
    opacity: 1;
    transform: translateY(0);
  }

  &:active {
    transform: translateY(-4px) scale(1.02);
  }
`;

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
`;

const PhotoOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  padding: 20px 12px 12px 12px;
  color: white;
  font-size: 12px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease;
`;

const PhotoTitle = styled.div`
  font-weight: 600;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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

const EmptyState = styled.div`
  text-align: center;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  margin: 40px auto;
  max-width: 400px;
`;

interface Photo {
  id: number;
  title?: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  created_at: string;
}

interface Folder {
  id: number;
  name: string;
  description?: string;
}

export default function FolderGallery() {
  const router = useRouter();
  const { folderId } = router.query;
  
  const [folder, setFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folderId) {
      loadFolderData();
      loadSubfolders();
      loadPhotos();
    }
  }, [folderId]);

  const loadFolderData = async () => {
    try {
      const response = await fetch(`/api/public/photo-folders/${folderId}`);
      const data = await response.json();
      
      if (response.ok) {
        setFolder(data.folder);
      } else {
        setError(data.error || '폴더 정보를 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('폴더 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    }
  };

  const loadSubfolders = async () => {
    try {
      const response = await fetch(`/api/public/photo-folders?parent_id=${folderId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubfolders(data.folders || []);
      } else {
        console.error('하위 폴더 로드 오류:', data.error);
        setSubfolders([]);
      }
    } catch (error) {
      console.error('하위 폴더 로드 오류:', error);
      setSubfolders([]);
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await fetch(`/api/public/photos?folder_id=${folderId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPhotos(data.photos || []);
      } else {
        setError(data.error || '사진을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('사진 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    // 사진 상세 페이지로 이동
    router.push(`/media-gallery/${folderId}/${photo.id}`);
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

  const handleBackClick = () => {
    router.push('/media-gallery');
  };

  if (loading) {
    return (
      <GalleryContainer>
        <LoadingContainer>
          <Spinner />
          <div>로딩 중...</div>
        </LoadingContainer>
      </GalleryContainer>
    );
  }

  if (error) {
    return (
      <GalleryContainer>
        <Header>
          <BackButton onClick={handleBackClick}>
            ← 뒤로가기
          </BackButton>
          <FolderInfo>
            <FolderTitle>오류</FolderTitle>
            <FolderSubtitle>갤러리</FolderSubtitle>
          </FolderInfo>
          <div style={{ width: '120px' }} /> {/* 공간 확보 */}
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
      <Header>
        <BackButton onClick={handleBackClick}>
          ← 뒤로가기
        </BackButton>
        <FolderInfo>
          <FolderTitle>{folder?.name || '갤러리'}</FolderTitle>
          <FolderSubtitle>{photos.length}개 사진</FolderSubtitle>
        </FolderInfo>
        <div style={{ width: '120px' }} /> {/* 공간 확보 */}
      </Header>
      
      {/* 폴더 표시 */}
      {subfolders.length > 0 && (
        <div style={{ marginBottom: '32px', maxWidth: '1000px', margin: '0 auto 32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'white', 
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            📁 폴더
          </h3>
          <PhotoGrid style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {subfolders.map((subfolder) => (
              <PhotoItem
                key={subfolder.id}
                onClick={() => router.push(`/media-gallery/${subfolder.id}`)}
                style={{ aspectRatio: '1' }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(251, 191, 36, 0.2)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', textAlign: 'center', padding: '0 8px' }}>
                    {subfolder.name}
                  </div>
                </div>
              </PhotoItem>
            ))}
          </PhotoGrid>
        </div>
      )}

      {/* 사진 표시 */}
      {photos.length === 0 && subfolders.length === 0 ? (
        <EmptyState>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            사진과 폴더가 없습니다
          </div>
          <div style={{ opacity: 0.8 }}>
            이 폴더에는 아직 사진이나 하위 폴더가 없습니다.
          </div>
        </EmptyState>
      ) : photos.length > 0 ? (
        <>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'white', 
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            maxWidth: '1000px',
            margin: '0 auto 16px'
          }}>
            📷 사진
          </h3>
          <PhotoGrid>
          {photos.map((photo) => (
            <PhotoItem
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                const overlay = e.currentTarget.querySelector('.photo-overlay') as HTMLElement;
                if (img) img.style.transform = 'scale(1.1)';
                if (overlay) overlay.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                const overlay = e.currentTarget.querySelector('.photo-overlay') as HTMLElement;
                if (img) img.style.transform = 'scale(1)';
                if (overlay) overlay.style.opacity = '0';
              }}
            >
              <PhotoImage
                src={convertGoogleDriveUrl(photo.thumbnail_url || photo.image_url)}
                alt={photo.title || '사진'}
                onError={(e) => {
                  // 이미지 로드 실패 시 플레이스홀더
                  const img = e.target as HTMLImageElement;
                  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz4KPHN0eWxlPgp0ZXh0IHsKICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2VnIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmOwogIGZvbnQtc2l6ZTogMTJweDsKICBmaWxsOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOCk7Cn0KPC9zdHlsZT4KPHRleHQgeD0iNzUiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7svZzsiqQg7J6I7Iq1PC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
              <PhotoOverlay className="photo-overlay">
                <PhotoTitle>{photo.title || '제목 없음'}</PhotoTitle>
                <div>클릭하여 상세보기</div>
              </PhotoOverlay>
            </PhotoItem>
          ))}
          </PhotoGrid>
        </>
      ) : null}
    </GalleryContainer>
  );
}
