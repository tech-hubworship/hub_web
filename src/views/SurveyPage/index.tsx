// 파일 경로: /src/views/SurveyPage/index.tsx

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import PageLayout from '@src/components/common/PageLayout';
import * as S from './style'; // ⭐️ 새로 만든 스타일 파일 import

// ⭐️ 각 단계를 위한 범용 컴포넌트
const StepComponent = ({ title, children, onBack, onNext, nextDisabled, finalStep=false, onSubmit, loading=false }: any) => (
    <S.Card>
      <S.Title>{title}</S.Title>
      <S.InputGroup>{children}</S.InputGroup>
      <S.ButtonWrapper>
        {onBack && <S.StepButton onClick={onBack}>이전</S.StepButton>}
        {finalStep ? (
            <S.SubmitButton onClick={onSubmit} disabled={nextDisabled || loading}>
                {loading ? '제출하는 중...' : '제출 완료'}
            </S.SubmitButton>
        ) : (
            <S.SubmitButton onClick={onNext} disabled={nextDisabled}>다음</S.SubmitButton>
        )}
      </S.ButtonWrapper>
    </S.Card>
);

export default function SurveyView() {
    const { status } = useSession({ required: true });
    const router = useRouter(); // 사용되지 않지만, 나중에 리디렉션 등에 필요할 수 있어 유지

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        favoriteColor: '',
        favoriteFood: '',
        feedback: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/survey/submit-to-google-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '제출 중 오류 발생');

            setSuccess('설문이 성공적으로 제출되었습니다! 감사합니다.');
            setStep(step + 1);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <StepComponent title="가장 좋아하는 색상은 무엇인가요?" onNext={() => setStep(2)} nextDisabled={!formData.favoriteColor}>
                        <S.Input name="favoriteColor" value={formData.favoriteColor} onChange={handleChange} placeholder="예: 파란색" autoFocus />
                    </StepComponent>
                );
            case 2:
                return (
                    <StepComponent title="가장 좋아하는 음식은 무엇인가요?" onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!formData.favoriteFood}>
                        <S.Input name="favoriteFood" value={formData.favoriteFood} onChange={handleChange} placeholder="예: 치킨" />
                    </StepComponent>
                );
            case 3:
                return (
                    <StepComponent title="남기고 싶은 의견이 있나요?" onBack={() => setStep(2)} finalStep={true} onSubmit={handleSubmit} nextDisabled={!formData.feedback} loading={loading}>
                        <S.Textarea name="feedback" value={formData.feedback} onChange={handleChange} placeholder="자유롭게 의견을 남겨주세요." />
                    </StepComponent>
                );
            case 4:
                return (
                    <S.Card>
                        <S.Title>{success || '완료'}</S.Title>
                    </S.Card>
                );
            default:
                return null;
        }
    };

    if (status === 'loading') {
        return <PageLayout><div>Loading...</div></PageLayout>;
    }

    return (
        <PageLayout>
            <S.Wrapper>
                {renderStep()}
                {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
            </S.Wrapper>
        </PageLayout>
    );
}