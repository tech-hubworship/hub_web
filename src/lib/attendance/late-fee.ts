import dayjs, { Dayjs } from "dayjs";

export interface LateFeeResult {
  status: "present" | "late" | "unexcused_absence";
  lateFee: number;
  isReportRequired: boolean;
}

/**
 * 출석 기준 시간(10:00) 대비 지각비 계산
 * - 0~40분: 정상 출석
 * - 40~50분: 1,000원
 * - 50~60분: 2,000원
 * - 60~70분: 3,000원
 * - 70~80분: 4,000원 + OD 보고서 대상
 * - 80분 초과: 5,000원 + OD 보고서 대상 (무단결석)
 */
export function calculateLateFee(
  checkInTime: Dayjs,
  baseDate: string,
  startHour = 10,
  startMinute = 0
): LateFeeResult {
  // 기준 시간 생성
  // 주의: 서버 타임존 설정에 따라 동작이 달라질 수 있으므로, 
  // 실제 사용 시 checkInTime과 동일한 타임존(Asia/Seoul)으로 처리되는지 확인이 필요할 수 있습니다.
  const startTime = dayjs(`${baseDate} ${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`);

  // 기준 시간 이전이면 정상
  if (!checkInTime.isAfter(startTime)) {
    return { status: "present", lateFee: 0, isReportRequired: false };
  }

  const diffSeconds = checkInTime.diff(startTime, "second");

  // 40분 미만 (2400초)
  if (diffSeconds < 2400) {
    return { status: "present", lateFee: 0, isReportRequired: false };
  }
  // 50분 미만 (3000초)
  if (diffSeconds < 3000) {
    return { status: "late", lateFee: 1000, isReportRequired: false };
  }
  // 60분 미만 (3600초)
  if (diffSeconds < 3600) {
    return { status: "late", lateFee: 2000, isReportRequired: false };
  }
  // 70분 미만 (4200초)
  if (diffSeconds < 4200) {
    return { status: "late", lateFee: 3000, isReportRequired: false };
  }
  // 80분 미만 (4800초)
  if (diffSeconds < 4800) {
    return { status: "late", lateFee: 4000, isReportRequired: true };
  }
  
  // 80분 초과 -> 무단 결석 (unexcused_absence)
  return { status: "unexcused_absence", lateFee: 5000, isReportRequired: true };
}