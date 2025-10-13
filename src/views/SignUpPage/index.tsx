// 파일 경로: src/views/SignUpPage/index.tsx

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PageLayout from '@src/components/common/PageLayout';
import * as S from './style';

// 각 단계별 컴포넌트
const StepComponent = ({ title, children, onBack, onNext, nextDisabled, finalStep=false, onSubmit, loading=false }: any) => (
    <S.Card>
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
    </S.Card>
);

// 역할 이름 상수화
const ROLES = {
    PASTOR: '목회자',
    GROUP_LEADER: '그룹장',
    CELL_LEADER: '다락방장',
    MC: 'MC',
};

// 18세 이상인지 확인하는 함수
const isOldEnough = (dateString: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 18;
};

export default function SignUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { role } = router.query;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: 'M',
    community: role ? '허브' : '',
    group_id: '',
    cell_id: '',
    responsible_group_id: '',
    responsible_cell_id: '',
    role: role || '',
  });
  const [groups, setGroups] = useState<{id: number, name: string}[]>([]);
  const [cells, setCells] = useState<{id: number, name: string}[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // API 호출 로직
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/signup/groups');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setGroups(data.data);
      } catch (err: any) { setError(err.message); }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const groupIdForCellFetch = formData.responsible_group_id || formData.group_id;
    if (groupIdForCellFetch) {
      const fetchCells = async () => {
        try {
          const response = await fetch(`/api/signup/cells?groupId=${groupIdForCellFetch}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          setCells(data.data);
        } catch (err: any) { setError(err.message); }
      };
      fetchCells();
    } else {
      setCells([]);
    }
  }, [formData.group_id, formData.responsible_group_id]);

  // 세션 확인 및 렌더링 준비
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (session && !session.user?.isNewUser) router.replace('/myinfo');
    if (status === 'authenticated' && session.user?.isNewUser) {
        setIsReady(true);
    }
  }, [session, status, router]);

  // 역할에 따른 자동 단계 이동 로직
  useEffect(() => {
    if (isReady && step === 3 && role) {
        if (role === ROLES.MC) {
            setStep(6);
        } else if ([ROLES.PASTOR, ROLES.GROUP_LEADER, ROLES.CELL_LEADER].includes(role as string)) {
            setStep(4);
        }
    }
  }, [step, role, isReady]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'birth_date') {
      const onlyNumbers = value.replace(/[^\d]/g, '').slice(0, 8);
      let formattedDate = onlyNumbers;
      if (onlyNumbers.length > 4) { formattedDate = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4)}`; }
      if (onlyNumbers.length > 6) { formattedDate = `${onlyNumbers.slice(0, 4)}-${onlyNumbers.slice(4, 6)}-${onlyNumbers.slice(6, 8)}`; }
      setFormData(prev => ({ ...prev, [name]: formattedDate }));
      return;
    }
    const newFormData = { ...formData, [name]: value };
    if (name === 'group_id' || name === 'responsible_group_id') {
        newFormData.cell_id = '';
        newFormData.responsible_cell_id = '';
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert('회원가입이 완료되었습니다!');
      router.replace('/myinfo');
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
            {role && <S.Subtitle style={{marginBottom: '16px', fontWeight: 600, color: '#007bff'}}>{role} 역할로 가입을 진행합니다.</S.Subtitle>}
            <S.Input name="name" value={formData.name} onChange={handleChange} required autoFocus />
          </StepComponent>
        );
      case 2:
        const isAgeInvalid = formData.birth_date.length === 10 && !isOldEnough(formData.birth_date);
        return (
          <StepComponent title="생년월일을 알려주세요" onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={formData.birth_date.length !== 10 || !isOldEnough(formData.birth_date)}>
             <S.Input name="birth_date" type="text" placeholder="YYYY-MM-DD" value={formData.birth_date} onChange={handleChange} maxLength={10} required />
             {isAgeInvalid && <S.ErrorMessage>만 18세 이상만 가입할 수 있습니다.</S.ErrorMessage>}
          </StepComponent>
        );
      case 3:
        if (role) return null; // 역할이 있으면 상단 useEffect가 처리하므로 렌더링 안 함
        return (
            <StepComponent title="소속 공동체를 선택해주세요" onBack={() => setStep(2)} onNext={() => formData.community === '타공동체' ? setStep(6) : setStep(7)} nextDisabled={!formData.community}>
              <S.Select name="community" value={formData.community} onChange={handleChange} required>
                <option value="">-- 공동체 선택 --</option>
                <option value="허브">허브</option>
                <option value="타공동체">타공동체</option>
              </S.Select>
            </StepComponent>
        );
      case 4:
        return (
          <StepComponent title="담당하실 그룹을 선택해주세요" onBack={() => setStep(2)} onNext={() => role === ROLES.CELL_LEADER ? setStep(5) : setStep(6)} nextDisabled={!formData.responsible_group_id}>
            <S.Select name="responsible_group_id" value={formData.responsible_group_id} onChange={handleChange} required>
              <option value="">-- 담당 그룹 선택 --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </S.Select>
          </StepComponent>
        );
      case 5:
        return (
          <StepComponent title="담당하실 다락방을 선택해주세요" onBack={() => setStep(4)} onNext={() => setStep(6)} nextDisabled={!formData.responsible_cell_id}>
            <S.Select name="responsible_cell_id" value={formData.responsible_cell_id} onChange={handleChange} required>
              <option value="">-- 담당 다락방 선택 --</option>
              {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </S.Select>
          </StepComponent>
        );
      case 7:
        return (
          <StepComponent title="소속 그룹을 선택해주세요" onBack={() => setStep(3)} onNext={() => setStep(8)} nextDisabled={!formData.group_id}>
            <S.Select name="group_id" value={formData.group_id} onChange={handleChange} required>
              <option value="">-- 그룹 선택 --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </S.Select>
          </StepComponent>
        );
      case 8:
        return (
          <StepComponent title="소속 다락방을 선택해주세요" onBack={() => setStep(7)} onNext={() => setStep(6)} nextDisabled={!formData.cell_id}>
            <S.Select name="cell_id" value={formData.cell_id} onChange={handleChange} required>
              <option value="">-- 다락방 선택 --</option>
              {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </S.Select>
          </StepComponent>
        );
      case 6:
        const handleBackFromGender = () => {
            if (role) {
                if ([ROLES.PASTOR, ROLES.GROUP_LEADER].includes(role as string)) setStep(4);
                else if (role === ROLES.CELL_LEADER) setStep(5);
                else setStep(2);
            } else {
                if (formData.community === '타공동체') setStep(3);
                else setStep(8);
            }
        }
        return (
          <StepComponent title="성별을 선택해주세요" onBack={handleBackFromGender} finalStep={true} onSubmit={handleSubmit} loading={loading}>
            <S.Select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="M">남성</option><option value="F">여성</option>
            </S.Select>
          </StepComponent>
        );
      default:
        return null;
    }
  };

  if (!isReady || (status === 'loading')) {
    return <PageLayout><div>Loading...</div></PageLayout>;
  }

  return (
    <PageLayout>
      <Head><title>회원가입</title></Head>
      <S.Wrapper>
        <S.Card>
          {renderStep()}
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
        </S.Card>
      </S.Wrapper>
    </PageLayout>
  );
}