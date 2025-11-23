import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { getDayNumber } from '@src/lib/advent/utils';

const SectionCard = styled.div`
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

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;


const AttendanceContent = styled.div`
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

const UnionButton = styled.button<{ isLoading: boolean; isClicking: boolean }>`
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
  animation: ${props => props.isLoading ? 'pulse 1.5s ease-in-out infinite' : 'none'};

  &:hover:not(:disabled) {
    transform: scale(1.05);

    svg {
      filter: brightness(1.1) drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
    50% {
      transform: scale(1.05);
      filter: drop-shadow(0 0 25px rgba(255, 255, 255, 1));
    }
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
  background-color: #6940B0;
  -webkit-mask: url('/icons/advent_logo.svg') no-repeat center;
  mask: url('/icons/advent_logo.svg') no-repeat center;
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
  background-color: #6940B0;
  -webkit-mask: url('/icons/advent_logo.svg') no-repeat center;
  mask: url('/icons/advent_logo.svg') no-repeat center;
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
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 8px;
  justify-content: center;
  scrollbar-width: thin;
  scrollbar-color: #CEB2FF transparent;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #CEB2FF;
    border-radius: 3px;
  }
`;

const WeekTab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background: ${props => props.active ? '#CEB2FF' : 'transparent'};
  color: ${props => props.active ? '#000000' : '#ffffff'};
  border: 2px solid #CEB2FF;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.active ? '#CEB2FF' : 'rgba(206, 178, 255, 0.2)'};
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
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

interface AttendanceSectionProps {
  currentDate: string;
  isLoggedIn: boolean;
}

