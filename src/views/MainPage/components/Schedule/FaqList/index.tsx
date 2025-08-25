import { useEffect, useState } from 'react';
import { supabase } from '@src/lib/supabase';
import FaqSection from "../FaqSection";
import * as S from "./style";

interface Schedule {
  id: number;
  title: string;
  end_time: string;
  day: string;
  mainvisible: number;
}

interface RulesListProps {
  onAnyFaqToggle?: (isOpen: boolean) => void;
}

function RulesList({ onAnyFaqToggle }: RulesListProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  
  // 열려 있는 FAQ 추적
  const updateOpenState = (id: number, isOpen: boolean) => {
    setOpenFaqs(prev => {
      const newState = { ...prev, [id]: isOpen };
      
      // 상위 컴포넌트에 열린 FAQ가 있는지 알림
      const anyOpen = Object.values(newState).some(state => state);
      if (onAnyFaqToggle) {
        onAnyFaqToggle(anyOpen);
      }
      
      return newState;
    });
  };

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('mainvisible', { ascending: true })
          .not('mainvisible', 'is', null)
          .limit(3);

        if (error) throw error;
        
        // end_time 형식을 YYYYMMDD로 변환
        const formattedData = data?.map(item => ({
          ...item,
          end_time: item.end_time.replace(/[^0-9]/g, '').padStart(8, '0')
        })) || [];
        
        setSchedules(formattedData);
      } catch (error) {
        console.error('스케줄 데이터 조회 중 오류:', error);
      }
    }

    fetchSchedules();
  }, []);

  return (
    <S.Ul>
      {schedules.map((item) => (
        <FaqSection
          key={item.id}
          title={item.title}
          endTime={item.end_time}
          day={item.day}
          onToggle={(isOpen) => updateOpenState(item.id, isOpen)}
        />
      ))}
    </S.Ul>
  );
}

export default RulesList;
