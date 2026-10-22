// 파일 경로: src/views/InfoPage/index.tsx

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  // 리더십(OD 명단) 여부 판정용 — /api/user/profile 응답에 포함됨
  is_sunjang?: boolean;
  responsible_group_id?: number | null;
  responsible_cell_id?: number | null;
  roles?: string[];
}

interface Group {
  id: number;
  name: string;
}

interface Cell {
  id: number;
  name: string;
}

// MC 그룹 id (hub_groups 의 'MC' 그룹). 이 그룹을 고르면 MC 인증(암호)로 진행한다.
const MC_GROUP_ID = '99';
const MC_CELL_ID = '99'; // MC 그룹의 'MC' 다락방

// 해당없음 그룹/다락방: 그룹이 해당없음이면 다락방도 자동으로 해당없음
const NONE_GROUP_ID = '7';
const NONE_CELL_ID = '26';

// 그룹장/교역자(직분)를 고를 수 있는 일반 그룹들 (사랑/믿음/소망/링크/새가족/실타)
const LEADERSHIP_GROUP_IDS = ['1', '2', '3', '4', '5', '6'];

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

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const WithdrawButton = styled.button`
  width: 100%;
  height: 48px;
  background-color: white;
  border: 1px solid #ffcdd2;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #e57373;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 40px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #fff5f5;
    border-color: #ef9a9a;
    color: #c62828;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const DeleteModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #c62828;
  text-align: center;
  margin: 0 0 12px 0;
`;

const DeleteModalDesc = styled.p`
  font-size: 14px;
  color: #555;
  text-align: center;
  line-height: 1.7;
  margin: 0 0 20px 0;
  white-space: pre-line;
`;

const DeleteInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  margin-bottom: 4px;

  &:focus {
    outline: none;
    border-color: #e57373;
    box-shadow: 0 0 0 4px rgba(229, 115, 115, 0.15);
  }
