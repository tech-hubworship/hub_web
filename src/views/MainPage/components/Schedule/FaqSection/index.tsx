import { useMemo, useState, useEffect } from "react";
import * as S from "./style";
import ClockIcon from "@src/assets/icons/ic_clock.svg";

interface FaqSectionProps {
  title: string;
  endTime: string; // YYYYMMDD 형식
  day: string; // ex. '04.29'
  onToggle?: (isOpen: boolean) => void;
}

function FaqSection({ title, endTime, day, onToggle }: FaqSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { statusText, isClosed } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(
      parseInt(endTime.slice(0, 4)),
      parseInt(endTime.slice(4, 6)) - 1,
      parseInt(endTime.slice(6, 8))
    );

    const diff = Math.floor(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff < 0) return { statusText: "마감", isClosed: true };
    if (diff === 0) return { statusText: "오늘 마감", isClosed: false };
    return { statusText: `${diff}일 남음`, isClosed: false };
  }, [endTime]);
  
  const handleClick = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };
  
  // 컴포넌트가 언마운트될 때 닫힘 상태로 알림
  useEffect(() => {
    return () => {
      if (onToggle && isOpen) {
        onToggle(false);
      }
    };
  }, [onToggle, isOpen]);

  return (
    <S.Root isClosed={isClosed} onClick={handleClick}>
      <S.Rectangle isClosed={isClosed} isLong={day.length > 5}>
        <S.DateBadge isClosed={isClosed}>{day}</S.DateBadge>
      </S.Rectangle>
      <S.Section>
        <S.Title isClosed={isClosed}>{title}</S.Title>
        <S.DaySection>
          {!isClosed && <S.Icon as={ClockIcon} />}
          <S.Status isClosed={isClosed}>{statusText}</S.Status>
        </S.DaySection>
      </S.Section>
    </S.Root>
  );
}

export default FaqSection;
