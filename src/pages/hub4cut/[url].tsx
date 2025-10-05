/**
 * 이미지 뷰어 페이지
 * 
 * 쿼리 스트링으로 받은 이미지를 보여주고 다운로드할 수 있는 페이지입니다.
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import PageLayout from "@src/components/common/PageLayout";

const ImageViewerPage = () => {
  const router = useRouter();
  const { url } = router.query;
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    size?: string;
  } | null>(null);

  // HTTP URL을 HTTPS로 변환하는 함수
  const convertToHttps = (url: string): string => {
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    if (url && typeof url === "string") {
      try {
        // URL 디코딩
        const decodedUrl = decodeURIComponent(url);
        // HTTP를 HTTPS로 변환
        const httpsUrl = convertToHttps(decodedUrl);
        setImageUrl(httpsUrl);
        setImageError(false);
        setLoading(true);
      } catch (error) {
        console.error("URL 디코딩 오류:", error);
        setImageError(true);
        setLoading(false);
      }
    }
  }, [url]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageInfo({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setLoading(false);
  };

  const handleImageError = () => {
    console.log("이미지 로드 실패 - HTTPS 변환 후에도 접근 불가");
    setImageError(true);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      // HTTPS URL 사용 (이미 변환된 상태)
      const response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      // 파일명 생성 (URL에서 추출하거나 기본값 사용)
      const urlParts = imageUrl.split('/');
      let fileName = urlParts[urlParts.length - 1] || 'image';
      
      // 파일 확장자가 없으면 .jpg로 기본 설정
      if (!fileName.includes('.')) {
        fileName += '.jpg';
      }
      
      // 다운로드 링크 생성
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log("다운로드 성공:", fileName);
    } catch (error) {
      console.error("다운로드 오류:", error);
      
      // 더 구체적인 에러 메시지 제공
      let errorMessage = "다운로드 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "이미지에 접근할 수 없습니다. HTTPS 연결을 확인해주세요.";
        } else if (error.message.includes('HTTP error')) {
          errorMessage = "이미지 서버에서 오류가 발생했습니다.";
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const copyImageUrl = () => {
    navigator.clipboard.writeText(imageUrl).then(() => {
      alert("이미지 URL이 클립보드에 복사되었습니다.");
    }).catch(() => {
      alert("URL 복사에 실패했습니다.");
    });
  };

  return (
    <PageLayout>
      <Container>
        <Header>
          <BackButton onClick={handleGoBack}>
            ← 뒤로가기
          </BackButton>
          <Title>이미지 뷰어</Title>
        </Header>

        {loading && (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>이미지를 불러오는 중...</LoadingText>
          </LoadingContainer>
        )}

        {imageError && (
          <ErrorContainer>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorTitle>이미지를 불러올 수 없습니다</ErrorTitle>
            <ErrorText>
              이미지 URL이 올바르지 않거나 HTTPS 연결에 문제가 있습니다.<br/>
              원본 이미지 서버가 HTTPS를 지원하지 않을 수 있습니다.
            </ErrorText>
            <ErrorActions>
              <Button onClick={handleGoBack}>뒤로가기</Button>
            </ErrorActions>
          </ErrorContainer>
        )}

        {imageUrl && !imageError && !loading && (
          <>
            <ImageContainer>
              <Image
                src={imageUrl}
                alt="이미지"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </ImageContainer>

            <ImageInfo>
              <InfoItem>
                <InfoLabel>이미지 크기:</InfoLabel>
                <InfoValue>
                  {imageInfo?.width} × {imageInfo?.height}px
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>이미지 URL:</InfoLabel>
                <InfoValue>
                  <UrlText>{imageUrl}</UrlText>
                  <CopyButton onClick={copyImageUrl}>복사</CopyButton>
                </InfoValue>
              </InfoItem>
            </ImageInfo>

            <ActionButtons>
              <DownloadButton onClick={handleDownload}>
                📥 이미지 다운로드
              </DownloadButton>
              <BackButton onClick={handleGoBack}>
                ← 뒤로가기
              </BackButton>
            </ActionButtons>
          </>
        )}
      </Container>
    </PageLayout>
  );
};

export default ImageViewerPage;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e9e9e9;
    border-color: #bbb;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
`;

const ErrorTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ErrorText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #eee;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ImageInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #333;
  min-width: 100px;
  margin-right: 12px;
`;

const InfoValue = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const UrlText = styled.span`
  font-family: monospace;
  font-size: 12px;
  color: #666;
  word-break: break-all;
  flex: 1;
`;

const CopyButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #0056b3;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const DownloadButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #218838;
  }
`;

const Button = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5a6268;
  }
`;
