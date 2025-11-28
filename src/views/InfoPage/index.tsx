// 파일 경로: src/views/InfoPage/index.tsx

import React, { useState, useEffect } from 'react';
import PageLayout from "@src/components/common/PageLayout";
import { useRouter } from "next/router";
import Head from "next/head";
import * as S from "@src/views/InfoPage/style";
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

// --- 정보 업데이트 모달 컴포넌트 ---
const UpdateModal = ({ 
  onClose, 
  profileData 
}: { 
  onClose: () => void;
  profileData: ProfileData;
}) => {
  const [formData, setFormData] = useState({
    name: profileData.name || '',
    birth_date: profileData.birth_date || '',
    community: profileData.community || '',
    group_id: profileData.group_id?.toString() || '',
    cell_id: profileData.cell_id?.toString() || '',
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchGroups = async () => {
      const res = await fetch('/api/signup/groups');
      if (res.ok) setGroups((await res.json()).data);
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const groupId = formData.group_id;
    if (groupId && formData.community === '허브') {
      const fetchCells = async () => {
        const res = await fetch(`/api/signup/cells?groupId=${groupId}`);
        if (res.ok) setCells((await res.json()).data);
      };
      fetchCells();
    } else {
      setCells([]);
    }
  }, [formData.group_id, formData.community]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // 그룹 변경 시 다락방 초기화
    if (name === 'group_id') {
      newFormData.cell_id = '';
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        updateData.group_id = formData.group_id ? parseInt(formData.group_id) : null;
        updateData.cell_id = formData.cell_id ? parseInt(formData.cell_id) : null;
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
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.ModalOverlay>
      <S.ModalContent>
        <S.ModalTitle>정보 수정</S.ModalTitle>
        <form onSubmit={handleSubmit}>
          <S.InfoWrapper>
            <div>
              <S.Label>이름</S.Label>
              <S.Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            <div>
              <S.Label>생년월일</S.Label>
              <S.Input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <S.Label>공동체</S.Label>
              <S.Select
                name="community"
                value={formData.community}
                onChange={handleChange}
                required
              >
                <option value="">-- 공동체 선택 --</option>
                <option value="허브">허브</option>
                <option value="타공동체">타공동체</option>
              </S.Select>
            </div>

            {formData.community === '허브' && (
              <>
                <div>
                  <S.Label>그룹</S.Label>
                  <S.Select
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                  >
                    <option value="">-- 그룹 선택 --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </S.Select>
                </div>

                <div>
                  <S.Label>다락방</S.Label>
                  <S.Select
                    name="cell_id"
                    value={formData.cell_id}
                    onChange={handleChange}
                    disabled={!formData.group_id}
                  >
                    <option value="">-- 다락방 선택 --</option>
                    {cells.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </S.Select>
                </div>
              </>
            )}
          </S.InfoWrapper>

          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

          <S.ButtonWrapper>
            <S.CancelButton type="button" onClick={onClose}>취소</S.CancelButton>
            <S.SubmitButton type="submit" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </S.SubmitButton>
          </S.ButtonWrapper>
        </form>
      </S.ModalContent>
    </S.ModalOverlay>
  );
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <Head><title>내 정보</title></Head>
        <S.LoadingText>정보를 불러오는 중...</S.LoadingText>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head><title>내 정보</title></Head>
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
          
          {profileData && isModalOpen && (
            <UpdateModal 
              onClose={() => setIsModalOpen(false)} 
              profileData={profileData}
            />
          )}
          
          {profileData && !isModalOpen && (
            <>
              {/* 기본 정보 카드 */}
              <S.Card>
                <S.CardHeader>
                  <S.CardTitle>기본 정보</S.CardTitle>
                  <S.CardAction onClick={() => setIsModalOpen(true)}>
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
        </S.Content>
      </S.Wrapper>
    </PageLayout>
  );
}
