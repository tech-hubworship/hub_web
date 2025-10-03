// 파일 경로: src/pages/signup/index.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PageLayout from '@src/components/common/PageLayout';
import * as S from '@src/views/LoginPage/style';

// 그룹별 다락방 목록 데이터
const hubGroups: { [key: string]: string[] } = {
    "사랑": ["사랑", "자비", "열정", "은혜", "겸손", "지혜"],
    "믿음": ["믿음", "절제", "화평", "오래참음", "충성", "선교"],
};

// 각 단계별 컴포넌트
const StepComponent = ({ title, children, onBack, onNext, nextDisabled, finalStep=false, onSubmit, loading=false }: any) => (
    <>
      <S.Title>{title}</S.Title>
      <S.InputGroup>{children}</S.InputGroup>
      <S.ButtonWrapper>
        {onBack && <S.CancelButton onClick={onBack}>이전</S.CancelButton>}
        {finalStep ? (
            <S.SubmitButton onClick={onSubmit} disabled={nextDisabled || loading}>
                {loading ? '가입하는 중...' : '가입 완료'}
            </S.SubmitButton>
        ) : (
            <S.SubmitButton onClick={onNext} disabled={nextDisabled}>다음</S.SubmitButton>
        )}
      </S.ButtonWrapper>
    </>
);

export default function SignUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', birth_date: '', gender: 'M', community: '', group_name: '', cell_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user) {
      router.replace('/login');
      return;
    }
    const { user } = session;
    if (!user.isNewUser) {
      router.replace('/info');
      return;
    }
    // ⭐️ [수정] 구글 계정 이름을 자동으로 채우는 로직을 삭제했습니다.
    // if (user.name) {
    //   setFormData(prev => ({ ...prev, name: user.name ?? '' }));
    // }
  }, [session, status, router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'birth_date') {
      const onlyNumbers = value.replace(/[^\d]/g, '');
      let formattedDate = onlyNumbers;
      if (onlyNumbers.length > 4) {
        formattedDate = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4)}`;
      }
      if (onlyNumbers.length > 6) {
        formattedDate = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4, 6)}-${onlyNumbers.slice(6, 8)}`;
      }
      setFormData(prev => ({ ...prev, [name]: formattedDate }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '오류가 발생했습니다.');
      
      alert('회원가입이 완료되었습니다!');
      router.replace('/info');

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
          <StepComponent title="실명을 알려주세요" onNext={() => setStep(2)} nextDisabled={!formData.name}>
            <S.Input name="name" value={formData.name} onChange={handleChange} required autoFocus />
          </StepComponent>
        );
      case 2:
        return (
          <StepComponent title="생년월일을 알려주세요" onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={formData.birth_date.length !== 10}>
             <S.Input name="birth_date" type="text" placeholder="YYYYMMDD" value={formData.birth_date} onChange={handleChange} maxLength={10} required />
          </StepComponent>
        );
      case 3:
        return (
          <StepComponent title="소속 공동체를 선택해주세요" onBack={() => setStep(2)} onNext={() => setStep(formData.community === '허브' ? 4 : 6)} nextDisabled={!formData.community}>
            <S.Select name="community" value={formData.community} onChange={handleChange} required>
              <option value="">-- 선택 --</option><option value="허브">허브</option><option value="타공동체">타공동체</option>
            </S.Select>
          </StepComponent>
        );
      case 4:
        if (formData.community !== '허브') return null;
        return (
          <StepComponent title="소속된 그룹을 선택해주세요" onBack={() => setStep(3)} onNext={() => setStep(5)} nextDisabled={!formData.group_name}>
            <S.Select name="group_name" value={formData.group_name} onChange={(e) => setFormData({...formData, group_name: e.target.value, cell_name: ''})} required>
              <option value="">-- 선택 --</option>{Object.keys(hubGroups).map(group => <option key={group} value={group}>{group}</option>)}
            </S.Select>
          </StepComponent>
        );
      case 5:
        if (formData.community !== '허브') return null;
        return (
          <StepComponent title="소속된 다락방을 선택해주세요" onBack={() => setStep(4)} onNext={() => setStep(6)} nextDisabled={!formData.cell_name}>
            <S.Select name="cell_name" value={formData.cell_name} onChange={handleChange} required>
              <option value="">-- 선택 --</option>
              {formData.group_name && hubGroups[formData.group_name]?.map(cell => <option key={cell} value={cell}>{cell}</option>)}
            </S.Select>
          </StepComponent>
        );
      case 6:
        return (
          <StepComponent title="성별을 선택해주세요" onBack={() => setStep(formData.community === '허브' ? 5 : 3)} finalStep={true} onSubmit={handleSubmit} loading={loading}>
            <S.Select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="M">남성</option><option value="F">여성</option>
            </S.Select>
          </StepComponent>
        );
      default:
        return null;
    }
  };

  if (status !== 'authenticated' || !session?.user?.isNewUser) {
    return <PageLayout><div>Loading...</div></PageLayout>;
  }

  return (
    <PageLayout>
      <Head><title>회원가입</title></Head>
      <S.Wrapper>
        <S.LoginCard>
          {renderStep()}
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
        </S.LoginCard>
      </S.Wrapper>
    </PageLayout>
  );
}