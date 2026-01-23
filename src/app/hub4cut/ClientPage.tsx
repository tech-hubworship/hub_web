"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import PageLayout from "@src/components/common/PageLayout";

export default function ClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams?.get("url");

  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    size?: string;
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const convertToHttps = (u: string): string => {
    if (u.startsWith("http://")) return u.replace("http://", "https://");
    return u;
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (url && typeof url === "string") {
      try {
        const decodedUrl = decodeURIComponent(url);
        const httpsUrl = convertToHttps(decodedUrl);
        setImageUrl(httpsUrl);
        setImageError(false);
        setLoading(true);

        const testImg = new window.Image();
        testImg.onload = () => {
          setLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };
        testImg.onerror = () => {
          setImageError(true);
          setLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };
        testImg.src = httpsUrl;

        timeoutRef.current = setTimeout(() => {
          setImageError(true);
          setLoading(false);
        }, 10000);
      } catch (error) {
        console.error("URL 디코딩 오류:", error);
        setImageError(true);
        setLoading(false);
      }
    } else if (!url) {
      setImageError(true);
      setLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [url]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageInfo({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setLoading(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      const urlParts = imageUrl.split("/");
      let fileName = urlParts[urlParts.length - 1] || "image";

      if (!fileName.includes(".")) {
        fileName += ".jpg";
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("다운로드 오류:", error);

      let errorMessage = "다운로드 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "이미지에 접근할 수 없습니다. HTTPS 연결을 확인해주세요.";
        } else if (error.message.includes("HTTP error")) {
          errorMessage = "이미지 서버에서 오류가 발생했습니다.";
        }
      }

      alert(errorMessage);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <PageLayout>
      <Container>
        <Header>
          <BackButton onClick={handleGoBack}>← 뒤로가기</BackButton>
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
              이미지 URL이 올바르지 않거나 HTTPS 연결에 문제가 있습니다.
              <br />
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

            {!!imageInfo && (
              <ImageMeta>
                {imageInfo.width} × {imageInfo.height}px
              </ImageMeta>
            )}

            <ActionButtons>
              <DownloadButton onClick={handleDownload}>이미지 다운로드</DownloadButton>
            </ActionButtons>
          </>
        )}
      </Container>
    </PageLayout>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 80vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
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
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
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
  margin-bottom: 10px;
  border-radius: 12px;
  padding: 16px;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 34px 4px rgba(0, 0, 0, 0.1);
`;

const ImageMeta = styled.div`
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
`;

const DownloadButton = styled.button`
  background: #ff474a;
  color: white;
  border: none;
  border-radius: 8px;
  width: 90%;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgb(216, 61, 63);
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

