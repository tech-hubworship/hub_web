// 파일 경로: src/pages/login/index.tsx (최종 수정본)

import PageLayout from "@src/components/common/PageLayout";
import { useState, useEffect } from "react";
import { supabase } from "@src/lib/supabase";
import { useRouter } from "next/router";
import { FaGoogle } from "react-icons/fa";
import * as S from "@src/views/LoginPage/style";
import Head from "next/head";
import { useSession, signIn, signOut } from "next-auth/react";

const REDIRECT_KEY = "login_redirect";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"login" | "phone">("login");
  const [phone, setPhone] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);

  useEffect(() => {
    // [변경] 인증이 완료되고, 아직 로그인 단계일 때만 사용자 확인을 시작합니다.
    if (status === "authenticated" && step === "login") {
      checkUserRegistration();
    }
  }, [status, step]);

  const showModal = (message: string) => {
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
  };

  const handleTerminateSession = async () => {
    setLoading(true);
    await signOut({ redirect: false });
    localStorage.removeItem(REDIRECT_KEY);
    window.location.reload();
  };

  // [변경] 사용자 확인 로직을 API 호출 방식으로 변경합니다.
  const checkUserRegistration = async () => {
    console.log("[로그] 서버에 사용자 등록 여부 확인 시작.");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/check-user');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '사용자 확인 중 오류 발생');
      }

      if (data.exists) {
        console.log("[로그] 등록된 사용자 확인. /Info 페이지로 이동합니다.");
        const finalRedirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
        localStorage.removeItem(REDIRECT_KEY);
        router.push(finalRedirectPath);
      } else {
        console.log("[로그] 미등록 사용자. 전화번호 입력 단계로 이동합니다.");
        setStep("phone");
      }
    } catch (e: any) {
      console.error("[로그] 사용자 확인 API 호출 오류:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn('google').catch((err) => {
      console.error("Google 로그인 시작 오류:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
      setLoading(false);
    });
  };

  const handlePhoneSubmit = async () => {
    // @ts-ignore
    if (!session?.user?.id) {
      showModal("세션이 만료되었습니다. 다시 로그인 해주세요.");
      setStep("login");
      return;
    }

    setLoading(true);
    setError("");

    // @ts-ignore
    console.log("[로그] 전화번호 제출 RPC 호출:", { uuid: session.user.id, email: session.user.email, phone });

    const { error: rpcError } = await supabase.rpc("upsert_google_user_by_phone", {
      // @ts-ignore
      p_uuid: session.user.id,
      p_email: session.user.email,
      p_phone_number: phone,
    });

    if (rpcError) {
      console.error("[로그] RPC 호출 오류:", rpcError);
      if (rpcError.code === "23505") {
        setIsTerminationModalOpen(true);
      } else {
        showModal(rpcError.message || "전화번호가 서비스 사용자 테이블에 존재하지 않습니다.");
      }
      setError("구글 사용자 매핑에 실패했습니다.");
      setLoading(false);
      return;
    }

    console.log("[로그] 전화번호 제출 성공! /Info 페이지로 이동합니다.");
    const finalRedirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
    localStorage.removeItem(REDIRECT_KEY);
    router.push(finalRedirectPath);
  };

  // 로딩 중일 때 표시할 화면
  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <S.Wrapper>
          <S.LoginCard><S.Title>로그인 상태 확인 중...</S.Title></S.LoginCard>
        </S.Wrapper>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head><title>로그인</title></Head>
      <S.Wrapper>
        <S.LoginCard>
          {step === "login" && (
            <>
              <S.Title>구글을 사용해 로그인해보세요!</S.Title>
              <S.Subtitle>한번 연동된 계정은 변경이 어려우니 잘 선택해주세요.</S.Subtitle>
              <S.GoogleLoginButton type="button" onClick={handleGoogleLogin} disabled={loading}>
                <FaGoogle /> Google 계정으로 로그인
              </S.GoogleLoginButton>
            </>
          )}

          {step === "phone" && (
            <>
              <S.Title>전화번호를 입력해주세요</S.Title>
              <S.Input
                type="text"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setPhone(onlyDigits);
                }}
                maxLength={11}
                disabled={loading}
              />
              <S.LoginButton onClick={handlePhoneSubmit} disabled={loading}>확인</S.LoginButton>
            </>
          )}

          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

          {isModalOpen && (
            <S.ModalOverlay>
              <S.ModalContent onClick={(e) => e.stopPropagation()}>
                <S.ModalTitle>알림</S.ModalTitle>
                <S.ModalSubtitle>{modalMessage}</S.ModalSubtitle>
                <S.ModalCloseButton onClick={closeModal}>닫기</S.ModalCloseButton>
              </S.ModalContent>
            </S.ModalOverlay>
          )}

          {isTerminationModalOpen && (
            <S.ModalOverlay>
              <S.ModalContent onClick={(e) => e.stopPropagation()}>
                <S.ModalTitle>알림</S.ModalTitle>
                <S.ModalSubtitle>
                  이미 해당 전화번호로 연결된 구글 계정이 있습니다.
                  <br />
                  현재 구글 세션을 종료하고 다시 로그인하시겠습니까?
                </S.ModalSubtitle>
                <S.ModalButton onClick={handleTerminateSession}>예, 종료합니다</S.ModalButton>
                <S.ModalCloseButton onClick={() => setIsTerminationModalOpen(false)}>아니오</S.ModalCloseButton>
              </S.ModalContent>
            </S.ModalOverlay>
          )}
        </S.LoginCard>
      </S.Wrapper>
    </PageLayout>
  );
}