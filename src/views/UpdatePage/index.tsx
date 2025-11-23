import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PageLayout from '@src/components/common/PageLayout';
import * as S from './style';

export default function UpdatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    group_id: '',
    cell_id: '',
  });
  const [groups, setGroups] = useState<{id: number, name: string}[]>([]);
  const [cells, setCells] = useState<{id: number, name: string}[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<'group' | 'cell'>('group');

  // 그룹 목록 가져오기
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/signup/groups');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setGroups(data.data);
      } catch (err: any) { 
        setError(err.message); 
      }
    };
    fetchGroups();
  }, []);

  // 셀 목록 가져오기
  useEffect(() => {
    if (formData.group_id) {
      const fetchCells = async () => {
        try {
          const response = await fetch(`/api/signup/cells?groupId=${formData.group_id}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          setCells(data.data);
        } catch (err: any) { 
          setError(err.message); 
        }
      };
      fetchCells();
    } else {
      setCells([]);
    }
  }, [formData.group_id]);

  // 세션 확인 및 프로필 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated' && session) {
      const checkProfile = async () => {
        try {
          const response = await fetch('/api/user/profile');
          if (!response.ok) {
            router.replace('/myinfo');
            return;
          }

          const profile = await response.json();
          
          // 허브 활성 사용자가 아니거나 이미 그룹/셀이 있으면 myinfo로 리다이렉트
          if (
            profile.community !== '허브' ||
            profile.status !== '활성' ||
            (profile.group_id && profile.cell_id)
          ) {
            router.replace('/myinfo');
            return;
          }

          // 기존 그룹/셀 정보가 있으면 formData에 설정
          setFormData({
            group_id: profile.group_id || '',
            cell_id: profile.cell_id || '',
          });

          setIsReady(true);
        } catch (err) {
          console.error('프로필 확인 오류:', err);
          router.replace('/myinfo');
        }
      };

      checkProfile();
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // 그룹이 변경되면 셀 초기화
    if (name === 'group_id') {
      newFormData.cell_id = '';
    }
    
    setFormData(newFormData);
  };

  const handleGroupNext = () => {
    if (formData.group_id) {
      setCurrentStep('cell');
    }
  };

  const handleBack = () => {
    if (currentStep === 'cell') {
      setCurrentStep('group');
    } else {
      router.replace('/myinfo');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: formData.group_id,
          cell_id: formData.cell_id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert('그룹/다락방 정보가 업데이트되었습니다!');
      
      // 로그인 전 원래 화면으로 돌아가기
      const REDIRECT_KEY = "login_redirect";
      const redirectPath = typeof window !== 'undefined' ? localStorage.getItem(REDIRECT_KEY) : null;
      
      if (redirectPath) {
        localStorage.removeItem(REDIRECT_KEY);
        router.replace(redirectPath);
      } else {
        router.replace('/myinfo');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || status === 'loading') {
    return (
      <PageLayout>
        <div>Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head>
        <title>정보 업데이트</title>
      </Head>
      <S.Wrapper>
        <S.Card>
          {currentStep === 'group' ? (
            <S.StepComponent
              title="소속 그룹을 선택해주세요"
              onBack={handleBack}
              onNext={handleGroupNext}
              nextDisabled={!formData.group_id}
            >
              <S.Select
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                required
              >
                <option value="">-- 그룹 선택 --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </S.Select>
            </S.StepComponent>
          ) : (
            <S.StepComponent
              title="소속 다락방을 선택해주세요"
              onBack={() => setCurrentStep('group')}
              onSubmit={handleSubmit}
              finalStep={true}
              loading={loading}
              nextDisabled={!formData.cell_id}
            >
              <S.Select
                name="cell_id"
                value={formData.cell_id}
                onChange={handleChange}
                required
              >
                <option value="">-- 다락방 선택 --</option>
                {cells.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </S.Select>
            </S.StepComponent>
          )}
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
        </S.Card>
      </S.Wrapper>
    </PageLayout>
  );
}

