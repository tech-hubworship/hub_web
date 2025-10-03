// 파일 경로: src/views/InfoPage/index.tsx

import { useState, useEffect, FormEvent, useRef } from 'react';
import PageLayout from "@src/components/common/PageLayout";
import { useRouter } from "next/router";
import Head from "next/head";
import * as S from "@src/views/InfoPage/style";
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- 타입 정의 및 상수 ---
interface ProfileData {
  name: string; email: string; birth_date: string;
  gender: 'M' | 'F'; community: string; group_id: number | null;
  cell_id: number | null; group_name: string | null;
  cell_name: string | null; roles: string[];
  responsible_group_name: string | null;
  responsible_cell_info: string | null;
}
interface UserStatus { needsUpdate: boolean; }
const ALL_ROLES = ["MC", "그룹장", "다락방장"];
const PRIVILEGED_ROLES = ["MC", "그룹장", "다락방장"];

// --- API 호출 함수 ---
const fetchProfile = async (): Promise<ProfileData> => {
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('프로필 정보 로딩 실패');
  return res.json();
};
const fetchUserStatus = async (): Promise<UserStatus> => {
  const res = await fetch('/api/user/status');
  if (!res.ok) throw new Error('사용자 상태 확인 실패');
  return res.json();
};

// --- 정보 업데이트 모달 컴포넌트 ---
const UpdateModal = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState({
        role: '', group_id: '', cell_id: '',
        responsible_group_id: '', responsible_cell_id: '',
        password: ''
    });
