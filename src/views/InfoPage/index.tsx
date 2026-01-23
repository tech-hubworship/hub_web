// 파일 경로: src/views/InfoPage/index.tsx

import React, { useState, useEffect } from 'react';
import PageLayout from "@src/components/common/PageLayout";
import { useRouter } from "next/navigation";
import * as S from "@src/views/InfoPage/style";
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Combobox } from '@src/components/ui/combobox';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- 타입 정의 및 상수 ---
interface ProfileData {
  name: string;
  email: string;
  birth_date: string | null;
  gender: 'M' | 'F' | null;
  community: string | null;
  group_id: number | null;
  cell_id: number | null;
  group_name: string | null;
  cell_name: string | null;
}

interface Group {
  id: number;
  name: string;
}

interface Cell {
  id: number;
  name: string;
}

// --- API 호출 함수 ---
const fetchProfile = async (): Promise<ProfileData> => {
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('프로필 정보 로딩 실패');
  return res.json();
};

// BibleCardPage와 동일한 스타일 컴포넌트
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

  &[type="date"] {
    -webkit-appearance: none;
    appearance: none;
    
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

const CancelButton = styled.button`
  flex: 1;
  padding: 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
  }
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
  }
`;

export default function MyInfoPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { router.push('/login'); },
  });
  const { data: profileData, error, isLoading } = useQuery<ProfileData, Error>({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: fetchProfile,
    enabled: status === 'authenticated',
  });

  const handleLogout = () => signOut({ callbackUrl: '/login' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    community: '',
    group_id: '' as string | number,
    cell_id: '' as string | number,
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [updateError, setUpdateError] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isHub = formData.community === '허브';

  // 그룹 목록 가져오기
  useEffect(() => {
    if (isEditMode) {
      const fetchGroups = async () => {
        try {
          const response = await fetch('/api/signup/groups');
          const data = await response.json();
          if (response.ok) setGroups(data.data || []);
        } catch (err) {
          console.error('그룹 조회 실패:', err);
        }
      };
      fetchGroups();
    }
  }, [isEditMode]);

  // 셀 목록 가져오기
  useEffect(() => {
    if (isEditMode && formData.group_id && formData.community === '허브') {
      const fetchCells = async () => {
        try {
          const response = await fetch(`/api/signup/cells?groupId=${formData.group_id}`);
          const data = await response.json();
          if (response.ok) setCells(data.data || []);
        } catch (err) {
          console.error('셀 조회 실패:', err);
        }
      };
      fetchCells();
    } else {
      setCells([]);
    }
  }, [formData.group_id, formData.community, isEditMode]);

  // 편집 모드 시작
  const handleEditClick = () => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        birth_date: profileData.birth_date || '',
        community: profileData.community || '',
        group_id: profileData.group_id || '',
        cell_id: profileData.cell_id || '',
      });
      setIsEditMode(true);
      setUpdateError('');
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setUpdateError('');
    setFormData({
      name: '',
      birth_date: '',
      community: '',
      group_id: '',
      cell_id: '',
    });
  };

  // 저장
  const handleSave = async () => {
    setLoading(true);
    setUpdateError('');

    try {
      const updateData: any = {
        name: formData.name,
        birth_date: formData.birth_date,
        community: formData.community,
      };

      if (formData.community === '타공동체') {
        updateData.group_id = null;
        updateData.cell_id = null;
      } else {
        updateData.group_id = formData.group_id ? parseInt(formData.group_id.toString()) : null;
        updateData.cell_id = formData.cell_id ? parseInt(formData.cell_id.toString()) : null;
      }

      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '업데이트 실패');

      alert('정보가 성공적으로 업데이트되었습니다.');
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsEditMode(false);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 이름에서 첫 글자 추출
  const getInitial = (name: string) => {
    return name ? name.charAt(0) : 'U';
  };

  const getGenderText = (gender: 'M' | 'F' | null) => {
    if (gender === 'M') return '남성';
    if (gender === 'F') return '여성';
    return '-';
  };

  if (isLoading) {
    return (
      <PageLayout>
        <S.LoadingText>정보를 불러오는 중...</S.LoadingText>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <S.Wrapper>
        {/* 헤더 섹션 */}
        <S.HeaderSection>
          <S.HeaderContent>
            <S.UserInfo>
              <S.Avatar>
                {getInitial(profileData?.name || '')}
              </S.Avatar>
              <S.UserDetails>
                <S.UserName>{profileData?.name || '사용자'}</S.UserName>
                <S.UserSubtitle>내 정보 보기</S.UserSubtitle>
              </S.UserDetails>
            </S.UserInfo>
          </S.HeaderContent>
        </S.HeaderSection>

        <S.Content>
          {(error) && <S.ErrorMessage>{error?.message}</S.ErrorMessage>}
          
          {profileData && !isEditMode && (
            <>
              {/* 기본 정보 카드 */}
              <S.Card>
                <S.CardHeader>
                  <S.CardTitle>기본 정보</S.CardTitle>
                  <S.CardAction onClick={handleEditClick}>
                    수정하기
                  </S.CardAction>
                </S.CardHeader>
                <S.InfoItem>
                  <S.InfoLabel>이름</S.InfoLabel>
                  <S.InfoValue>{profileData.name || '-'}</S.InfoValue>
                </S.InfoItem>
                <S.InfoItem>
                  <S.InfoLabel>이메일</S.InfoLabel>
                  <S.InfoValue>{profileData.email || '-'}</S.InfoValue>
                </S.InfoItem>
                <S.InfoItem>
                  <S.InfoLabel>생년월일</S.InfoLabel>
                  <S.InfoValue>{profileData.birth_date || '-'}</S.InfoValue>
                </S.InfoItem>
                <S.InfoItem>
                  <S.InfoLabel>성별</S.InfoLabel>
                  <S.InfoValue>{getGenderText(profileData.gender)}</S.InfoValue>
                </S.InfoItem>
                <S.InfoItem>
                  <S.InfoLabel>공동체</S.InfoLabel>
                  <S.InfoValue>{profileData.community || '-'}</S.InfoValue>
                </S.InfoItem>
                {profileData.group_name && (
                  <S.InfoItem>
                    <S.InfoLabel>소속 그룹</S.InfoLabel>
                    <S.InfoValue>{profileData.group_name}</S.InfoValue>
                  </S.InfoItem>
                )}
                {profileData.cell_name && (
                  <S.InfoItem>
                    <S.InfoLabel>소속 다락방</S.InfoLabel>
                    <S.InfoValue>{profileData.cell_name}</S.InfoValue>
                  </S.InfoItem>
                )}
              </S.Card>

              <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
            </>
          )}

          {profileData && isEditMode && (
            <S.Card>
              <StepContent>
                <StepTitle>내 정보 수정</StepTitle>
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
                    required
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
                  <Label>공동체 *</Label>
                  <Combobox
                    value={formData.community}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      community: value,
                      group_id: '',
                      cell_id: '',
                    }))}
                    options={[
                      { value: '', label: '선택하세요' },
                      { value: '허브', label: '허브' },
                      { value: '타공동체', label: '타공동체' },
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

                {updateError && <S.ErrorMessage>{updateError}</S.ErrorMessage>}

                <ButtonGroup>
                  <CancelButton onClick={handleCancelEdit}>
                    취소
                  </CancelButton>
                  <SaveButton onClick={handleSave} disabled={loading}>
                    {loading ? '저장 중...' : '저장'}
                  </SaveButton>
                </ButtonGroup>
              </StepContent>
            </S.Card>
          )}
        </S.Content>
      </S.Wrapper>
    </PageLayout>
  );
}
