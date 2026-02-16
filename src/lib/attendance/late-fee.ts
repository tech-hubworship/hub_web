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
 * 지각 기준 시각(late_at) 대비 지각비 계산
 * - 지각 시작 시각 전: 정상 출석
 * - 지각 시작 시각부터: 지각 (구간별 지각비)
 *   - 10분까지: 1,000원
 *   - 20분까지: 2,000원
 *   - 30분까지: 3,000원
 *   - 30분 초과: 4,000원
 * - 무단 결석(5,000원)은 출석 관리에서 무단 결석 버튼으로만 처리 (이 함수에서는 반환하지 않음)
 */
export function calculateLateFeeWithThreshold(
  checkInTime: Dayjs,
  lateThreshold: Dayjs
): LateFeeResult {
  if (!checkInTime.isAfter(lateThreshold)) {
    return { status: "present", lateFee: 0, isReportRequired: false };
  }
  const diffSeconds = checkInTime.diff(lateThreshold, "second");

  // 10분 미만
  if (diffSeconds < 600) {
    return { status: "late", lateFee: 1000, isReportRequired: false };
  }
  // 20분 미만
  if (diffSeconds < 1200) {
    return { status: "late", lateFee: 2000, isReportRequired: false };
  }
  // 30분 미만
  if (diffSeconds < 1800) {
    return { status: "late", lateFee: 3000, isReportRequired: false };
  }
  // 30분 이상
  return { status: "late", lateFee: 4000, isReportRequired: false };
}

/**
 * 특정 날짜(baseDate)에 대해 late_at 시각의 "시:분"만 적용한 기준 시각 생성.
 * (qr_tokens.late_at은 토큰 생성일 기준이므로, 다른 날짜 출석 시 해당 날짜 + 동일 시각으로 사용)
 */
export function buildLateThresholdForDate(baseDate: string, lateAt: Dayjs): Dayjs {
  const timePart = lateAt.format("HH:mm:ss");
  return dayjs.tz(`${baseDate} ${timePart}`, "YYYY-MM-DD HH:mm:ss", "Asia/Seoul");
}