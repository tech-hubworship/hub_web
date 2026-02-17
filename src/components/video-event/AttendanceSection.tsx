import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { getDayNumber } from '@src/lib/video-event/utils';
import { VIDEO_EVENT } from '@src/lib/video-event/constants';

const SectionCard = styled(motion.div)`
  background: #000000;
  padding: 40px 40px 0 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-bottom: 0;

  @media (max-width: 1024px) {
    padding: 32px 32px 0 32px;
  }

  @media (max-width: 768px) {
    padding: 24px 24px 0 24px;
  }
`;

const ContentWrapper = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;


const AttendanceContent = styled(motion.div)`
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;

  @media (max-width: 768px) {
    padding: 32px 16px;
  }
`;

const UnionButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const UnionButtonBase = styled.button<{ isLoading: boolean; isClicking: boolean }>`
  position: relative;
  width: 180px;
  height: 243px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    width: 150px;
    height: 203px;
  }

  @media (max-width: 480px) {
    width: 120px;
    height: 162px;
  }
`;

const UnionButton = motion(UnionButtonBase);

const UnionSVGButton = styled.svg<{ fillColor?: string }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  transition: all 0.3s ease;
  pointer-events: none;
  
  .icon-fill {
    fill: ${props => props.fillColor || 'transparent'};
    transition: fill 1s ease-in-out;
  }
  
  .icon-border {
    fill: #ffffff;
    transition: all 0.3s ease;
  }
`;

const ButtonDayNumber = styled.div`
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 72px;
  font-weight: 600;
  color: #ffffff;
  z-index: 10;
  text-shadow: 
    -2px -2px 0 #000000,
    2px -2px 0 #000000,
    -2px 2px 0 #000000,
    2px 2px 0 #000000,
    0 0 10px rgba(0, 0, 0, 1),
    0 0 20px rgba(0, 0, 0, 0.8);
  transition: opacity 0.5s ease-in-out;

  @media (max-width: 768px) {
    font-size: 56px;
  }

  @media (max-width: 480px) {
    font-size: 48px;
  }
`;

const ButtonLogo = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 77px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
  pointer-events: none;
  background-color: #000000;
  -webkit-mask: url(${VIDEO_EVENT.EVENT_LOGO_PATH}) no-repeat center;
  mask: url(${VIDEO_EVENT.EVENT_LOGO_PATH}) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.8s ease-in-out;

  img {
    display: none;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 61px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 55px;
  }
`;

const ButtonLabel = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  margin-top: 24px;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-top: 20px;
  }
`;

const AttendanceComplete = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const CompletionHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const LogoContainer = styled.div`
  width: 48px;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 55px;
  }
`;

const CompletionText = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const UnionGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  width: 100%;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 20px 0;
  }

  @media (max-width: 480px) {
    gap: 16px;
    padding: 16px 0;
  }
`;

const IconRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const UnionIcon = styled.div<{ isAttended: boolean; isPast: boolean; isToday: boolean }>`
  position: relative;
  width: 93px;
  height: 126px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 75px;
    height: 102px;
  }

  @media (max-width: 480px) {
    width: 70px;
    height: 95px;
  }
`;

const UnionSVG = styled.svg<{ color: string; fillColor?: string }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  
  .icon-border {
    fill: ${props => props.color};
  }
  
  .icon-fill {
    fill: ${props => props.fillColor || 'transparent'};
  }
`;

const DayNumber = styled.div<{ color: string }>`
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 72px;
  font-weight: 600;
  color: ${props => props.color};
  z-index: 5;
  pointer-events: none;

  @media (max-width: 768px) {
    font-size: 56px;
  }

  @media (max-width: 480px) {
    font-size: 48px;
  }
`;

const AdventLogoInIcon = styled.div`
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 77px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  pointer-events: none;
  background-color: #000000;
  -webkit-mask: url(${VIDEO_EVENT.EVENT_LOGO_PATH}) no-repeat center;
  mask: url(${VIDEO_EVENT.EVENT_LOGO_PATH}) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;

  img {
    display: none;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 61px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 55px;
  }
`;

const ViewAllButton = styled.button`
  padding: 12px 24px;
  background: transparent;
  color: #ffffff;
  border: 2px solid #ffffff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

const WeekSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const WeekSelectorHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
`;

const WeekSelectorTitle = styled.div`
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
`;

const WeekTabs = styled.div`
  display: inline-flex;
  gap: 0;
  margin-bottom: 24px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px;
  justify-content: center;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 22px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    max-width: 100vw;
    margin-left: -24px;
    margin-right: -24px;
    padding-left: 24px;
    padding-right: 24px;
    scroll-snap-type: x proximity;
  }
`;

const WeekTab = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  background: ${props => props.active ? '#ffffff' : 'transparent'};
  color: ${props => props.active ? '#000000' : 'rgba(255, 255, 255, 0.9)'};
  border: none;
  border-radius: 18px;
  font-size: 15px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.08)'};
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 16px;
    scroll-snap-align: start;
  }
`;

const BackButton = styled.button`
  padding: 12px 24px;
  background: transparent;
  color: #ffffff;
  border: 2px solid #ffffff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
`;

/** 한국 달력 주차별 출석 (일월화수목금토) */
const CalendarTable = styled.table`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  border-collapse: collapse;
  font-size: 14px;

  @media (max-width: 768px) {
    max-width: 100%;
    font-size: 12px;
  }
`;

const CalendarHeaderCell = styled.th`
  padding: 12px 8px;
  color: #ffffff;
  font-weight: 700;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  width: 14.28%;

  @media (max-width: 768px) {
    padding: 8px 4px;
  }
`;

const CalendarCell = styled.td<{ $isEmpty?: boolean }>`
  padding: 8px;
  vertical-align: middle;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  min-height: 64px;
  ${props => props.$isEmpty && 'background: rgba(255,255,255,0.03);'}

  @media (max-width: 768px) {
    min-height: 52px;
  }
`;

const CalendarCellInner = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
`;

const WeekBlock = styled.div`
  margin-bottom: 32px;
  &:last-of-type {
    margin-bottom: 0;
  }
`;

const WeekLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 12px;
  }
`;

const LoadingLogo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  img {
    width: 48px;
    height: 66px;
    opacity: 0.8;
  }
