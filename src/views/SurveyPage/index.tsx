import { useState } from 'react';
import { useSession } from 'next-auth/react';
import * as S from './style';
import { useQuery } from '@tanstack/react-query';
import Head from 'next/head';

interface Question {
  title: string;
  type: 'text' | 'radio' | 'checkbox';
  options?: string[];
}

interface QuestionsData {
  questions: Question[];
}

const fetchQuestions = async (): Promise<QuestionsData> => {
  const res = await fetch('/api/survey/get-sheet-questions');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || '질문을 불러오는데 실패했습니다.');
  }
  return res.json();
};

export default function SurveyPage() {
  const { data: session } = useSession({ required: true });
  const { data, isLoading, error } = useQuery<QuestionsData, Error>({
    queryKey: ['sheetQuestions'],
    queryFn: fetchQuestions,
  });

  const [formData, setFormData] = useState<{ [key: string]: string | string[] }>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  if (isLoading) return <p>질문 로딩 중...</p>;
  if (error) return <p style={{ color: 'red' }}>{error.message}</p>;
  if (!data || data.questions.length === 0) return <p>질문이 없습니다.</p>;

  const currentQuestion = data.questions[currentIndex];

  const handleChange = (value: string, type: 'text' | 'radio' | 'checkbox') => {
    const key = currentQuestion.title;
    if (type === 'checkbox') {
      const prev = formData[key] as string[] | undefined;
      const newVal = prev?.includes(value)
        ? prev.filter(v => v !== value)
        : [...(prev || []), value];
      setFormData(prevState => ({ ...prevState, [key]: newVal }));
    } else {
      setFormData(prevState => ({ ...prevState, [key]: value }));
    }
  };

  const handleNext = async () => {
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 마지막 질문이면 제출
      setIsSubmitting(true);
      setSubmitMessage('');

      try {
        if (!session?.user) throw new Error('세션 정보가 없습니다.');

        // 질문 답변 모으기
        const answers = data.questions.reduce((acc, q) => {
          const val = formData[q.title] || '';
          acc[q.title] = Array.isArray(val) ? val.join(',') : val;
          return acc;
        }, {} as { [key: string]: string });

        const payload = {
          userId: session.user.id,
          answers,
        };

        const res = await fetch('/api/survey/submit-to-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || '제출 실패');

        setSubmitMessage('✅ 성공적으로 제출되었습니다!');
      } catch (err: any) {
        setSubmitMessage(`❌ 오류: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <S.Wrapper>
      <Head>
        <title>설문조사</title>
      </Head>
      <S.Card>
        <S.Title>{currentQuestion.title}</S.Title>

        {currentQuestion.type === 'text' && (
          <S.Input
            value={(formData[currentQuestion.title] as string) || ''}
            onChange={e => handleChange(e.target.value, 'text')}
          />
        )}

        {currentQuestion.type === 'radio' && currentQuestion.options?.map(opt => (
          <label key={opt}>
            <input
              type="radio"
              name={currentQuestion.title}
              value={opt}
              checked={formData[currentQuestion.title] === opt}
              onChange={() => handleChange(opt, 'radio')}
            />{' '}
            {opt}
          </label>
        ))}

        {currentQuestion.type === 'checkbox' && currentQuestion.options?.map(opt => (
          <label key={opt}>
            <input
              type="checkbox"
              name={currentQuestion.title}
              value={opt}
              checked={(formData[currentQuestion.title] as string[] | undefined)?.includes(opt) || false}
              onChange={() => handleChange(opt, 'checkbox')}
            />{' '}
            {opt}
          </label>
        ))}

        <S.ButtonWrapper>
          <S.SubmitButton onClick={handleNext} disabled={isSubmitting}>
            {currentIndex < data.questions.length - 1 ? '다음' : isSubmitting ? '제출 중...' : '제출'}
          </S.SubmitButton>
        </S.ButtonWrapper>

        {submitMessage && <p>{submitMessage}</p>}
      </S.Card>
    </S.Wrapper>
  );
}
