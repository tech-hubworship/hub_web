import { VIDEO_EVENT } from "./constants";

export const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  return null;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return "";
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * 이벤트 시작일(BASE_DATE) 기준 N일차 계산 (1일차부터)
 */
export const getDayNumber = (dateStr: string): number | null => {
  if (!dateStr || dateStr.length !== 8) return null;
  const base = VIDEO_EVENT.BASE_DATE;
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  const by = parseInt(base.slice(0, 4), 10);
  const bm = parseInt(base.slice(4, 6), 10) - 1;
  const bd = parseInt(base.slice(6, 8), 10);
  const currentDate = new Date(year, month, day);
  const baseDate = new Date(by, bm, bd);
  const diffTime = currentDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

export const getYouTubeWatchUrl = (url: string | null): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }
  return null;
};