`;

interface AttendanceSectionProps {
  currentDate: string;
  isLoggedIn: boolean;
  isEventEnded?: boolean;
}

interface AttendanceMap {
  [day: number]: boolean;
}

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  currentDate,
  isLoggedIn,
  isEventEnded = false,
}) => {
  const [attendanceChecked, setAttendanceChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [showTable, setShowTable] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showWeekView, setShowWeekView] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekAttendanceMap, setWeekAttendanceMap] = useState<AttendanceMap>({});
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);

  const dayNumber = getDayNumber(currentDate);

  useEffect(() => {
    if (isLoggedIn && currentDate) {
      if (isEventEnded) {
        // 이벤트 종료 후에는 자동으로 전체 출석 현황 표시
        fetchAttendance();
        setShowTable(true);
        setShowWeekView(true);
      } else {
        checkAttendance();
      }
    }
  }, [currentDate, isLoggedIn, isEventEnded]);

  const checkAttendance = async () => {
    if (!currentDate) {
      setCheckingAttendance(false);
      return;
    }
    try {
      setCheckingAttendance(true);
      const response = await fetch(`/api/video-event/attendance?post_dt=${currentDate}`);
      const data = await response.json();

      if (response.ok) {
        setAttendanceChecked(!!data.attendance);
        if (data.attendance) {
          fetchAttendance();
          setShowTable(true);
        }
      }
    } catch (err) {
      console.error('출석 확인 오류:', err);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/video-event/attendance-weekly');
      const data = await response.json();

      if (response.ok) {
        setAttendanceMap(data.attendance || {});
      }
    } catch (err) {
      console.error('출석 현황 조회 오류:', err);
    }
  };

  const fetchWeekAttendance = async (week: number) => {
    try {
      setLoadingWeek(true);
      const response = await fetch(`/api/video-event/attendance-by-week?week=${week}`);
      const data = await response.json();

      if (response.ok) {
        setWeekAttendanceMap(data.attendance || {});
      }
    } catch (err) {
      console.error('주차별 출석 조회 오류:', err);
    } finally {
      setLoadingWeek(false);
    }
  };

  const handleViewAllClick = () => {
    setShowWeekView(true);
    setSelectedWeek(1);
    fetchAttendance();
  };

  const handleBackToCurrent = () => {
    setShowWeekView(false);
    setSelectedWeek(null);
    setWeekAttendanceMap({});
  };

  const handleWeekSelect = (week: number) => {
    setSelectedWeek(week);
    fetchWeekAttendance(week);
  };

  /** 1주차: 1-4일, 2주차: 5-11일, 3주차: 12-18일, 4주차: 19-25일, 5주차: 26-32일, 6주차: 33-40일 */
  const WEEK_DAY_RANGES: [number, number][] = [[1, 4], [5, 11], [12, 18], [19, 25], [26, 32], [33, 40]];
  const getWeekRange = (week: number): [number, number] => WEEK_DAY_RANGES[week - 1] ?? [1, 4];
  const getWeekForDay = (day: number): number => {
    if (day <= 4) return 1;
    if (day <= 11) return 2;
    if (day <= 18) return 3;
    if (day <= 25) return 4;
    if (day <= 32) return 5;
    return 6;
  };

  const renderWeekIcons = (startDay: number, endDay: number, dataMap?: AttendanceMap) => {
    const map = dataMap ?? weekAttendanceMap;
    const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
      .filter(day => day <= 40);
    const firstRowDays = days.slice(0, 4);
    const secondRowDays = days.slice(4);

    return (
      <>
        {firstRowDays.length > 0 && (
          <IconRow>
            {firstRowDays.map((day) => renderUnionIcon(day, map))}
          </IconRow>
        )}
        {secondRowDays.length > 0 && (
          <IconRow>
            {secondRowDays.map((day) => renderUnionIcon(day, map))}
          </IconRow>
        )}
      </>
    );
  };

  const handleAttendanceClick = async () => {
    if (!isLoggedIn) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    if (!dayNumber) {
      alert('올바른 날짜가 아닙니다.');
      return;
    }

    // 배경색 변경 시작 (숫자 숨기고 로고 표시)
    setIsClicking(true);
    setShowLogo(true);

    try {
      setLoading(true);
      
      // currentDate는 이제 post.post_dt를 전달받으므로 그대로 사용
      const response = await fetch('/api/video-event/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_dt: currentDate,
          day_number: dayNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 애니메이션 완료 후 상태 변경 (1.5초 후)
        setTimeout(() => {
          setAttendanceChecked(true);
          setShowTable(true);
          fetchAttendance();
        }, 1500);
      } else {
        setIsClicking(false);
        setShowLogo(false);
        alert(data.error || '출석 체크에 실패했습니다.');
      }
    } catch (err) {
      setIsClicking(false);
      setShowLogo(false);
      alert('출석 체크 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    }
  };

  const isDayAttended = (day: number): boolean => {
    return !!attendanceMap[day];
  };

  const isPastDay = (day: number): boolean => {
    if (!dayNumber) return false;
    return day < dayNumber;
  };

  const renderUnionIcon = (day: number, attendanceData: AttendanceMap = attendanceMap) => {
    const isAttended = !!attendanceData[day];
    const isPast = dayNumber ? day < dayNumber : false;
    const isToday = day === dayNumber;
    
    const borderColor = isAttended ? '#2E2E2E' : (isPast ? '#4B4B4B' : '#ffffff');
    const textColor = isAttended ? '#ffffff' : (isPast ? '#4B4B4B' : '#ffffff');

    return (
      <UnionIcon 
        key={day} 
        isAttended={isAttended}
        isPast={isPast}
        isToday={isToday}
      >
        <UnionSVG 
          width="62" 
          height="84" 
          viewBox="0 0 62 84" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          color={borderColor}
          fillColor={isAttended ? '#2E2E2E' : undefined}
        >
          <mask id={`path-1-inside-1_${day}`} fill="white">
            <path d="M30.9639 0C40.125 6.57003e-05 47.5573 7.3962 47.6182 16.543H61.9277V83.4736H0V16.543H14.3096C14.3705 7.39616 21.8027 0 30.9639 0Z"/>
          </mask>
          {isAttended && (
            <path 
              className="icon-fill"
              d="M30.9639 0C40.125 6.57003e-05 47.5573 7.3962 47.6182 16.543H61.9277V83.4736H0V16.543H14.3096C14.3705 7.39616 21.8027 0 30.9639 0Z"
              mask={`url(#path-1-inside-1_${day})`}
            />
          )}
          <path 
            className="icon-border"
            d="M30.9639 0L30.9639 -1H30.9639V0ZM47.6182 16.543L46.6182 16.5496L46.6248 17.543H47.6182V16.543ZM61.9277 16.543H62.9277V15.543H61.9277V16.543ZM61.9277 83.4736V84.4736H62.9277V83.4736H61.9277ZM0 83.4736H-1V84.4736H0V83.4736ZM0 16.543V15.543H-1V16.543H0ZM14.3096 16.543V17.543H15.3029L15.3095 16.5496L14.3096 16.543ZM30.9639 0L30.9639 1C39.5748 1.00006 46.5609 7.95205 46.6182 16.5496L47.6182 16.543L48.6181 16.5363C48.5536 6.84035 40.6751 -0.99993 30.9639 -1L30.9639 0ZM47.6182 16.543V17.543H61.9277V16.543V15.543H47.6182V16.543ZM61.9277 16.543H60.9277V83.4736H61.9277H62.9277V16.543H61.9277ZM61.9277 83.4736V82.4736H0V83.4736V84.4736H61.9277V83.4736ZM0 83.4736H1V16.543H0H-1V83.4736H0ZM0 16.543V17.543H14.3096V16.543V15.543H0V16.543ZM14.3096 16.543L15.3095 16.5496C15.3668 7.952 22.3529 1 30.9639 1V0V-1C21.2525 -1 13.3741 6.84031 13.3096 16.5363L14.3096 16.543Z" 
            mask={`url(#path-1-inside-1_${day})`}
          />
        </UnionSVG>
        {isAttended ? (
          <AdventLogoInIcon />
        ) : (
          <DayNumber color={textColor}>{day}</DayNumber>
        )}
      </UnionIcon>
    );
  };

  const renderUnionIcons = () => {
    if (!dayNumber) return null;
    const week = getWeekForDay(dayNumber);
    const [startDay, endDay] = getWeekRange(week);
    const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
      .filter(day => day <= 40);
    const firstRowDays = days.slice(0, 4);
    const secondRowDays = days.slice(4);

    return (
      <>
        {firstRowDays.length > 0 && (
          <IconRow>
            {firstRowDays.map((day) => renderUnionIcon(day))}
          </IconRow>
        )}
        {secondRowDays.length > 0 && (
          <IconRow>
            {secondRowDays.map((day) => renderUnionIcon(day))}
          </IconRow>
        )}
      </>
    );
  };

  // 1일차부터 26일차까지 모두 표시하는 함수
  const renderAllDaysIcons = () => {
    const allDays = Array.from({ length: 26 }, (_, i) => i + 1);
    
    // 여러 줄로 나누어 표시 (한 줄에 4개씩)
    const rows: number[][] = [];
    for (let i = 0; i < allDays.length; i += 4) {
      rows.push(allDays.slice(i, i + 4));
    }
    
    return (
      <>
        {rows.map((rowDays, rowIndex) => (
          <IconRow key={rowIndex}>
            {rowDays.map((day) => renderUnionIcon(day, attendanceMap))}
          </IconRow>
        ))}
      </>
    );
  };

  /** 한국 달력: 일(0)월(1)화(2)수(3)목(4)금(5)토(6). 2026-02-18=수요일 → day1이 column 3 */
  const getDayNumberForCell = (week: number, col: number): number | null => {
    const dayNum = (week - 1) * 7 + (col + 4) % 7 + 1;
    return dayNum <= 26 ? dayNum : null;
  };

  const renderCalendarView = () => {
    const weekLabels = ['일', '월', '화', '수', '목', '금', '토'];
    const totalWeeks = 4;
    return (
      <CalendarTable>
        <thead>
          <tr>
            {weekLabels.map((label) => (
              <CalendarHeaderCell key={label}>{label}</CalendarHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: totalWeeks }, (_, w) => w + 1).map((week) => (
            <tr key={week}>
              {Array.from({ length: 7 }, (_, c) => c).map((col) => {
                const dayNum = getDayNumberForCell(week, col);
                const isEmpty = dayNum === null;
                const isAttended = dayNum !== null && !!attendanceMap[dayNum];
                return (
                  <CalendarCell key={col} $isEmpty={isEmpty} style={dayNum && isAttended ? { background: '#2E2E2E' } : undefined}>
                    <CalendarCellInner>
                      {dayNum !== null && (
                        <span style={{ color: '#ffffff', fontSize: 'inherit', fontWeight: 600 }}>
                          {dayNum}
                          {isAttended && ' ✓'}
                        </span>
                      )}
                    </CalendarCellInner>
                  </CalendarCell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </CalendarTable>
    );
  };

  // 이벤트 종료 후에는 출석 버튼 숨기고 전체 출석 현황만 표시 (한국 달력 주차별)
  if (isEventEnded && isLoggedIn) {
    return (
      <SectionCard>
        <ContentWrapper>
          <AttendanceContent>
            <CompletionHeader>
              <LogoContainer>
                <img src={VIDEO_EVENT.EVENT_LOGO_PATH} alt={`${VIDEO_EVENT.DISPLAY_NAME} 로고`} />
              </LogoContainer>
              <CompletionText>전체 출석 현황</CompletionText>
            </CompletionHeader>
            {showTable && renderCalendarView()}
          </AttendanceContent>
        </ContentWrapper>
      </SectionCard>
    );
  }

  if (!isLoggedIn) {
    return (
      <SectionCard>
        <ContentWrapper>
          <AttendanceContent>
            <CompletionHeader>
              <LogoContainer>
                <img src={VIDEO_EVENT.EVENT_LOGO_PATH} alt={`${VIDEO_EVENT.DISPLAY_NAME} 로고`} />
              </LogoContainer>
              <CompletionText>로그인 후 출석할 수 있습니다</CompletionText>
            </CompletionHeader>
            <UnionButtonWrapper>
              <UnionButton
                disabled
                isLoading={false}
                isClicking={false}
                onClick={() => {}}
              >
                <UnionSVGButton width="180" height="243" viewBox="0 0 62 84" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="icon-border" d="M30.9639 0L30.9639 -1H30.9639V0ZM47.6182 16.543L46.6182 16.5496L46.6248 17.543H47.6182V16.543ZM61.9277 16.543H62.9277V15.543H61.9277V16.543ZM61.9277 83.4736V84.4736H62.9277V83.4736H61.9277ZM0 83.4736H-1V84.4736H0V83.4736ZM0 16.543V15.543H-1V16.543H0ZM14.3096 16.543V17.543H15.3029L15.3095 16.5496L14.3096 16.543Z" fill="#ffffff" fillOpacity="0.5" />
                </UnionSVGButton>
                <ButtonDayNumber>{dayNumber || '-'}</ButtonDayNumber>
              </UnionButton>
            </UnionButtonWrapper>
            <ButtonLabel>로그인 후 출석하기</ButtonLabel>
          </AttendanceContent>
        </ContentWrapper>
      </SectionCard>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  return (
    <SectionCard
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <ContentWrapper>
        <AttendanceContent variants={itemVariants}>
          {!attendanceChecked ? (
            <>
              {checkingAttendance ? (
                <LoadingLogo>
                  <img src={VIDEO_EVENT.EVENT_LOGO_PATH} alt="loading" />
                </LoadingLogo>
              ) : (
                <>
                  <CompletionHeader>
                    <LogoContainer>
                      <img src={VIDEO_EVENT.EVENT_LOGO_PATH} alt={`${VIDEO_EVENT.DISPLAY_NAME} 로고`} />
                    </LogoContainer>
                    <CompletionText>출석하기</CompletionText>
                  </CompletionHeader>
                  <UnionButtonWrapper>
                    <UnionButton
                      variants={buttonVariants}
                      animate="visible"
                      onClick={handleAttendanceClick}
                      disabled={loading || !dayNumber}
                      isLoading={loading}
                      isClicking={isClicking}
                    >
                      <UnionSVGButton 
                        width="180" 
                        height="243" 
                        viewBox="0 0 62 84" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        fillColor={isClicking ? '#EF0017' : undefined}
                      >
                        <mask id="path-1-inside-1_button" fill="white">
                          <path d="M30.9639 0C40.125 6.57003e-05 47.5573 7.3962 47.6182 16.543H61.9277V83.4736H0V16.543H14.3096C14.3705 7.39616 21.8027 0 30.9639 0Z"/>
                        </mask>
                        {isClicking && (
                          <path 
                            className="icon-fill"
                            d="M30.9639 0C40.125 6.57003e-05 47.5573 7.3962 47.6182 16.543H61.9277V83.4736H0V16.543H14.3096C14.3705 7.39616 21.8027 0 30.9639 0Z"
                            mask="url(#path-1-inside-1_button)"
                          />
                        )}
                        <path 
                          className="icon-border"
                          d="M30.9639 0L30.9639 -1H30.9639V0ZM47.6182 16.543L46.6182 16.5496L46.6248 17.543H47.6182V16.543ZM61.9277 16.543H62.9277V15.543H61.9277V16.543ZM61.9277 83.4736V84.4736H62.9277V83.4736H61.9277ZM0 83.4736H-1V84.4736H0V83.4736ZM0 16.543V15.543H-1V16.543H0ZM14.3096 16.543V17.543H15.3029L15.3095 16.5496L14.3096 16.543ZM30.9639 0L30.9639 1C39.5748 1.00006 46.5609 7.95205 46.6182 16.5496L47.6182 16.543L48.6181 16.5363C48.5536 6.84035 40.6751 -0.99993 30.9639 -1L30.9639 0ZM47.6182 16.543V17.543H61.9277V16.543V15.543H47.6182V16.543ZM61.9277 16.543H60.9277V83.4736H61.9277H62.9277V16.543H61.9277ZM61.9277 83.4736V82.4736H0V83.4736V84.4736H61.9277V83.4736ZM0 83.4736H1V16.543H0H-1V83.4736H0ZM0 16.543V17.543H14.3096V16.543V15.543H0V16.543ZM14.3096 16.543L15.3095 16.5496C15.3668 7.952 22.3529 1 30.9639 1V0V-1C21.2525 -1 13.3741 6.84031 13.3096 16.5363L14.3096 16.543Z" 
                          fill="#ffffff"
                          mask="url(#path-1-inside-1_button)"
                        />
                      </UnionSVGButton>
                      <ButtonDayNumber style={{ opacity: isClicking ? 0 : 1 }}>
                        {dayNumber || '-'}
                      </ButtonDayNumber>
                      <ButtonLogo isVisible={showLogo} />
                    </UnionButton>
                  </UnionButtonWrapper>
                  <ButtonLabel>
                    {dayNumber ? `눌러서 ${dayNumber}일차 출석하기` : '눌러서 출석하기'}
                  </ButtonLabel>
                </>
              )}
            </>
          ) : (
            <AttendanceComplete>
              <CompletionHeader>
                <LogoContainer>
                  <img 
                    src={VIDEO_EVENT.EVENT_LOGO_PATH} 
                    alt={`${VIDEO_EVENT.DISPLAY_NAME} 로고`} 
                  />
                </LogoContainer>
                <CompletionText>{dayNumber}일차 출석완료</CompletionText>
              </CompletionHeader>
              {showTable && !showWeekView && (
                <>
                  <UnionGrid>
                    {renderUnionIcons()}
                  </UnionGrid>
                  <ViewAllButton onClick={handleViewAllClick}>
                    전체 출석정보 보기
                  </ViewAllButton>
                </>
              )}

              {showTable && showWeekView && (
                <>
                  <WeekTabs>
                    {[1, 2, 3, 4, 5, 6].map((week) => (
                      <WeekTab
                        key={week}
                        active={selectedWeek === week}
                        onClick={() => setSelectedWeek(week)}
                      >
                        {week}주차
                      </WeekTab>
                    ))}
                  </WeekTabs>
                  {selectedWeek !== null && (() => {
                    const [start, end] = getWeekRange(selectedWeek);
                    return (
                      <WeekBlock>
                        <UnionGrid>
                          {renderWeekIcons(start, end, attendanceMap)}
                        </UnionGrid>
                      </WeekBlock>
                    );
                  })()}
                  <BackButton onClick={handleBackToCurrent} style={{ marginTop: 24 }}>
                    현재 주로 돌아가기
                  </BackButton>
                </>
              )}
            </AttendanceComplete>
          )}
        </AttendanceContent>
      </ContentWrapper>
    </SectionCard>
  );
};
