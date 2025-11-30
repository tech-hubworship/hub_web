import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PageLayout from '@src/components/common/PageLayout';
import * as S from './style';
import { Combobox } from '@src/components/ui/combobox';

export default function UpdatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    name: '',
    birth_date: '',
    gender: '',
  });
  const [formData, setFormData] = useState({
    community: '',
    group_id: '',
    cell_id: '',
  });
  const [groups, setGroups] = useState<{id: number, name: string}[]>([]);
  const [cells, setCells] = useState<{id: number, name: string}[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState<'userInfo' | 'community' | 'group' | 'cell'>('userInfo');

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
          
          // 관리자 여부 확인
          const isAdmin = session?.user?.isAdmin || profile.roles?.length > 0 || profile.status === '관리자';
          
          // 허브 활성 사용자 또는 관리자이고 그룹/셀이 비어있는 경우에만 업데이트 페이지 표시
          const isHubActive = profile.community === '허브' && profile.status === '활성';
          const hasEmptyGroupCell = !profile.group_id || !profile.cell_id;
          
          if (!isAdmin && (!isHubActive || !hasEmptyGroupCell)) {
            router.replace('/myinfo');
            return;
          }

          // 관리자는 그룹/셀이 비어있을 때만 업데이트 가능
          if (isAdmin && !hasEmptyGroupCell) {
            router.replace('/myinfo');
            return;
          }

          // 사용자 정보 설정
          setUserInfo({
            name: profile.name || '',
            birth_date: profile.birth_date || '',
            gender: profile.gender || '',
          });

          // 기존 정보가 있으면 formData에 설정
          setFormData({
            community: profile.community || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComboboxChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    
    // 커뮤니티가 변경되면 그룹/셀 초기화
    if (name === 'community') {
      newFormData.group_id = '';
      newFormData.cell_id = '';
    }
    // 그룹이 변경되면 셀 초기화
    if (name === 'group_id') {
      newFormData.cell_id = '';
    }
    
    setFormData(newFormData);
  };

  const handleCommunityNext = () => {
    if (formData.community) {
      // 타공동체면 그룹/셀 선택 없이 바로 완료
      if (formData.community === '타공동체') {
        setCurrentStep('cell');
      } else {
        setCurrentStep('group');
      }
    }
  };

  const handleGroupNext = () => {
    if (formData.group_id) {
      setCurrentStep('cell');
    }
  };

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUserInfo = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userInfo.name,
          birth_date: userInfo.birth_date,
          gender: userInfo.gender,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert('사용자 정보가 수정되었습니다!');
      setIsEditingUserInfo(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserInfoNext = () => {
    // 이름, 생일, 성별이 모두 있는지 확인
    if (!userInfo.name || !userInfo.birth_date || !userInfo.gender) {
      alert('이름, 생년월일, 성별을 모두 입력해주세요.');
      return;
    }
    setCurrentStep('community');
  };

  const handleBack = () => {
    if (currentStep === 'cell') {
      if (formData.community === '타공동체') {
        setCurrentStep('community');
      } else {
        setCurrentStep('group');
      }
    } else if (currentStep === 'group') {
      setCurrentStep('community');
    } else if (currentStep === 'community') {
      setCurrentStep('userInfo');
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
          community: formData.community,
          group_id: formData.community === '타공동체' ? null : formData.group_id,
          cell_id: formData.community === '타공동체' ? null : formData.cell_id,
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
          {currentStep === 'userInfo' ? (
            <>
              <S.Title>사용자 정보 확인</S.Title>
              <S.InputGroup>
                {isEditingUserInfo ? (
                <>
                  <S.InputGroup>
                    <S.Label>이름 *</S.Label>
                    <S.Input
                      type="text"
                      name="name"
                      value={userInfo.name}
                      onChange={handleUserInfoChange}
                      placeholder="이름을 입력하세요"
                      required
                    />
                  </S.InputGroup>
                  <S.InputGroup>
                    <S.Label>생년월일 *</S.Label>
                    <S.Input
                      type="date"
                      name="birth_date"
                      value={userInfo.birth_date}
                      onChange={handleUserInfoChange}
                      required
                    />
                  </S.InputGroup>
                  <S.InputGroup>
                    <S.Label>성별 *</S.Label>
                    <Combobox
                      name="gender"
                      value={userInfo.gender}
                      onChange={(value) => {
                        const e = { target: { name: 'gender', value } } as React.ChangeEvent<HTMLInputElement>;
                        handleUserInfoChange(e);
                      }}
                      options={[
                        { value: '', label: '-- 성별 선택 --' },
                        { value: 'M', label: '남' },
                        { value: 'F', label: '여' },
                      ]}
                      placeholder="-- 성별 선택 --"
                      required
                    />
                  </S.InputGroup>
                  <S.ButtonWrapper style={{ marginTop: '16px' }}>
                    <S.CancelButton onClick={() => {
                      setIsEditingUserInfo(false);
                      // 원래 정보 다시 불러오기
                      fetch('/api/user/profile')
                        .then(res => res.json())
                        .then(profile => {
                          setUserInfo({
                            name: profile.name || '',
                            birth_date: profile.birth_date || '',
                            gender: profile.gender || '',
                          });
                        });
                    }}>
                      취소
                    </S.CancelButton>
                    <S.SubmitButton onClick={handleSaveUserInfo} disabled={loading}>
                      {loading ? '저장 중...' : '저장'}
                    </S.SubmitButton>
                  </S.ButtonWrapper>
                </>
              ) : (
                <>
                  <S.InfoCard>
                    <S.InfoRow>
                      <S.InfoLabel>이름</S.InfoLabel>
                      <S.InfoValue>{userInfo.name || '미입력'}</S.InfoValue>
                    </S.InfoRow>
                    <S.InfoRow>
                      <S.InfoLabel>생년월일</S.InfoLabel>
                      <S.InfoValue>{userInfo.birth_date || '미입력'}</S.InfoValue>
                    </S.InfoRow>
                    <S.InfoRow>
                      <S.InfoLabel>성별</S.InfoLabel>
                      <S.InfoValue>
                        {userInfo.gender === 'M' ? '남성' : userInfo.gender === 'F' ? '여성' : userInfo.gender || '미입력'}
                      </S.InfoValue>
                    </S.InfoRow>
                  </S.InfoCard>
                  {(!userInfo.name || !userInfo.birth_date || !userInfo.gender) && (
                    <S.WarningText>
                      ⚠️ 정보가 누락되어 있습니다. 수정 버튼을 클릭하여 정보를 입력해주세요.
                    </S.WarningText>
                  )}
                  <S.ButtonWrapper style={{ marginTop: '16px' }}>
                    <S.CancelButton onClick={() => setIsEditingUserInfo(true)}>
                      수정하기
                    </S.CancelButton>
                  </S.ButtonWrapper>
                </>
              )}
              </S.InputGroup>
              {!isEditingUserInfo && (
                <S.ButtonWrapper>
                  <S.CancelButton onClick={handleBack}>이전</S.CancelButton>
                  <S.SubmitButton 
                    onClick={handleUserInfoNext}
                    disabled={!userInfo.name || !userInfo.birth_date || !userInfo.gender}
                  >
                    다음
                  </S.SubmitButton>
                </S.ButtonWrapper>
              )}
            </>
          ) : currentStep === 'community' ? (
            <S.StepComponent
              title="소속 공동체를 선택해주세요"
              onBack={handleBack}
              onNext={handleCommunityNext}
              nextDisabled={!formData.community}
            >
              <Combobox
                name="community"
                value={formData.community}
                onChange={(value) => handleComboboxChange('community', value)}
                options={[
                  { value: '', label: '-- 공동체 선택 --' },
                  { value: '허브', label: '허브' },
                  { value: '타공동체', label: '타공동체' },
                ]}
                placeholder="-- 공동체 선택 --"
                required
              />
            </S.StepComponent>
          ) : currentStep === 'group' ? (
            <S.StepComponent
              title="소속 그룹을 선택해주세요"
              onBack={handleBack}
              onNext={handleGroupNext}
              nextDisabled={!formData.group_id}
            >
              <Combobox
                name="group_id"
                value={formData.group_id}
                onChange={(value) => handleComboboxChange('group_id', value)}
                options={[
                  { value: '', label: '-- 그룹 선택 --' },
                  ...groups.map(g => ({ value: g.id.toString(), label: g.name })),
                ]}
                placeholder="-- 그룹 선택 --"
                required
              />
            </S.StepComponent>
          ) : (
            <S.StepComponent
              title={formData.community === '타공동체' ? '정보 업데이트 완료' : '소속 다락방을 선택해주세요'}
              onBack={handleBack}
              onSubmit={handleSubmit}
              finalStep={true}
              loading={loading}
              nextDisabled={formData.community === '허브' && !formData.cell_id}
            >
              {formData.community === '타공동체' ? (
                <S.InfoText>
                  타공동체 소속이시군요!<br />
                  그룹/다락방 선택은 생략됩니다.
                </S.InfoText>
              ) : (
                <Combobox
                  name="cell_id"
                  value={formData.cell_id}
                  onChange={(value) => handleComboboxChange('cell_id', value)}
                  options={[
                    { value: '', label: '-- 다락방 선택 --' },
                    ...cells.map(c => ({ value: c.id.toString(), label: c.name })),
                  ]}
                  placeholder="-- 다락방 선택 --"
                  required
                />
              )}
            </S.StepComponent>
          )}
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
        </S.Card>
      </S.Wrapper>
    </PageLayout>
  );
}

