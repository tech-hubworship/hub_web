/**
 * 한국 시간(KST, UTC+9) 관련 유틸리티 함수들
 */

/**
 * 한국 시간 기준 현재 Date 객체 반환
 */
export const getKoreanDate = (): Date => {
  const now = new Date();
  // UTC 시간에 9시간(한국 시간대)을 더함
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
};

/**
 * 한국 시간 기준 현재 날짜를 YYYYMMDD 형식으로 반환
 */
export const getKoreanDateString = (): string => {
  const koreanDate = getKoreanDate();
  return koreanDate.toISOString().slice(0, 10).replace(/-/g, '');
};

/**
 * 한국 시간 기준 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getKoreanDateFormatted = (): string => {
  const koreanDate = getKoreanDate();
  return koreanDate.toISOString().slice(0, 10);
};

/**
 * 한국 시간 기준 ISO 문자열 반환 (API 데이터베이스 저장용)
 * 예: "2025-11-28T02:03:45.123+09:00" 형식
 */
export const getKoreanISOString = (): string => {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  // ISO 형식으로 변환 (밀리초 포함)
  return koreanTime.toISOString().replace('Z', '+09:00');
};

/**
 * 한국 시간 기준 타임스탬프 문자열 반환 (DB 저장용)
 * 예: "2025-11-28 02:03:45.123"
 */
export const getKoreanTimestamp = (): string => {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreanTime.toISOString().replace('T', ' ').replace('Z', '');
};

/**
 * 날짜를 한국어 형식으로 표시 (예: 2025년 1월 1일)
 */
export const formatKoreanDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * 날짜를 한국어 짧은 형식으로 표시 (예: 2025. 01. 01.)
 */
export const formatKoreanDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 날짜와 시간을 한국어 형식으로 표시
 */
export const formatKoreanDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
};

/**
 * 날짜 문자열을 한국 시간대 기준으로 변환하여 Date 객체 반환
 */
export const parseToKoreanDate = (dateString: string): Date => {
  return new Date(new Date(dateString).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
};

