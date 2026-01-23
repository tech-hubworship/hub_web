"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "@emotion/styled";
import { ArrowLeft, Download, Calendar } from "lucide-react";

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
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(1.05);
    transition: all 0.15s ease;
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

const ReservationButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  &.available {
    background: #ffffff;
    color: #667eea;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
  }

  &.reserved {
    background: #ef4444;
    color: white;
    &:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
    }
  }

  &.unavailable {
    background: rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.6);
    cursor: not-allowed;
  }

  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
`;

const PhotoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
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

const ActionPanel = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 600px;
  color: white;
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

export default function PhotoDetailClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams() as { folderId?: string; photoId?: string };
  const folderId = params.folderId;
  const photoId = params.photoId;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (folderId && photoId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, photoId]);

  useEffect(() => {
    if (status !== "loading" && photo && photoId) {
      checkReservationStatus(Number(photoId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, photo, photoId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [folderResponse, photosResponse] = await Promise.all([
        fetch(`/api/public/photo-folders/${folderId}`),
        fetch(`/api/public/photos?folder_id=${folderId}`),
      ]);

      const [folderData, photosData] = await Promise.all([folderResponse.json(), photosResponse.json()]);

      if (folderResponse.ok && photosResponse.ok) {
        setFolder(folderData.folder);
        const targetPhoto = photosData.photos.find((p: Photo) => p.id === Number(photoId));
        if (targetPhoto) setPhoto(targetPhoto);
        else setError("사진을 찾을 수 없습니다.");
      } else {
        setError("데이터를 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const checkReservationStatus = async (pid: number) => {
    if (status === "loading" || !session?.user?.id) return;

    try {
      const response = await fetch(`/api/public/photo-reservations?photo_id=${pid}`);
      const data = await response.json();

      if (response.ok && data.reservations && data.reservations.length > 0) {
        const activeReservation = data.reservations.find((r: any) =>
          ["예약중", "예약완료", "수령완료"].includes(r.status)
        );

        if (activeReservation) {
          const isUserReservation = activeReservation.user_id === session?.user?.id;

          if (isUserReservation) {
            setIsReserved(true);
            setReservationStatus(activeReservation.status);
            setIsAvailable(false);
          } else {
            setIsReserved(false);
            setReservationStatus(null);
            setIsAvailable(false);
          }
        } else {
          const userReservation = data.reservations.find((r: any) => r.user_id === session?.user?.id);

          if (userReservation && userReservation.status === "취소됨") {
            setIsReserved(false);
            setReservationStatus(null);
            setIsAvailable(true);
          } else {
            setIsReserved(false);
            setReservationStatus(null);
            setIsAvailable(true);
          }
        }
      } else {
        setIsReserved(false);
        setReservationStatus(null);
        setIsAvailable(true);
      }
    } catch (error) {
      console.error("예약 현황 확인 오류:", error);
    }
  };

  const convertGoogleDriveUrl = (url: string) => {
    if (!url) return url;
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
  };

  const handleDownload = async () => {
    if (!photo) return;
    try {
      const imgUrl = convertGoogleDriveUrl(photo.image_url);
      const response = await fetch(imgUrl);
      if (!response.ok) throw new Error("이미지를 가져올 수 없습니다.");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = photo.title ? `${photo.title}.jpg` : `photo_${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("다운로드 오류:", error);
      alert("이미지 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleReservation = async () => {
    if (!photo) return;
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user?.id) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    if (isReserved) {
      try {
        if (!confirm("예약을 취소하시겠습니까?")) return;
        setReserving(true);

        const reservationResponse = await fetch(
          `/api/public/photo-reservations?photo_id=${photo.id}&user_id=${session.user?.id}`
        );
        const reservationData = await reservationResponse.json();

        if (reservationResponse.ok && reservationData.reservations && reservationData.reservations.length > 0) {
          const userReservation = reservationData.reservations.find((r: any) => r.user_id === session.user?.id);
          if (userReservation) {
            const response = await fetch(`/api/public/photo-reservations?id=${userReservation.id}`, {
              method: "DELETE",
            });
            const data = await response.json();
            if (response.ok) {
              alert(data.message || "예약이 취소되었습니다.");
              setIsReserved(false);
              setReservationStatus(null);
              setIsAvailable(true);
            } else {
              alert(data.error || "예약 취소에 실패했습니다.");
            }
          }
        }
      } catch (error) {
        console.error("예약 취소 오류:", error);
        alert("예약 취소 중 오류가 발생했습니다.");
      } finally {
        setReserving(false);
      }
      return;
    }

    if (!isAvailable) {
      alert("이미 예약된 사진입니다.");
      return;
    }

    try {
      setReserving(true);
      const response = await fetch("/api/public/photo-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_id: photo.id,
          user_id: session.user?.id,
          user_name: session.user?.name || session.user?.email,
          user_email: session.user?.email,
          message: `${photo.title || "사진"} 예약`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsReserved(true);
        setReservationStatus("예약중");
        setIsAvailable(false);
        alert(data.message || "예약이 완료되었습니다.");
      } else {
        alert(data.error || "예약에 실패했습니다.");
      }
    } catch (error) {
      console.error("예약 오류:", error);
      alert("예약 중 오류가 발생했습니다.");
    } finally {
      setReserving(false);
    }
  };

  const handleBackClick = () => router.back();

  const getReservationButtonClass = () => {
    if (isReserved) return "reserved";
    if (!isAvailable) return "unavailable";
    return "available";
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
            <ArrowLeft size={22} strokeWidth={2.5} />
          </BackButton>
          <PhotoInfo>
            <PhotoTitle>오류</PhotoTitle>
          </PhotoInfo>
          <div style={{ width: "44px" }} />
        </Header>
        <ErrorMessage>⚠️ {error || "사진을 찾을 수 없습니다."}</ErrorMessage>
      </DetailContainer>
    );
  }

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={handleBackClick}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </BackButton>
        <PhotoInfo>
          <PhotoTitle>{folder.name}</PhotoTitle>
        </PhotoInfo>
        <div style={{ width: "44px" }} />
      </Header>

      <PhotoContainer>
        <PhotoWrapper>
          <PhotoImage
            src={convertGoogleDriveUrl(photo.thumbnail_url || photo.image_url)}
            alt={photo.title || "사진"}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz4KPHN0eWxlPgp0ZXh0IHsKICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2VnIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmOwogIGZvbnQtc2l6ZTogMTZweDsKICBmaWxsOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOCk7Cn0KPC9zdHlsZT4KPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuy9nOyKpCDsnojsi7U8L3RleHQ+Cjwvc3ZnPgo=";
            }}
          />
        </PhotoWrapper>

        <ActionPanel>
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <ReservationButton onClick={handleDownload} className="available" style={{ flex: 1 }}>
              <Download size={18} strokeWidth={2.5} />
              다운로드
            </ReservationButton>

            <ReservationButton
              onClick={handleReservation}
              disabled={reserving || (!isAvailable && !isReserved)}
              className={getReservationButtonClass()}
              style={{ flex: 1 }}
            >
              <Calendar size={18} strokeWidth={2.5} />
              {isReserved ? "예약취소" : isAvailable ? "예약가능" : "예약마감"}
            </ReservationButton>
          </div>
        </ActionPanel>
      </PhotoContainer>
    </DetailContainer>
  );
}