const [groups, setGroups] = useState<{id: number, name: string}[]>([]);
    const [cells, setCells] = useState<{id: number, name: string}[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [showRoleSelect, setShowRoleSelect] = useState(false);
    const clickTimer = useRef<NodeJS.Timeout | null>(null);

    const handleTitleClick = () => {
        if (clickTimer.current) clearTimeout(clickTimer.current);
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 5) { setShowRoleSelect(true); setClickCount(0); }
        clickTimer.current = setTimeout(() => setClickCount(0), 1000);
    };

    useEffect(() => {
        const fetchGroups = async () => {
            const res = await fetch('/api/signup/groups');
            if(res.ok) setGroups((await res.json()).data);
        };
        fetchGroups();
    }, []);

    useEffect(() => {
        const groupId = formData.responsible_group_id || formData.group_id;
        if (groupId) {
            const fetchCells = async () => {
                const res = await fetch(`/api/signup/cells?groupId=${groupId}`);
                if(res.ok) setCells((await res.json()).data);
            };
            fetchCells();
        } else { setCells([]); }
    }, [formData.group_id, formData.responsible_group_id]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFormData = {...formData, [name]: value};
        if (name === 'role') {
            newFormData.group_id = '';
            newFormData.cell_id = '';
            newFormData.responsible_group_id = '';
            newFormData.responsible_cell_id = '';
        }
        setFormData(newFormData);
    };
    
    const queryClient = useQueryClient();
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            alert('정보가 성공적으로 업데이트되었습니다.');
            await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            await queryClient.invalidateQueries({ queryKey: ['userStatus'] });
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
                <S.ModalTitle onClick={handleTitleClick}>정보 업데이트</S.ModalTitle>
                <S.InfoWrapper>
                    {showRoleSelect && (
                        <S.InfoItem>
                            <S.Label>역할 변경 (리더/관리자용)</S.Label>
                            <S.Select name="role" value={formData.role} onChange={handleChange}>
                                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </S.Select>
                        </S.InfoItem>
                    )}
                    {!formData.role ? (
                        <>
                            <S.InfoItem><S.Label>소속 그룹</S.Label><S.Select name="group_id" value={formData.group_id} onChange={handleChange}><option value="">-- 그룹 선택 --</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</S.Select></S.InfoItem>
                            <S.InfoItem><S.Label>소속 다락방</S.Label><S.Select name="cell_id" value={formData.cell_id} onChange={handleChange}><option value="">-- 다락방 선택 --</option>{cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</S.Select></S.InfoItem>
                        </>
                    ) : ['목회자', '그룹장'].includes(formData.role) ? (
                        <S.InfoItem><S.Label>담당 그룹</S.Label><S.Select name="responsible_group_id" value={formData.responsible_group_id} onChange={handleChange}><option value="">-- 그룹 선택 --</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</S.Select></S.InfoItem>
                    ) : formData.role === '다락방장' ? (
                        <>
                            <S.InfoItem><S.Label>담당 그룹</S.Label><S.Select name="responsible_group_id" value={formData.responsible_group_id} onChange={handleChange}><option value="">-- 그룹 선택 --</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</S.Select></S.InfoItem>
                            <S.InfoItem><S.Label>담당 다락방</S.Label><S.Select name="responsible_cell_id" value={formData.responsible_cell_id} onChange={handleChange}><option value="">-- 다락방 선택 --</option>{cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</S.Select></S.InfoItem>
                        </>
                    ) : null}
                    
                    {/* ⭐️ [핵심 수정] 권한이 있는 역할을 선택했을 때만 암호 필드를 보여줍니다. */}
                    {PRIVILEGED_ROLES.includes(formData.role) && (
                         <S.InfoItem>
                            <S.Label>관리자 암호</S.Label>
                            <S.Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="역할에 맞는 암호를 입력하세요."/>
                         </S.InfoItem>
                    )}
                </S.InfoWrapper>
                {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
                <S.ButtonWrapper>
                    <S.CancelButton onClick={onClose}>취소</S.CancelButton>
                    <S.SubmitButton onClick={handleSubmit} disabled={loading}>{loading ? '업데이트 중...' : '완료'}</S.SubmitButton>
                </S.ButtonWrapper>
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
  
  // ⭐️ '정보 업데이트 필요 여부'를 전용 API로 확인
  const { data: userStatus, error: statusError, isLoading: isStatusLoading } = useQuery<UserStatus, Error>({
    queryKey: ['userStatus', session?.user?.id],
    queryFn: fetchUserStatus,
    enabled: !!profileData,
  });

  const handleLogout = () => signOut({ callbackUrl: '/login' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ⭐️ userStatus API의 결과에 따라서만 모달을 제어
  useEffect(() => {
      if (userStatus?.needsUpdate) {
          setIsModalOpen(true);
      } else {
          setIsModalOpen(false);
      }
  }, [userStatus]);

  if (isLoading || isStatusLoading) {
    return <PageLayout><S.LoadingText>정보를 불러오는 중...</S.LoadingText></PageLayout>;
  }

  return (
    <PageLayout>
      <Head><title>내 정보</title></Head>
      <S.Wrapper>
        <S.Title>내 정보</S.Title>
        {(error || statusError) && <S.ErrorMessage>{error?.message || statusError?.message}</S.ErrorMessage>}
        
        {profileData && isModalOpen && <UpdateModal onClose={() => setIsModalOpen(false)}/>}
        
        {profileData && !isModalOpen && (
          <S.Card>
            <S.InfoWrapper>
              <S.InfoItem><S.Label>이름</S.Label><S.Value>{profileData.name}</S.Value></S.InfoItem>
              <S.InfoItem><S.Label>이메일</S.Label><S.Value>{profileData.email}</S.Value></S.InfoItem>
              {profileData.roles.length > 0 && <S.InfoItem><S.Label>역할</S.Label><S.Value>{profileData.roles.join(', ')}</S.Value></S.InfoItem>}
              {profileData.responsible_group_name && <S.InfoItem><S.Label>담당 그룹</S.Label><S.Value>{profileData.responsible_group_name}</S.Value></S.InfoItem>}
              {profileData.responsible_cell_info && <S.InfoItem><S.Label>담당 다락방</S.Label><S.Value>{profileData.responsible_cell_info}</S.Value></S.InfoItem>}
              <S.InfoItem><S.Label>공동체</S.Label><S.Value>{profileData.community}</S.Value></S.InfoItem>
              {profileData.group_name && <S.InfoItem><S.Label>소속 그룹</S.Label><S.Value>{profileData.group_name}</S.Value></S.InfoItem>}
              {profileData.cell_name && <S.InfoItem><S.Label>소속 다락방</S.Label><S.Value>{profileData.cell_name}</S.Value></S.InfoItem>}
            </S.InfoWrapper>
            <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
          </S.Card>
        )}
      </S.Wrapper>
    </PageLayout>
  );
}