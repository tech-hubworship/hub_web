// 파일 경로: src/views/BibleCardPage/index.tsx
// 말씀카드 신청 페이지

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Header } from '@src/components/Header';
import Footer from '@src/components/Footer';
import { Combobox } from '@src/components/ui/combobox';

interface Group {
  id: number;
  name: string;
}

interface Cell {
  id: number;
  name: string;
}

interface Profile {
  name: string;
  community: string | null;
  group_id: number | null;
  cell_id: number | null;
  group_name?: string;
  cell_name?: string;
  birth_date?: string;
  gender?: string;
}

const COMMUNITIES = ['허브', '타공동체'];

export default function BibleCardApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? '';
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 상태
  const [isPrayerEditMode, setIsPrayerEditMode] = useState(false); // 기도제목 수정 모드 상태
  const [prayerRequest, setPrayerRequest] = useState(''); // 기도제목 수정용 상태
  const [isApplicationClosed, setIsApplicationClosed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: '',
    community: '',
    group_id: '' as string | number,
    cell_id: '' as string | number,
    prayer_request: '',
  });

  // 신청 종료 (2025년 12월 15일 이후 신청 마감)
  useEffect(() => {
    setIsApplicationClosed(true);
  }, []);

  // 내 신청 정보 조회
  const { data: myApplication, isLoading } = useQuery({
    queryKey: ['my-bible-card'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/my-application');
      if (!response.ok) throw new Error('조회 실패');
      return response.json();
    },
    enabled: status === 'authenticated',
  });

  // 프로필 정보 조회 (신청 내역이 없을 때)
  const { data: profileData } = useQuery<Profile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('프로필 조회 실패');
      const data = await response.json();
      return {
        name: data.name,
        community: data.community,
        group_id: data.group_id,
        cell_id: data.cell_id,
        group_name: data.group_name,
        cell_name: data.cell_name,
        birth_date: data.birth_date,
        gender: data.gender,
      };
    },
    enabled: status === 'authenticated' && !myApplication?.hasApplication,
  });

  // 허브인 경우에만 그룹 목록 조회
  const isHub = formData.community === '허브';
  
  const { data: groups } = useQuery<Group[]>({
    queryKey: ['signup-groups'],
    queryFn: async () => {
      const response = await fetch('/api/signup/groups');
      if (!response.ok) throw new Error('그룹 조회 실패');
      const result = await response.json();
      return result.data || [];
    },
    enabled: status === 'authenticated' && isHub && isEditMode,
  });

  // 다락방 목록 조회
  const { data: cells } = useQuery<Cell[]>({
    queryKey: ['signup-cells', formData.group_id],
    queryFn: async () => {
      const response = await fetch(`/api/signup/cells?groupId=${formData.group_id}`);
      if (!response.ok) throw new Error('다락방 조회 실패');
      const result = await response.json();
      return result.data || [];
    },
    enabled: status === 'authenticated' && isHub && !!formData.group_id && isEditMode,
  });

  // 신청 뮤테이션
  const applyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // 타공동체면 group_id, cell_id를 null로
      const submitData = {
        ...data,
        group_id: data.community === '타공동체' ? null : data.group_id || null,
        cell_id: data.community === '타공동체' ? null : data.cell_id || null,
      };
      const response = await fetch('/api/bible-card/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '신청 실패');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bible-card'] });
      setCurrentStep(3);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 기도제목 수정 뮤테이션
  const updatePrayerMutation = useMutation({
    mutationFn: async (prayer: string) => {
      const response = await fetch('/api/bible-card/update-prayer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayer_request: prayer }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '수정 실패');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bible-card'] });
      setIsPrayerEditMode(false);
      alert('기도제목이 수정되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 프로필 정보로 폼 초기화
  useEffect(() => {
    if (profileData && !myApplication?.hasApplication) {
      setFormData(prev => ({
        ...prev,
        name: profileData.name || '',
        birth_date: profileData.birth_date || '',
        gender: profileData.gender || '',
        community: profileData.community || '',
        group_id: profileData.group_id || '',
        cell_id: profileData.cell_id || '',
      }));
    }
  }, [profileData, myApplication?.hasApplication]);

  // 타공동체 선택 시 그룹/다락방 초기화
  useEffect(() => {
    if (formData.community === '타공동체') {
      setFormData(prev => ({
        ...prev,
        group_id: '',
        cell_id: '',
      }));
    }
  }, [formData.community]);

  // 로그인 체크
  useEffect(() => {
    if (status === 'unauthenticated') {
      const currentPath =
        pathname + (searchString ? `?${searchString}` : '');
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath || '/bible-card')}`;
    }
  }, [status, pathname, searchString]);

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header />
        <Container>
          <ContentWrapper>
            <LoadingContainer>
              <Spinner />
              <LoadingText>로딩 중...</LoadingText>
            </LoadingContainer>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }

  // 신청 종료 화면 (신청하지 않은 사용자에게 표시)
  if (isApplicationClosed && !myApplication?.hasApplication) {
    return (
      <>
        <Header />
        <Container>
          <ContentWrapper>
            <Card>
              <CardHeader>
                <Title>📜 말씀카드 신청</Title>
              </CardHeader>
              <ClosedMessage>
                <ClosedIcon>⏰</ClosedIcon>
                <ClosedTitle>신청종료</ClosedTitle>
                <ClosedDescription>
                  말씀카드 신청 기간이 지났습니다.<br />
                  이미 신청하신 분들은 2026년 1월 1일부터<br />
                  말씀카드를 다운로드하실 수 있습니다.
                </ClosedDescription>
                {myApplication?.hasApplication && (
                  <CompleteButton onClick={() => router.push('/bible-card/download')}>
                    내 말씀카드 보기 →
                  </CompleteButton>
                )}
              </ClosedMessage>
            </Card>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }

  // 이미 신청한 경우 - 조회 모드
  if (myApplication?.hasApplication) {
    const app = myApplication.application;
    const canEditPrayer = app.status === 'pending'; // pending 상태일 때만 수정 가능
    
    // 기도제목 수정 모드 진입 시 초기값 설정
    const handleStartEditPrayer = () => {
      setPrayerRequest(app.prayer_request);
      setIsPrayerEditMode(true);
    };

    // 기도제목 수정 취소
    const handleCancelEditPrayer = () => {
      setIsPrayerEditMode(false);
      setPrayerRequest('');
    };

    // 기도제목 수정 저장
    const handleSavePrayer = () => {
      if (!prayerRequest.trim()) {
        alert('기도제목을 입력해주세요.');
        return;
      }
      if (prayerRequest.length > 1000) {
        alert('기도제목은 1000자 이내로 작성해주세요.');
        return;
      }
      updatePrayerMutation.mutate(prayerRequest);
    };

    return (
      <>
        <Header />
        <Container>
          <ContentWrapper>
            <Card>
              <CardHeader>
                <Title>📜 말씀카드 신청 완료</Title>
              </CardHeader>

              <CompleteMessage>
                <CompleteText>
                  말씀카드 신청이 완료되었습니다.
                </CompleteText>
              </CompleteMessage>

              <InfoSection>
                <InfoRow>
                  <InfoLabel>이름</InfoLabel>
                  <InfoValue>{app.name}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>공동체</InfoLabel>
                  <InfoValue>{app.community || '-'}</InfoValue>
                </InfoRow>
                {app.community === '허브' && (
                  <InfoRow>
                    <InfoLabel>그룹/다락방</InfoLabel>
                    <InfoValue>
                      {app.group_name && app.cell_name 
                        ? `${app.group_name} / ${app.cell_name}`
                        : app.group_name || app.cell_name || '-'}
                    </InfoValue>
                  </InfoRow>
                )}
                <InfoRow>
                  <InfoLabel>신청일</InfoLabel>
                  <InfoValue>
                    {new Date(app.created_at).toLocaleDateString('ko-KR')}
                  </InfoValue>
                </InfoRow>
              </InfoSection>

              <PrayerSection>
                <PrayerHeader>
                  <PrayerLabel>📖 나의 기도제목</PrayerLabel>
                  {canEditPrayer && !isPrayerEditMode && (
                    <EditPrayerButton onClick={handleStartEditPrayer}>
                      ✏️ 수정
                    </EditPrayerButton>
                  )}
                </PrayerHeader>
                {isPrayerEditMode ? (
                  <>
                    <Textarea
                      value={prayerRequest}
                      onChange={(e) => setPrayerRequest(e.target.value)}
                      placeholder="기도제목을 작성해주세요..."
                      rows={6}
                    />
                    <CharCount>{prayerRequest.length}/1000</CharCount>
                    <PrayerButtonGroup>
                      <CancelButton onClick={handleCancelEditPrayer}>
                        취소
                      </CancelButton>
                      <NextButton 
                        onClick={handleSavePrayer}
                        disabled={updatePrayerMutation.isPending}
                      >
                        {updatePrayerMutation.isPending ? '저장 중...' : '저장'}
                      </NextButton>
                    </PrayerButtonGroup>
                  </>
                ) : (
                  <PrayerContent>{app.prayer_request}</PrayerContent>
                )}
              </PrayerSection>
            </Card>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }

  // 신청 폼
  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        alert('이름을 입력해주세요.');
        return;
      }
      if (!formData.community) {
        alert('공동체를 선택해주세요.');
        return;
      }
      setCurrentStep(2);
      setIsEditMode(false); // 다음 스텝으로 가면 수정모드 해제
    } else if (currentStep === 2) {
      if (!formData.prayer_request.trim()) {
        alert('기도제목을 입력해주세요.');
        return;
      }
      applyMutation.mutate(formData);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // 원래 프로필 데이터로 복원
    if (profileData) {
      setFormData(prev => ({
        ...prev,
        name: profileData.name || '',
        birth_date: profileData.birth_date || '',
        gender: profileData.gender || '',
        community: profileData.community || '',
        group_id: profileData.group_id || '',
        cell_id: profileData.cell_id || '',
      }));
    }
    setIsEditMode(false);
  };

  return (
    <>
      <Header />
      <Container>
        <ContentWrapper>
          <Card>
            <CardHeader>
              <Title>📜 말씀카드 신청</Title>
              <StepIndicator>
                <Step active={currentStep >= 1} completed={currentStep > 1}>1</Step>
                <StepLine active={currentStep > 1} />
                <Step active={currentStep >= 2} completed={currentStep > 2}>2</Step>
                <StepLine active={currentStep > 2} />
                <Step active={currentStep >= 3} completed={currentStep > 3}>3</Step>
              </StepIndicator>
            </CardHeader>

            {currentStep === 1 && !isEditMode && (
              <StepContent>
                <StepTitle>Step 1. 내 정보 확인</StepTitle>
                <StepDescription>
                  아래 정보가 맞는지 확인해주세요.
                </StepDescription>

                <InfoSection>
                  <InfoRow>
                    <InfoLabel>이름</InfoLabel>
                    <InfoValue>{formData.name || '-'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>생년월일</InfoLabel>
                    <InfoValue>{profileData?.birth_date || '-'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>성별</InfoLabel>
                    <InfoValue>{profileData?.gender === 'M' ? '남성' : profileData?.gender === 'F' ? '여성' : '-'}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>공동체</InfoLabel>
                    <InfoValue>{formData.community || '-'}</InfoValue>
                  </InfoRow>
                  {formData.community === '허브' && (
                    <>
                      <InfoRow>
                        <InfoLabel>그룹</InfoLabel>
                        <InfoValue>{profileData?.group_name || '-'}</InfoValue>
                      </InfoRow>
                      <InfoRow>
                        <InfoLabel>다락방</InfoLabel>
                        <InfoValue>{profileData?.cell_name || '-'}</InfoValue>
                      </InfoRow>
                    </>
                  )}
                </InfoSection>

                <ButtonGroup>
                  <EditButton onClick={handleEditClick}>
                    ✏️ 정보 수정하기
                  </EditButton>
                  <NextButton onClick={handleNext}>
                    정보가 맞아요 →
                  </NextButton>
                </ButtonGroup>
              </StepContent>
            )}

            {currentStep === 1 && isEditMode && (
              <StepContent>
                <StepTitle>Step 1. 내 정보 수정</StepTitle>
                <StepDescription>
                  수정된 정보는 프로필에도 반영됩니다.
                </StepDescription>

                <FormGroup>
                  <Label>이름 *</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="이름을 입력하세요"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>생년월일</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>성별</Label>
                  <Combobox
                    value={formData.gender}
                    onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    options={[
                      { value: '', label: '선택하세요' },
                      { value: 'M', label: '남성' },
                      { value: 'F', label: '여성' },
                    ]}
                    placeholder="선택하세요"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>공동체 *</Label>
                  <Combobox
                    value={formData.community}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      community: value,
                    }))}
                    options={[
                      { value: '', label: '선택하세요' },
                      ...COMMUNITIES.map(c => ({ value: c, label: c })),
                    ]}
                    placeholder="선택하세요"
                    required
                  />
                </FormGroup>

                {isHub && (
                  <>
                    <FormGroup>
                      <Label>그룹</Label>
                      <Combobox
                        value={formData.group_id?.toString() || ''}
                        onChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          group_id: value ? parseInt(value) : '',
                          cell_id: '',
                        }))}
                        options={[
                          { value: '', label: '선택하세요' },
                          ...(groups || []).map(g => ({ value: g.id.toString(), label: g.name })),
                        ]}
                        placeholder="선택하세요"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>다락방</Label>
                      <Combobox
                        value={formData.cell_id?.toString() || ''}
                        onChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          cell_id: value ? parseInt(value) : '',
                        }))}
                        options={[
                          { value: '', label: '선택하세요' },
                          ...(cells || []).map(c => ({ value: c.id.toString(), label: c.name })),
                        ]}
                        placeholder="선택하세요"
                        disabled={!formData.group_id}
                      />
                    </FormGroup>
                  </>
                )}

                {formData.community === '타공동체' && (
                  <InfoNote>
                    타공동체 소속이시군요! 그룹/다락방 선택은 생략됩니다.
                  </InfoNote>
                )}

                <ButtonGroup>
                  <CancelButton onClick={handleCancelEdit}>
                    취소
                  </CancelButton>
                  <NextButton onClick={handleNext}>
                    다음 →
                  </NextButton>
                </ButtonGroup>
              </StepContent>
            )}

            {currentStep === 2 && (
              <StepContent>
                <StepTitle>Step 2. 기도제목 작성</StepTitle>
                <StepDescription>
                  목회자님께서 말씀을 준비하실 때 참고하실 기도제목을 작성해주세요.
                </StepDescription>

                <FormGroup>
                  <Label>기도제목 *</Label>
                  <Textarea
                    value={formData.prayer_request}
                    onChange={(e) => setFormData(prev => ({ ...prev, prayer_request: e.target.value }))}
                    placeholder="기도제목을 작성해주세요..."
                    rows={6}
                  />
                  <CharCount>{formData.prayer_request.length}/1000</CharCount>
                </FormGroup>

                <ButtonGroup>
                  <PrevButton onClick={handlePrev}>
                    이전
                  </PrevButton>
                  <NextButton 
                    onClick={handleNext}
                    disabled={applyMutation.isPending}
                  >
                    {applyMutation.isPending ? '저장 중...' : '제출하기'}
                  </NextButton>
                </ButtonGroup>
              </StepContent>
            )}

            {currentStep === 3 && (
              <StepContent>
                <CompleteIcon>🎉</CompleteIcon>
                <StepTitle>신청이 완료되었습니다!</StepTitle>
                <StepDescription>
                  목회자님께서 말씀을 준비해주시면<br />
                  알림을 통해 안내드리겠습니다.
                </StepDescription>
                <CompleteButton onClick={() => window.location.reload()}>
                  신청 내역 확인하기
                </CompleteButton>
              </StepContent>
            )}
          </Card>
        </ContentWrapper>
      </Container>
      <Footer />
    </>
  );
}

// Styled Components
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ==================== Container & Wrapper ====================
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 80px 0 40px;

  @media (max-width: 768px) {
    padding: 70px 0 32px;
  }

  @media (max-width: 480px) {
    padding: 60px 0 24px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 20px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }

  @media (max-width: 480px) {
    padding: 16px 12px;
    max-width: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 20px;

  @media (max-width: 480px) {
    min-height: 300px;
    border-radius: 16px;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 32px;
  animation: ${fadeIn} 0.5s ease;
  box-sizing: border-box;
  width: 100%;
  position: relative;

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 18px;
  }

  @media (max-width: 480px) {
    padding: 24px 16px;
    border-radius: 16px;
    min-width: 0;
  }
`;

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;

  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px 0;

  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 18px;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const Step = styled.div<{ active: boolean; completed: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  background: ${props => props.completed ? '#707070' : props.active ? '#161616' : '#e2e8f0'};
  color: ${props => props.active || props.completed ? 'white' : '#94a3b8'};

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }
`;

const StepLine = styled.div<{ active: boolean }>`
  width: 40px;
  height: 3px;
  background: ${props => props.active ? '#707070' : '#e2e8f0'};
  border-radius: 2px;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    width: 30px;
  }
`;

const StepContent = styled.div`
  animation: ${fadeIn} 0.3s ease;
`;

const StepTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const StepDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.6;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 20px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
  position: relative;

  @media (max-width: 480px) {
    margin-bottom: 16px;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 6px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s ease;
  box-sizing: border-box;
  max-width: 100%;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }

  /* date input 모바일 스타일 개선 */
  &[type="date"] {
    -webkit-appearance: none;
    appearance: none;
    
    /* iOS Safari에서 date input이 영역을 벗어나지 않도록 */
    &::-webkit-calendar-picker-indicator {
      margin-left: auto;
      padding: 0;
      cursor: pointer;
    }
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 16px;
    border-radius: 10px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    
    /* 모바일에서 date input이 컨테이너를 벗어나지 않도록 */
    &[type="date"] {
      padding-right: 12px;
      
      &::-webkit-calendar-picker-indicator {
        width: 20px;
        height: 20px;
        margin-left: auto;
      }
    }
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 16px;
    border-radius: 10px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  resize: vertical;
  min-height: 150px;
  font-family: inherit;
  line-height: 1.6;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 16px;
    border-radius: 10px;
    min-height: 120px;
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
`;

const InfoNote = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    font-size: 13px;
    padding: 10px 14px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;

  @media (max-width: 480px) {
    gap: 10px;
    margin-top: 20px;
    flex-direction: column;
  }
`;

const EditButton = styled.button`
  flex: 1;
  padding: 16px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #64748b;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
    border-radius: 10px;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 16px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #64748b;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
    border-radius: 10px;
  }
`;

const PrevButton = styled.button`
  flex: 1;
  padding: 16px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #64748b;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
    border-radius: 10px;
  }
