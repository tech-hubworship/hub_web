import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@src/components/common/PageLayout';
import * as S from './style';
import { Combobox } from '@src/components/ui/combobox';

// MC 그룹 id (hub_groups 의 'MC' 그룹, id=99). MC 그룹을 고르면 곧바로 MC 인증(암호)로 진행한다.
const MC_GROUP_ID = '99';
const MC_CELL_ID = '99'; // MC 그룹의 'MC' 다락방

// 해당없음 그룹/다락방: 그룹이 해당없음이면 다락방도 자동으로 해당없음
const NONE_GROUP_ID = '7';
const NONE_CELL_ID = '26';

// 그룹장/교역자(직분)를 고를 수 있는 일반 그룹들 (사랑/믿음/소망/링크/새가족/실타)
const LEADERSHIP_GROUP_IDS = ['1', '2', '3', '4', '5', '6'];

export default function UpdatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  // force=1 이면 이미 소속이 있어도 그룹/다락방을 다시 입력받는다 (리더십 링크 등에서 사용)
  const force = searchParams?.get('force') === '1';

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
  // 그룹 선택 후 직분 선택.
  //  - 다락방원: 다락방 선택 단계로
  //  - 그룹장/교역자/MC: 다락방 없이 암호 입력 단계로 (아무나 못 하도록 서버에서 암호 검증)
  const [leaderRole, setLeaderRole] = useState<
    '일반' | '그룹장' | '목회자' | 'MC' | ''
  >('');
  // 리더십 암호 (서버에서 .env 값과 대조)
  const [leaderPassword, setLeaderPassword] = useState('');
  // 다락방이 없는 직분(그룹장/교역자/MC)인지 여부
  const isLeaderSelected =
    leaderRole === '그룹장' || leaderRole === '목회자' || leaderRole === 'MC';
  const [groups, setGroups] = useState<{id: number, name: string}[]>([]);
  const [cells, setCells] = useState<{id: number, name: string}[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'userInfo' | 'community' | 'group' | 'role' | 'cell' | 'password'
  >('userInfo');

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
          // 그룹장/교역자처럼 리더십은 다락방(cell_id)이 없어도 소속 완료로 본다.
          const isLeadership =
            profile.responsible_group_id != null ||
            profile.responsible_cell_id != null ||
            (profile.roles?.length ?? 0) > 0;
          const hasEmptyGroupCell =
            !profile.group_id || (!profile.cell_id && !isLeadership);

          // force 모드가 아니면 기존 쫓아내기 규칙 적용.
          // force=1 이면 소속이 이미 있어도 재입력을 허용한다.
          if (!force) {
            if (!isAdmin && (!isHubActive || !hasEmptyGroupCell)) {
              router.replace('/myinfo');
              return;
            }

            // 관리자는 그룹/셀이 비어있을 때만 업데이트 가능
            if (isAdmin && !hasEmptyGroupCell) {
              router.replace('/myinfo');
              return;
            }
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
  }, [session, status, router, force]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComboboxChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    
    // 커뮤니티가 변경되면 그룹/셀/직분 초기화
    if (name === 'community') {
      newFormData.group_id = '';
      newFormData.cell_id = '';
      setLeaderRole('');
      setLeaderPassword('');
    }
    // 그룹이 변경되면 셀/직분 초기화.
    //  - MC(99)   → 직분 MC 자동, 다락방 MC(99) 자동
    //  - 해당없음(7) → 다락방 해당없음(26) 자동
    //  - 그 외      → 다락방 비움
    if (name === 'group_id') {
      setLeaderPassword('');
      setLeaderRole(value === MC_GROUP_ID ? 'MC' : '');
      if (value === MC_GROUP_ID) newFormData.cell_id = MC_CELL_ID;
      else if (value === NONE_GROUP_ID) newFormData.cell_id = NONE_CELL_ID;
      else newFormData.cell_id = '';
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
    if (!formData.group_id) return;
    if (formData.group_id === MC_GROUP_ID) {
      // MC: 암호 인증 단계로
      setCurrentStep('password');
    } else if (LEADERSHIP_GROUP_IDS.includes(formData.group_id)) {
      // 사랑/믿음/소망/링크/새가족/실타: 직분 선택 단계로
      setCurrentStep('role');
    } else {
      // 해당없음 및 그 외: 다락방 단계로 (해당없음은 자동 지정됨)
      setCurrentStep('cell');
    }
  };

  const handleRoleNext = () => {
    // 그룹장/교역자 → 암호 입력 단계, 다락방원 → 다락방 선택 단계
    if (leaderRole === '그룹장' || leaderRole === '목회자') {
      setCurrentStep('password');
    } else {
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
    if (currentStep === 'password') {
      // MC 는 그룹에서 바로 왔으므로 그룹으로, 그 외(그룹장/교역자)는 직분 선택으로
      if (formData.group_id === MC_GROUP_ID) {
        setCurrentStep('group');
      } else {
        setCurrentStep('role');
      }
    } else if (currentStep === 'cell') {
      if (formData.community === '타공동체') {
        setCurrentStep('community');
      } else if (LEADERSHIP_GROUP_IDS.includes(formData.group_id)) {
        // 리더십 그룹에서 '다락방 선택하기'로 온 경우 → 직분 선택으로
        setCurrentStep('role');
      } else {
        // 해당없음/그 외 그룹 → 그룹으로
        setCurrentStep('group');
      }
    } else if (currentStep === 'role') {
      setCurrentStep('group');
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
      let response: Response;

      // 그룹장/교역자/MC인 경우: 암호 검증 API로 보내 직분/담당그룹을 등록한다.
      if (formData.community === '허브' && isLeaderSelected) {
        if (!leaderRole) {
          setError('직분(그룹장/교역자/MC)을 선택해주세요.');
          setLoading(false);
          return;
        }
        if (!leaderPassword) {
          setError('암호를 입력해주세요.');
          setLoading(false);
          return;
        }
        response = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: leaderRole, // '그룹장' | '목회자' | 'MC'
            password: leaderPassword,
            // 서버는 group_id/cell_id 로 profiles 소속을 저장하고,
            // responsible_group_id 로 담당 그룹(group_leader_id/pastor_id)을 연결한다.
            // - MC: 다락방도 MC(99)로 저장, 담당 그룹 연결은 없음
            // - 그룹장/교역자: 다락방 없음, 담당 그룹 연결
            group_id: formData.group_id,
            cell_id: leaderRole === 'MC' ? MC_CELL_ID : null,
            responsible_group_id:
              leaderRole === 'MC' ? undefined : formData.group_id,
          }),
        });
      } else {
        // 일반 사용자: 기존대로 소속만 업데이트
        response = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            community: formData.community,
            group_id: formData.community === '타공동체' ? null : formData.group_id,
            cell_id: formData.community === '타공동체' ? null : formData.cell_id,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error);

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
                  // MC 그룹(id=99)을 고르면 MC 인증으로 진행. 이름의 앞뒤 공백은 정리해 표시.
                  ...groups.map((g) => ({
                    value: g.id.toString(),
                    label: g.name.trim(),
                  })),
                ]}
                placeholder="-- 그룹 선택 --"
                required
              />
            </S.StepComponent>
          ) : currentStep === 'role' ? (
            <S.StepComponent
              title="직분을 선택해주세요"
              onBack={handleBack}
              onNext={handleRoleNext}
              nextDisabled={!leaderRole}
            >
              <S.InfoText style={{ marginBottom: 12 }}>
                일반 순원은 다락방을 선택하고, 그룹장·교역자는 담당 그룹 인증을
                진행해요.
              </S.InfoText>
              <Combobox
                name="leader_role"
                value={leaderRole}
                onChange={(value) =>
                  setLeaderRole(value as '일반' | '그룹장' | '목회자' | '')
                }
                options={[
                  { value: '', label: '-- 선택 --' },
                  { value: '일반', label: '다락방 선택하기' },
                  { value: '그룹장', label: '그룹장' },
                  { value: '목회자', label: '교역자(목회자)' },
                ]}
                placeholder="-- 선택 --"
                required
              />
            </S.StepComponent>
          ) : currentStep === 'password' ? (
            <S.StepComponent
              title={leaderRole === 'MC' ? 'MC 인증' : '리더십 인증'}
              onBack={handleBack}
              onSubmit={handleSubmit}
              finalStep={true}
              loading={loading}
              nextDisabled={!leaderPassword}
            >
              <S.InfoText style={{ marginBottom: 12 }}>
                {leaderRole === 'MC'
                  ? 'MC 암호를 입력해주세요.'
                  : `${
                      leaderRole === '목회자' ? '교역자' : leaderRole
                    } 암호를 입력해주세요.`}
              </S.InfoText>
              <S.Label>암호</S.Label>
              <S.Input
                type="password"
                name="leader_password"
                value={leaderPassword}
                onChange={(e) => setLeaderPassword(e.target.value)}
                placeholder="암호를 입력하세요"
                autoComplete="off"
                autoFocus
              />
            </S.StepComponent>
          ) : (
            <S.StepComponent
              title={
                formData.community === '타공동체'
                  ? '정보 업데이트 완료'
                  : formData.group_id === NONE_GROUP_ID
                  ? '정보 업데이트 완료'
                  : '소속 다락방을 선택해주세요'
              }
              onBack={handleBack}
              onSubmit={handleSubmit}
              finalStep={true}
              loading={loading}
              nextDisabled={
                formData.community === '허브' &&
                formData.group_id !== NONE_GROUP_ID &&
                !formData.cell_id
              }
            >
              {formData.community === '타공동체' ? (
                <S.InfoText>
                  타공동체 소속이시군요!<br />
                  그룹/다락방 선택은 생략됩니다.
                </S.InfoText>
              ) : formData.group_id === NONE_GROUP_ID ? (
                <S.InfoText>
                  해당없음 그룹은 다락방도 자동으로 해당없음으로 처리됩니다.
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

