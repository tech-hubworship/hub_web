import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface LateFeeResult {
  status: "present" | "late" | "unexcused_absence";
  lateFee: number;
  isReportRequired: boolean;
}

/**
 * 지각 유예 분: 이 시간까지는 정상 출석.
 * 예: 10분으로 정했으면 10분까지 정상, 11분부터 지각. 40분이면 40분까지 정상, 41분부터 지각.
 */
export const LATE_GRACE_MINUTES = 0;

/**
 * 지각 기준 시각(late_at) 대비 지각비 계산
 * - N분까지 정상 출석, (N+1)분부터 지각 (N = LATE_GRACE_MINUTES)
 * - 지각 구간(각 10분): 1,000원 / 2,000원 / 3,000원 / 4,000원 (4,000원은 OD 보고서 대상)
 * - 무단 결석(5,000원)은 출석 관리에서 무단 결석 버튼으로만 처리 (이 함수에서는 반환하지 않음)
 */
export function calculateLateFeeWithThreshold(
  checkInTime: Dayjs,
  lateThreshold: Dayjs
): LateFeeResult {
  const diffSeconds = checkInTime.diff(lateThreshold, "second");
  const graceEndSeconds = LATE_GRACE_MINUTES * 60;

  // N분까지 정상, (N+1)분부터 지각

  if (diffSeconds <= graceEndSeconds) {
    return { status: "present", lateFee: 0, isReportRequired: false };
  }

  const g = LATE_GRACE_MINUTES;
  // (N+1)~(N+10)분: 1,000원
  if (diffSeconds < (g + 11) * 60) {
    return { status: "late", lateFee: 1000, isReportRequired: false };
  }
  // (N+11)~(N+20)분: 2,000원
  if (diffSeconds < (g + 21) * 60) {
    return { status: "late", lateFee: 2000, isReportRequired: false };
  }
  // (N+21)~(N+30)분: 3,000원
  if (diffSeconds < (g + 31) * 60) {
    return { status: "late", lateFee: 3000, isReportRequired: false };
  }
  // (N+31)분~: 4,000원 (OD 보고서 대상)
  return { status: "late", lateFee: 4000, isReportRequired: true };
}

/**
 * 특정 날짜(baseDate)에 대해 late_at 시각의 "시:분"만 적용한 기준 시각 생성.
 * (qr_tokens.late_at은 토큰 생성일 기준이므로, 다른 날짜 출석 시 해당 날짜 + 동일 시각으로 사용)
 */
export function buildLateThresholdForDate(baseDate: string, lateAt: Dayjs): Dayjs {
  const timePart = lateAt.format("HH:mm:ss");
  return dayjs.tz(`${baseDate} ${timePart}`, "YYYY-MM-DD HH:mm:ss", "Asia/Seoul");
}