`;

const NextButton = styled.button`
  flex: 2;
  padding: 16px;
  border: none;
  background: #FF1515;
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(255, 21, 21, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    flex: 1;
    padding: 14px;
    font-size: 15px;
    border-radius: 10px;
  }
`;

const CompleteIcon = styled.div`
  font-size: 64px;
  text-align: center;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    font-size: 48px;
    margin-bottom: 12px;
  }
`;

const CompleteButton = styled.button`
  width: 100%;
  padding: 16px;
  border: none;
  background: #FF1515;
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(255, 21, 21, 0.4);
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
    border-radius: 10px;
    margin-top: 20px;
  }
`;

// 조회 모드 스타일
const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: ${props => {
    switch(props.status) {
      case 'pending': return '#fef3c7';
      case 'assigned': return '#dbeafe';
      case 'completed': return '#d1fae5';
      case 'delivered': return '#e0e7ff';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'pending': return '#92400e';
      case 'assigned': return '#1e40af';
      case 'completed': return '#065f46';
      case 'delivered': return '#4338ca';
      default: return '#475569';
    }
  }};

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 13px;
  }
`;

const CompleteMessage = styled.div`
  text-align: center;
  padding: 32px 20px;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    padding: 24px 16px;
    margin-bottom: 20px;
  }
`;

