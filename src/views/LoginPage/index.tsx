// 파일 경로: src/views/LoginPage/index.tsx

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import PageLayout from "@src/components/common/PageLayout";
import * as S from "@src/views/LoginPage/style";
import { FaGoogle } from "react-icons/fa";

const REDIRECT_KEY = "login_redirect";
const SIGNUP_ROLE_KEY = "signup_role";

const ROLES = ["그룹장", "다락방장", "MC", "목회자"];
const ADMIN_ROLES = ["MC", "목회자"];

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [specialMode, setSpecialMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);


  // URL 파라미터에서 redirect 정보 가져오기 (router.isReady 확인)
  useEffect(() => {
    if (router.isReady && router.query.redirect) {
      localStorage.setItem(REDIRECT_KEY, router.query.redirect as string);
    }
  }, [router.isReady, router.query.redirect]);

  useEffect(() => {
    if (status === "authenticated") {
      const signupRole = sessionStorage.getItem(SIGNUP_ROLE_KEY);
      sessionStorage.removeItem(SIGNUP_ROLE_KEY); // 역할 정보 사용 후 즉시 삭제

      if (session.user?.isNewUser) {
        const url = signupRole ? `/signup?role=${signupRole}` : "/signup";
        router.replace(url);
      } else {
        // 기존 사용자인 경우 프로필 확인
        checkProfileAndRedirect();
      }
    }
  }, [status, session, router]);

  const checkProfileAndRedirect = async () => {
    try {
      // redirect 값을 먼저 확인 (localStorage 또는 router.query에서)
      let redirectPath = localStorage.getItem(REDIRECT_KEY);
      if (!redirectPath && router.isReady && router.query.redirect) {
        redirectPath = router.query.redirect as string;
        localStorage.setItem(REDIRECT_KEY, redirectPath);
      }

      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        // 프로필 조회 실패 시 기본 리다이렉트
        const finalRedirect = redirectPath || "/myinfo";
        localStorage.removeItem(REDIRECT_KEY);
        router.replace(finalRedirect);
        return;
      }

      const profile = await response.json();
      
      // 관리자 여부 확인
      const isAdmin = session?.user?.isAdmin || profile.roles?.length > 0 || profile.status === '관리자';
      
      // 허브 활성 사용자 또는 관리자이고 그룹/셀이 비어있는 경우
      const isHubActive = profile.community === '허브' && profile.status === '활성';
      const hasEmptyGroupCell = !profile.group_id || !profile.cell_id;
      
      if ((isHubActive || isAdmin) && hasEmptyGroupCell) {
        // 정보 업데이트 페이지로 리다이렉트 (redirect 값은 localStorage에 유지)
        // UpdatePage에서 업데이트 완료 후 redirect 값을 사용하여 원래 페이지로 돌아감
        router.replace('/update');
      } else {
        // redirect 값이 있으면 해당 페이지로, 없으면 myinfo로
        const finalRedirect = redirectPath || "/myinfo";
        localStorage.removeItem(REDIRECT_KEY);
        router.replace(finalRedirect);
      }
    } catch (error) {
      console.error('프로필 확인 오류:', error);
      // 오류 발생 시 redirect 값 확인 후 리다이렉트
      const redirectPath = localStorage.getItem(REDIRECT_KEY) || 
                          (router.query.redirect as string) || 
                          "/myinfo";
      localStorage.removeItem(REDIRECT_KEY);
      router.replace(redirectPath);
    }
  };
  
  const handleTitleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (newClickCount >= 5) {
      setSpecialMode(true);
      setClickCount(0);
    }

    clickTimer.current = setTimeout(() => {
      setClickCount(0);
    }, 1000);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setSelectedRole(role);

    if (ADMIN_ROLES.includes(role)) {
      setIsModalOpen(true);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      setModalError('암호를 입력해주세요.');
      return;
    }
    setIsVerifying(true);
    setModalError('');

    try {
      const response = await fetch('/api/auth/validate-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ⭐️ [핵심 수정] 선택된 역할(selectedRole)을 함께 보냅니다.
        body: JSON.stringify({ role: selectedRole, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '인증에 실패했습니다.');
      }
      
      setIsModalOpen(false);
      sessionStorage.setItem(SIGNUP_ROLE_KEY, selectedRole);
      
      // redirect 값을 signIn 전에 다시 확인하여 저장
      if (router.isReady && router.query.redirect) {
        const redirectValue = router.query.redirect as string;
        localStorage.setItem(REDIRECT_KEY, redirectValue);
        signIn('google', { 
          prompt: 'select_account',
          callbackUrl: '/login?redirect=' + encodeURIComponent(redirectValue)
        });
      } else {
        signIn('google', { 
          prompt: 'select_account',
          callbackUrl: '/login'
        });
      }

    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsVerifying(false);
      setPassword('');
    }
  };

  const handleLogin = () => {
    if (selectedRole && !ADMIN_ROLES.includes(selectedRole)) {
        sessionStorage.setItem(SIGNUP_ROLE_KEY, selectedRole);
    } else {
        sessionStorage.removeItem(SIGNUP_ROLE_KEY);
    }
    
    // redirect 값을 signIn 전에 다시 확인하여 저장
    if (router.isReady && router.query.redirect) {
      const redirectValue = router.query.redirect as string;
      localStorage.setItem(REDIRECT_KEY, redirectValue);
      signIn('google', { 
        prompt: 'select_account',
        callbackUrl: '/login?redirect=' + encodeURIComponent(redirectValue)
      });
    } else {
      signIn('google', { 
        prompt: 'select_account',
        callbackUrl: '/login'
      });
    }
  };


  if (status === "loading" || status === "authenticated") {
    return (
      <PageLayout>
        <S.Wrapper><S.Card><S.Title>로그인 정보를 확인 중입니다...</S.Title></S.Card></S.Wrapper>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head><title>로그인</title></Head>
      <S.Wrapper>
        <S.Card>
          <S.Title onClick={handleTitleClick}>로그인하고 모든 서비스를 이용해보세요</S.Title>
          <S.Subtitle>구글 계정을 통해 간편하게 시작할 수 있습니다.</S.Subtitle>

          {specialMode && (
            <S.RoleSelectWrapper>
              <S.Select value={selectedRole} onChange={handleRoleChange}>
                <option value="">-- 역할 선택 (선택사항) --</option>
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </S.Select>
            </S.RoleSelectWrapper>
          )}
          
          <S.GoogleLoginButton 
            type="button" 
            onClick={handleLogin}
            disabled={ADMIN_ROLES.includes(selectedRole)}
          >
            <FaGoogle /> Google 계정으로 로그인
          </S.GoogleLoginButton>
        </S.Card>
      </S.Wrapper>

      {isModalOpen && (
        <S.ModalOverlay>
          <S.ModalContent>
            <S.ModalTitle>{selectedRole} 관리자 암호</S.ModalTitle>
            <S.Input
              type="password"
              placeholder="암호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyPassword()}
            />
            {modalError && <S.ErrorMessage style={{marginTop: '12px'}}>{modalError}</S.ErrorMessage>}
            <S.ButtonWrapper>
                <S.CancelButton onClick={() => { setIsModalOpen(false); setSelectedRole(''); }}>취소</S.CancelButton>
                <S.SubmitButton onClick={handleVerifyPassword} disabled={isVerifying}>
                {isVerifying ? '확인 중...' : '확인'}
                </S.SubmitButton>
            </S.ButtonWrapper>
          </S.ModalContent>
        </S.ModalOverlay>
      )}
    </PageLayout>
  );
}