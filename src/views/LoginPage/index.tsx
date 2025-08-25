import * as S from './style';
import PageLayout from "@src/components/common/PageLayout";
import { useState, useEffect } from 'react';
import { supabase } from '@src/lib/supabase';
import { useRouter } from 'next/router';
import { useAuthStore } from '@src/store/auth';
import { useLoading } from '@src/contexts/LoadingContext';

// 리다이렉션 관련 로컬스토리지 키
const REDIRECT_KEY = 'login_redirect';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [redirectPath, setRedirectPath] = useState('/myinfo'); // 기본값은 마이페이지
  const { startLoading, stopLoading } = useLoading();

  // 뒤로가기 버튼 처리
  const handleGoBack = () => {
    router.back();
  };

  // 컴포넌트 마운트 시 리다이렉션 경로 확인
  useEffect(() => {
    // URL 쿼리 파라미터에서 redirect 값 확인
    const redirect = router.query.redirect as string;
    if (redirect) {
      // URL에서 리다이렉션 경로가 제공된 경우, 로컬 스토리지에 저장
      localStorage.setItem(REDIRECT_KEY, redirect);
      setRedirectPath(redirect);
    } else {
      // URL에 없는 경우 로컬 스토리지 확인
      const savedPath = localStorage.getItem(REDIRECT_KEY);
      if (savedPath) {
        setRedirectPath(savedPath);
      }
    }
  }, [router.query]);

  // 전화번호 입력 처리
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      let formattedNumber = '';
      if (value.length <= 3) {
        formattedNumber = value;
      } else if (value.length <= 7) {
        formattedNumber = `${value.slice(0, 3)}-${value.slice(3)}`;
      } else {
        formattedNumber = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
      }
      setPhoneNumber(formattedNumber);
    }
  };

  // 비밀번호 입력 처리
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setPassword(value);
    }
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startLoading();

    try {
      let userData = null;
      let userType = '';
      
      // 1. 일반 회원 확인
      let { data, error } = await supabase
        .from('users')
        .select('phone_number, visit_count')
        .eq('phone_number', phoneNumber)
        .eq('password', password)
        .single();

      if (!error && data) {
        userData = data;
        userType = 'users';
      }

      // 2. 티셔츠 회원 확인
      if (error) {
        const { data: tshirtUserData, error: tshirtUserError } = await supabase
          .from('tshirt_users')
          .select('phone_number, visit_count')
          .eq('phone_number', phoneNumber)
          .eq('password', password)
          .single();
        
        if (!tshirtUserError && tshirtUserData) {
          userData = tshirtUserData;
          userType = 'tshirt_users';
          error = null;
        }
      }

      // 로그인 실패 처리
      if (error) {
        stopLoading();
        throw new Error('로그인에 실패했습니다. 전화번호와 비밀번호를 확인해주세요.');
      }

      // 로그인 성공 처리
      if (userData) {
        // 방문 기록 업데이트 (방문 시간 및 카운트)
        const currentVisitCount = userData.visit_count || 0;
        const updateData = {
          last_visit: new Date().toISOString(),
          visit_count: currentVisitCount + 1
        };
        
        // 테이블 유형에 따라 적절한 테이블 업데이트
        const { error: updateError } = await supabase
          .from(userType)
          .update(updateData)
          .eq('phone_number', phoneNumber);
          
        if (updateError) {
          console.error('방문 기록 업데이트 실패:', updateError);
        }

        // 인증 상태 설정
        setUser(phoneNumber);
        
        // 세션 정보가 localStorage에 저장되는 시간을 확보하기 위해 약간 지연
        setTimeout(() => {
          // 리다이렉션 경로 확인 및 로깅
          const finalRedirectPath = redirectPath || '/myinfo';  
          
          // 리다이렉션 경로 사용 후 삭제
          localStorage.removeItem(REDIRECT_KEY);
          
          // 지정된 경로로 이동
          router.push(finalRedirectPath);
        }, 100); // 100ms 지연
      }
    } catch (err) {
      stopLoading();
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <PageLayout>
      <S.Container>
        <S.BackButton onClick={handleGoBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          뒤로가기
        </S.BackButton>
        
        <S.Title>
          신청 폼에 기재했던 <br />
          나의 정보를 입력해주세요.
        </S.Title>
        <S.TshirtSignupText>신청폼 제출 후 15분 후 이용해주세요</S.TshirtSignupText>
        
        <S.Form onSubmit={handleLogin}>
          <S.Input
            type="tel"
            placeholder="전화번호 (010-0000-0000)"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            required
          />
          <S.Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          
          {error && (
            <S.LoginProblem>
              <S.InfoIcon>i</S.InfoIcon>
              <S.LoginProblemText>{error}</S.LoginProblemText>
            </S.LoginProblem>
          )}
          
          <S.HelpContainer>
            <S.HelpLink href="https://open.kakao.com/o/sfQ3NLqh" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.99995 1.67332C9.93462 1.67332 12.3266 4.06528 12.3266 6.99995C12.3266 9.93462 9.93462 12.3266 6.99995 12.3266C4.06528 12.3266 1.67332 9.93462 1.67332 6.99995C1.67332 4.06528 4.06528 1.67332 6.99995 1.67332ZM6.99995 0.467285C3.39191 0.467285 0.467285 3.39191 0.467285 6.99995C0.467285 10.608 3.39191 13.5326 6.99995 13.5326C10.608 13.5326 13.5326 10.608 13.5326 6.99995C13.5326 3.39191 10.608 0.467285 6.99995 0.467285Z" fill="#000000"/>
                <path d="M7.603 6.26636H6.39697V10.2865H7.603V6.26636Z" fill="#000000"/>
                <path d="M6.99986 3.75391C6.5878 3.75391 6.24609 4.08556 6.24609 4.50768C6.24609 4.92979 6.5878 5.26144 6.99986 5.26144C7.41192 5.26144 7.75363 4.91974 7.75363 4.50768C7.75363 4.09561 7.42197 3.75391 6.99986 3.75391Z" fill="#000000"/>
              </svg>
              비밀번호를 잊어버렸나요?
            </S.HelpLink>
          </S.HelpContainer>
          
          <S.LoginButton type="submit">로그인 →</S.LoginButton>
          
          <S.TshirtSignupContainer>
            <S.TshirtSignupText>티셔츠만 구매하시나요?</S.TshirtSignupText>
            <S.TshirtSignupLink href="/tshirt-signup">티셔츠 구매 회원가입</S.TshirtSignupLink>
          </S.TshirtSignupContainer>
        </S.Form>
      </S.Container>
    </PageLayout>
  );
} 