const CompleteText = styled.p`
  font-size: 15px;
  color: #64748b;
  line-height: 1.8;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 1.7;
  }
`;

const InfoSection = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 16px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 14px 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 480px) {
    padding: 12px 0;
    gap: 24px;
  }
`;

const InfoLabel = styled.span`
  color: #64748b;
  font-size: 15px;
  min-width: 80px;
  text-align: right;
  flex-shrink: 0;

  @media (max-width: 480px) {
    font-size: 14px;
    min-width: 65px;
  }
`;

const InfoValue = styled.span`
  color: #1e293b;
  font-weight: 600;
  font-size: 18px;
  min-width: 100px;

  @media (max-width: 480px) {
    font-size: 16px;
    min-width: 80px;
  }
`;

const PrayerSection = styled.div`
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 16px;
  }
`;

const PrayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  @media (max-width: 480px) {
    margin-bottom: 10px;
  }
`;

const PrayerLabel = styled.div`
  font-weight: 600;
  color: #92400e;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const EditPrayerButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #92400e;
  background: white;
  color: #92400e;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #92400e;
    color: white;
  }

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

const PrayerContent = styled.div`
  color: #78350f;
  line-height: 1.7;
  white-space: pre-wrap;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    line-height: 1.6;
  }
`;

const PrayerButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;

  @media (max-width: 480px) {
    gap: 10px;
    margin-top: 12px;
    flex-direction: column;
  }
`;

