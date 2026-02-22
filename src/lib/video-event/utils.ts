import { VIDEO_EVENT } from "./constants";

export const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#/]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
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
 * 이벤트 시작일(BASE_DATE) 기준 N일차 계산 (1일차부터).
 * 사순절: 일요일은 일수에 넣지 않음 (월~토만 카운트). 일요일이면 null.
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
  // 일요일(0)은 일수에 포함하지 않음
  if (currentDate.getDay() === 0) return null;
  if (currentDate.getTime() < baseDate.getTime()) return null;
  let count = 0;
  const oneDay = 1000 * 60 * 60 * 24;
  for (let t = baseDate.getTime(); t <= currentDate.getTime(); t += oneDay) {
    if (new Date(t).getDay() !== 0) count += 1;
  }
  return count >= 1 ? count : null;
};

export const getYouTubeWatchUrl = (url: string | null): string | null => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#/]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }
  return null;
};