interface AttendanceMap {
  [day: number]: boolean;
}

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  currentDate,
  isLoggedIn,
}) => {
  const router = useRouter();
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

  const dayNumber = getDayNumber(currentDate);

  useEffect(() => {
    if (isLoggedIn && currentDate) {
      checkAttendance();
    }
  }, [currentDate, isLoggedIn]);

  const checkAttendance = async () => {
    try {
      const response = await fetch(`/api/advent/attendance?post_dt=${currentDate}`);
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
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/advent/attendance-weekly');
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
      const response = await fetch(`/api/advent/attendance-by-week?week=${week}`);
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
    const currentWeek = dayNumber ? Math.ceil(dayNumber / 7) : 1;
    setSelectedWeek(currentWeek);
    fetchWeekAttendance(currentWeek);
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

  const renderWeekIcons = (startDay: number, endDay: number) => {
    const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
    const firstRowDays = days.slice(0, 4);
    const secondRowDays = days.slice(4, 7);
    
    return (
      <>
        {firstRowDays.length > 0 && (
          <IconRow>
            {firstRowDays.map((day) => renderUnionIcon(day, weekAttendanceMap))}
          </IconRow>
        )}
        {secondRowDays.length > 0 && (
          <IconRow>
            {secondRowDays.map((day) => renderUnionIcon(day, weekAttendanceMap))}
          </IconRow>
        )}
      </>
    );
  };

  const handleAttendanceClick = async () => {
    if (!isLoggedIn) {
      const currentPath = router.asPath;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
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
      
      const response = await fetch('/api/advent/attendance', {
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
    
    const borderColor = isAttended ? '#CEB2FF' : (isPast ? '#4B4B4B' : '#ffffff');
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
          fillColor={isAttended ? '#CEB2FF' : undefined}
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
    
    // 현재 날짜가 속한 범위 계산 (7일씩)
    // 1-7일차, 8-14일차, 15-21일차, 22-28일차
    const currentRange = Math.ceil(dayNumber / 7);
    const startDay = (currentRange - 1) * 7 + 1;
    const endDay = Math.min(currentRange * 7, 28);
    
    // 해당 범위의 일차만 필터링
    const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
    
    // 첫 번째 줄 (1-4 또는 8-11, 15-18, 22-25)
    const firstRowDays = days.slice(0, 4);
    // 두 번째 줄 (5-7 또는 12-14, 19-21, 26-28)
    const secondRowDays = days.slice(4, 7);
    
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

  if (!isLoggedIn) {
    return (
      <SectionCard>
        <ContentWrapper>
          <AttendanceContent>
            <UnionButtonWrapper>
              <UnionButton 
                onClick={handleAttendanceClick}
                isLoading={false} 
                isClicking={false}
              >
                  <UnionSVGButton 
                    width="180" 
                    height="243" 
                    viewBox="0 0 62 84" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                  <mask id="path-1-inside-1_login" fill="white">
                    <path d="M30.9639 0C40.125 6.57003e-05 47.5573 7.3962 47.6182 16.543H61.9277V83.4736H0V16.543H14.3096C14.3705 7.39616 21.8027 0 30.9639 0Z"/>
                  </mask>
                  <path 
                    d="M30.9639 0L30.9639 -1H30.9639V0ZM47.6182 16.543L46.6182 16.5496L46.6248 17.543H47.6182V16.543ZM61.9277 16.543H62.9277V15.543H61.9277V16.543ZM61.9277 83.4736V84.4736H62.9277V83.4736H61.9277ZM0 83.4736H-1V84.4736H0V83.4736ZM0 16.543V15.543H-1V16.543H0ZM14.3096 16.543V17.543H15.3029L15.3095 16.5496L14.3096 16.543ZM30.9639 0L30.9639 1C39.5748 1.00006 46.5609 7.95205 46.6182 16.5496L47.6182 16.543L48.6181 16.5363C48.5536 6.84035 40.6751 -0.99993 30.9639 -1L30.9639 0ZM47.6182 16.543V17.543H61.9277V16.543V15.543H47.6182V16.543ZM61.9277 16.543H60.9277V83.4736H61.9277H62.9277V16.543H61.9277ZM61.9277 83.4736V82.4736H0V83.4736V84.4736H61.9277V83.4736ZM0 83.4736H1V16.543H0H-1V83.4736H0ZM0 16.543V17.543H14.3096V16.543V15.543H0V16.543ZM14.3096 16.543L15.3095 16.5496C15.3668 7.952 22.3529 1 30.9639 1V0V-1C21.2525 -1 13.3741 6.84031 13.3096 16.5363L14.3096 16.543Z" 
                    fill="#ffffff"
                    mask="url(#path-1-inside-1_login)"
                  />
                </UnionSVGButton>
                <ButtonDayNumber>{getDayNumber(currentDate) || '-'}</ButtonDayNumber>
              </UnionButton>
            </UnionButtonWrapper>
            <ButtonLabel>눌러서 출석하기</ButtonLabel>
          </AttendanceContent>
        </ContentWrapper>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <ContentWrapper>
        <AttendanceContent>
          {!attendanceChecked ? (
            <>
              <UnionButtonWrapper>
                <UnionButton 
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
                    fillColor={isClicking ? '#CEB2FF' : undefined}
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
                      mask="url(#path-1-inside-1_button)"
                    />
                  </UnionSVGButton>
                  <ButtonDayNumber style={{ opacity: isClicking ? 0 : 1 }}>
                    {dayNumber || '-'}
                  </ButtonDayNumber>
                  <ButtonLogo isVisible={showLogo} />
                </UnionButton>
              </UnionButtonWrapper>
              <ButtonLabel>{loading ? '처리 중...' : dayNumber ? `눌러서 ${dayNumber}일차 출석하기` : '눌러서 출석하기'}</ButtonLabel>
            </>
          ) : (
            <AttendanceComplete>
              <CompletionHeader>
                <LogoContainer>
                  <img 
                    src="/icons/advent_logo.svg" 
                    alt="advent logo" 
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
                <WeekSelectorContainer>
                  <WeekSelectorTitle>전체 출석정보</WeekSelectorTitle>
                  
                  <WeekTabs>
                    {[1, 2, 3, 4].map((week) => (
                      <WeekTab
                        key={week}
                        active={selectedWeek === week}
                        onClick={() => handleWeekSelect(week)}
                      >
                        {week}주차
                      </WeekTab>
                    ))}
                  </WeekTabs>

                  {loadingWeek ? (
                    <div style={{ textAlign: 'center', color: '#ffffff', padding: '40px' }}>
                      로딩 중...
                    </div>
                  ) : selectedWeek ? (
                    <UnionGrid>
                      {renderWeekIcons((selectedWeek - 1) * 7 + 1, selectedWeek * 7)}
                    </UnionGrid>
                  ) : null}

                  <BackButton onClick={handleBackToCurrent}>
                    현재 주차 보기
                  </BackButton>
                </WeekSelectorContainer>
              )}
            </AttendanceComplete>
          )}
        </AttendanceContent>
      </ContentWrapper>
    </SectionCard>
  );
};
