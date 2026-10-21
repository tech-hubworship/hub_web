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
 * OD 출석 상태 값 정의
 * - present: 정상 출석
 * - late: 지각
 * - excused_absence: 인정 결석 (예외처리, 벌금/보고서 없음, 출석율 분모에서 제외)
 * - unexcused_absence: 미인정 결석 (사전에 사유를 제출했으나 인정되지 않는 사유) → 벌금 + 보고서
 * - no_show: 무단 결석 (사전에 사유를 제출하지 않음) → 벌금 + 보고서
 *
 * 미인정 결석(unexcused_absence)과 무단 결석(no_show)의 차이:
 * - 사전에 사유를 말했는지의 유무로 구분
 * - 둘 다 벌금 5,000원 및 OD 보고서 제출 대상
 */
export const ABSENCE_FINE = 5000;

export type AttendanceStatus =
  | "present"
  | "late"
  | "excused_absence"
  | "unexcused_absence"
  | "no_show";

/** 벌금 + 보고서 대상인 결석 상태 (미인정 결석 / 무단 결석) */
export const FINED_ABSENCE_STATUSES: AttendanceStatus[] = [
  "unexcused_absence",
  "no_show",
];

export function isFinedAbsence(status: string | null | undefined): boolean {
  return status === "unexcused_absence" || status === "no_show";
}

/** 상태 → 한글 라벨 */
export function attendanceStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "present":
      return "정상";
    case "late":
      return "지각";
    case "excused_absence":
      return "결석(인정)";
    case "unexcused_absence":
      return "미인정 결석";
    case "no_show":
      return "무단 결석";
    default:
      return "미출석";
  }
}

/**
 * 지각 유예 분: 이 시간까지는 정상 출석.
 * 예: 10분으로 정했으면 10분까지 정상, 11분부터 지각. 40분이면 40분까지 정상, 41분부터 지각.
 */
export const LATE_GRACE_MINUTES = 0;

/**
 * 지각 기준 시각(late_at) 대비 지각비 계산
 * - N분까지 정상 출석, (N+1)분 시점부터 지각 (N = LATE_GRACE_MINUTES). 분 단위로만 비교하므로 0분 1초~0분 59초는 정상.
 * - 지각 구간(각 10분): 1,000원 / 2,000원 / 3,000원 / 4,000원 (4,000원은 OD 보고서 대상)
 * - 무단 결석(5,000원)은 출석 관리에서 무단 결석 버튼으로만 처리 (이 함수에서는 반환하지 않음)
 */
export function calculateLateFeeWithThreshold(
  checkInTime: Dayjs,
  lateThreshold: Dayjs
): LateFeeResult {
  // 분 단위(버림)로 비교: 정한시간 +1분이 되는 시점부터 지각 (0분 1초~59초는 0분으로 정상 처리)
  const diffMinutes = checkInTime.diff(lateThreshold, "minute");

  const g = LATE_GRACE_MINUTES;
  // N분까지 정상, (N+1)분부터 지각
  if (diffMinutes <= g) {
    return { status: "present", lateFee: 0, isReportRequired: false };
  }
  // (N+1)~(N+10)분: 1,000원
  if (diffMinutes < g + 11) {
    return { status: "late", lateFee: 1000, isReportRequired: false };
  }
  // (N+11)~(N+20)분: 2,000원
  if (diffMinutes < g + 21) {
    return { status: "late", lateFee: 2000, isReportRequired: false };
  }
  // (N+21)~(N+30)분: 3,000원
  if (diffMinutes < g + 31) {
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