const DownloadLinkSection = styled.div`
  margin-top: 20px;
`;

const DownloadLinkButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 14px;
    border-radius: 10px;
  }
`;

const BibleSection = styled.div`
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 16px;
  }
`;

const BibleLabel = styled.div`
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const BibleReference = styled.div`
  font-size: 14px;
  color: #3b82f6;
  margin-bottom: 12px;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 10px;
  }
`;

const BibleContent = styled.div`
  color: #1e3a8a;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 1.7;
  }
`;

const PastorMessage = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(59, 130, 246, 0.3);
  color: #1e3a8a;
  line-height: 1.7;
  font-size: 14px;
  white-space: pre-wrap;

  @media (max-width: 480px) {
    margin-top: 12px;
    padding-top: 12px;
    font-size: 13px;
  }
`;

const MessageLabel = styled.div`
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 13px;

  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`;

const DownloadSection = styled.div`
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 12px;
  padding: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 10px;
  }
`;

const DownloadLabel = styled.div`
  font-weight: 600;
  color: #065f46;
  margin-bottom: 16px;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 12px;
  }
`;

const DownloadButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const DownloadButton = styled.a`
  display: block;
  padding: 14px;
  background: white;
  color: #059669;
  text-align: center;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    background: #059669;
    color: white;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    padding: 12px;
    font-size: 13px;
    border-radius: 8px;
  }
`;

const ClosedMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  @media (max-width: 480px) {
    padding: 40px 16px;
    gap: 16px;
  }
`;

const ClosedIcon = styled.div`
  font-size: 64px;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    font-size: 48px;
  }
`;

const ClosedTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const ClosedDescription = styled.p`
  font-size: 15px;
  color: #64748b;
  line-height: 1.8;
  margin: 0;
  max-width: 500px;

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 1.7;
  }
`;
