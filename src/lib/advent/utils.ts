export const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
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
  if (!dateStr || dateStr.length !== 8) return '';
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${year}년 ${month}월 ${day}일`;
};

// 2025년 11월 30일을 기준으로 몇 일차인지 계산
export const getDayNumber = (dateStr: string): number | null => {
  if (!dateStr || dateStr.length !== 8) return null;
  
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1; // 0-based month
  const day = parseInt(dateStr.slice(6, 8), 10);
  
  const currentDate = new Date(year, month, day);
  const baseDate = new Date(2025, 10, 30); // 2025년 11월 30일 (0-based: 10 = November)
  
  // 날짜 차이 계산 (밀리초 -> 일)
  const diffTime = currentDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 11월 30일부터 며칠 지났는지 계산 (1일차부터 시작)
  return diffDays + 1;
};

// 유튜브 URL을 직접 링크로 변환 (embed URL을 watch URL로 변환)
export const getYouTubeWatchUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
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