`;

const DeleteConfirmButton = styled.button`
  flex: 1;
  padding: 16px;
  background: #d32f2f;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #b71c1c;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
    staleTime: 60 * 60 * 1000, // 1시간 동안 캐시 유지
  });

  const handleLogout = () => signOut({ callbackUrl: '/login' });

  // 탈퇴 관련 state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '탈퇴 처리 중 오류가 발생했습니다.');
      // 탈퇴 성공 → 로그아웃 처리
      await signOut({ callbackUrl: '/login' });
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleteLoading(false);
    }
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    community: '',
    group_id: '' as string | number,
    cell_id: '' as string | number,
  });
  // 직분: '' = 미선택, '일반' = 다락방 선택, 그 외는 리더십(암호 필요)
  const [leaderRole, setLeaderRole] = useState<
    '일반' | '그룹장' | '목회자' | 'MC' | ''
  >('');
  const [leaderPassword, setLeaderPassword] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [updateError, setUpdateError] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isHub = formData.community === '허브';
  const groupIdStr = formData.group_id?.toString() || '';
  const isMcGroup = groupIdStr === MC_GROUP_ID;
  const isNoneGroup = groupIdStr === NONE_GROUP_ID;
  // 직분(그룹장/교역자)을 고를 수 있는 그룹인지
  const canSelectRole = LEADERSHIP_GROUP_IDS.includes(groupIdStr);
  // 암호 인증이 필요한 리더십 직분인지
  const isLeaderRole =
    leaderRole === '그룹장' || leaderRole === '목회자' || leaderRole === 'MC';

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
      setLeaderPassword('');
      // 기존 상태로 직분 기본값 추정: MC 그룹이면 MC, 다락방 있으면 일반, 아니면 미선택
      if (profileData.group_id?.toString() === MC_GROUP_ID) {
        setLeaderRole('MC');
      } else if (profileData.cell_id) {
        setLeaderRole('일반');
      } else {
        setLeaderRole('');
      }
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setUpdateError('');
    setLeaderRole('');
    setLeaderPassword('');
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
      let res: Response;

      // 허브 + 리더십 직분(그룹장/교역자/MC): 암호 검증 API로 보낸다.
      if (isHub && isLeaderRole) {
        if (!leaderPassword) {
          setUpdateError('암호를 입력해주세요.');
          setLoading(false);
          return;
        }
        res = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: leaderRole, // '그룹장' | '목회자' | 'MC'
            password: leaderPassword,
            group_id: formData.group_id
              ? parseInt(formData.group_id.toString())
              : null,
            // MC는 다락방도 MC(99)로 저장, 그룹장/교역자는 다락방 없음
            cell_id: leaderRole === 'MC' ? parseInt(MC_CELL_ID) : null,
            // 그룹장/교역자만 담당 그룹 연결, MC는 소속 그룹만 저장
            responsible_group_id:
              leaderRole === 'MC'
                ? undefined
                : formData.group_id
                ? parseInt(formData.group_id.toString())
                : undefined,
          }),
        });
      } else {
        // 일반 사용자: 기존대로 소속만 업데이트
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

        res = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || '업데이트 실패');

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
        <S.Wrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <S.LoadingText>정보를 불러오는 중...</S.LoadingText>
        </S.Wrapper>
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

              {/* 출석·지각비는 OD 명단(출석 대상 리더십)에게만 노출.
                  일반 순원은 출석 대상이 아니므로 보이지 않는다. */}
              {profileData.is_sunjang === true && (
                <Link href="/attendance/my" passHref legacyBehavior>
                  <S.AttendanceLink>
                    <S.AttendanceLinkLabel>
                      📋 출석·지각비 보기
                    </S.AttendanceLinkLabel>
                    <S.AttendanceLinkArrow>›</S.AttendanceLinkArrow>
                  </S.AttendanceLink>
                </Link>
              )}

              <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>

              {/* 회원 탈퇴 */}
              <WithdrawButton onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(''); }}>
                회원 탈퇴
              </WithdrawButton>
            </>
          )}

          {/* 탈퇴 확인 모달 */}
          {showDeleteModal && (
            <S.ModalOverlay onClick={() => !deleteLoading && setShowDeleteModal(false)}>
              <S.ModalContent onClick={(e) => e.stopPropagation()}>
                <DeleteModalTitle>정말 탈퇴하시겠습니까?</DeleteModalTitle>
                <DeleteModalDesc>
                  탈퇴하시면 모든 정보가 <strong>영구적으로 삭제</strong>되며 복구할 수 없습니다.{'\n'}
                  계속하려면 아래에 <strong>탈퇴합니다</strong>를 입력해주세요.
                </DeleteModalDesc>
                <DeleteInput
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="탈퇴합니다"
                  disabled={deleteLoading}
                />
                {deleteError && <S.ErrorMessage style={{ marginTop: 8, marginBottom: 0 }}>{deleteError}</S.ErrorMessage>}
                <ButtonGroup>
                  <CancelButton onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                    취소
                  </CancelButton>
                  <DeleteConfirmButton
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== '탈퇴합니다' || deleteLoading}
                  >
                    {deleteLoading ? '처리 중...' : '탈퇴하기'}
                  </DeleteConfirmButton>
                </ButtonGroup>
              </S.ModalContent>
            </S.ModalOverlay>
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
                        onChange={(value) => {
                          // 그룹별 다락방 자동 지정:
                          //  - MC(99)   → 다락방 MC(99)
                          //  - 해당없음(7) → 다락방 해당없음(26)
                          //  - 그 외      → 다락방 비움(사용자가 선택)
                          let autoCell: string | number = '';
                          if (value === MC_GROUP_ID) autoCell = parseInt(MC_CELL_ID);
                          else if (value === NONE_GROUP_ID) autoCell = parseInt(NONE_CELL_ID);

                          setFormData(prev => ({
                            ...prev,
                            group_id: value ? parseInt(value) : '',
                            cell_id: autoCell,
                          }));
                          // MC 그룹이면 직분을 MC로 자동 지정, 아니면 직분/암호 초기화
                          setLeaderRole(value === MC_GROUP_ID ? 'MC' : '');
                          setLeaderPassword('');
                        }}
                        options={[
                          { value: '', label: '선택하세요' },
                          ...(groups || []).map(g => ({ value: g.id.toString(), label: g.name.trim() })),
                        ]}
                        placeholder="선택하세요"
                      />
                    </FormGroup>

                    {/* MC 그룹: 다락방 자동(MC) + MC 암호 */}
                    {formData.group_id && isMcGroup && (
                      <FormGroup>
                        <Label>MC 암호</Label>
                        <InfoNote style={{ marginBottom: 10 }}>
                          MC는 다락방이 MC로 자동 지정되며, 암호 인증이 필요해요.
                        </InfoNote>
                        <Input
                          type="password"
                          value={leaderPassword}
                          onChange={(e) => setLeaderPassword(e.target.value)}
                          placeholder="MC 암호를 입력하세요"
                          autoComplete="off"
                        />
                      </FormGroup>
                    )}

                    {/* 해당없음 그룹: 다락방 자동(해당없음), 추가 선택 없음 */}
                    {formData.group_id && isNoneGroup && (
                      <InfoNote>
                        해당없음 그룹은 다락방도 자동으로 해당없음으로 처리됩니다.
                      </InfoNote>
                    )}

                    {/* 직분 선택 가능 그룹(사랑/믿음/소망/링크/새가족/실타): 직분 선택 */}
                    {formData.group_id && canSelectRole && (
                      <FormGroup>
                        <Label>직분</Label>
                        <Combobox
                          value={leaderRole}
                          onChange={(value) => {
                            setLeaderRole(value as '일반' | '그룹장' | '목회자' | '');
                            setLeaderPassword('');
                            // 리더십으로 바꾸면 다락방 값 제거
                            if (value === '그룹장' || value === '목회자') {
                              setFormData(prev => ({ ...prev, cell_id: '' }));
                            }
                          }}
                          options={[
                            { value: '', label: '선택하세요' },
                            { value: '일반', label: '다락방 선택하기' },
                            { value: '그룹장', label: '그룹장' },
                            { value: '목회자', label: '교역자(목회자)' },
                          ]}
                          placeholder="선택하세요"
                        />
                      </FormGroup>
                    )}

                    {/* 직분 그룹 + '다락방 선택하기': 다락방 드롭다운 */}
                    {formData.group_id && canSelectRole && leaderRole === '일반' && (
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
                        />
                      </FormGroup>
                    )}

                    {/* 직분 그룹 + 그룹장/교역자: 암호 */}
                    {formData.group_id && canSelectRole &&
                      (leaderRole === '그룹장' || leaderRole === '목회자') && (
                      <FormGroup>
                        <Label>
                          {leaderRole === '목회자' ? '교역자' : '그룹장'} 암호
                        </Label>
                        <InfoNote style={{ marginBottom: 10 }}>
                          담당 그룹 인증을 위해 암호를 입력해주세요.
                        </InfoNote>
                        <Input
                          type="password"
                          value={leaderPassword}
                          onChange={(e) => setLeaderPassword(e.target.value)}
                          placeholder="암호를 입력하세요"
                          autoComplete="off"
                        />
                      </FormGroup>
                    )}
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
                  <SaveButton
                    onClick={handleSave}
                    disabled={
                      loading ||
                      // 허브인데 그룹 미선택
                      (isHub && !formData.group_id) ||
                      // 직분 선택 그룹인데 직분 미선택
                      (isHub && canSelectRole && !leaderRole) ||
                      // 직분='일반'(다락방 선택)인데 다락방 미선택
                      (isHub && canSelectRole && leaderRole === '일반' && !formData.cell_id) ||
                      // 리더십(그룹장/교역자/MC)인데 암호 미입력
                      (isHub && isLeaderRole && !leaderPassword)
                    }
                  >
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
