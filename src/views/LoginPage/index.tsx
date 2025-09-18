import PageLayout from "@src/components/common/PageLayout";
import { useState } from "react";
import { supabase } from "@src/lib/supabase";
import { useRouter } from "next/router";
import { FaGoogle } from "react-icons/fa";
import * as S from "./style";
import Head from "next/head";
import { useGoogleLogin } from "@react-oauth/google";

const REDIRECT_KEY = "login_redirect";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"login" | "phone">("login");
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);

  const showModal = (message: string) => {
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
  };

  const handleTerminateSession = async () => {
    console.log("[로그] 세션 종료 요청 시작");
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem(REDIRECT_KEY);
    window.location.reload();
    console.log("[로그] 세션 종료 완료");
  };

  // -------------------------------
  // google_users 존재 여부 확인
  // -------------------------------
  const checkGoogleUser = async (googleId: string) => {
    console.log("[로그] google_users 테이블에서 사용자 존재 여부 확인 시작.");
    console.log(`[로그] 조회할 사용자 Google ID: ${googleId}`);

    const { data: gUser, error: gError } = await supabase
      .from("google_users")
      .select("*")
      .eq("uuid", googleId)
      .maybeSingle();

    if (gError) {
      console.error("[로그] google_users 조회 오류:", gError);
      return;
    }

    if (gUser) {
      console.log("[로그] google_users에 존재. Info 페이지로 리다이렉트합니다.");
      const finalRedirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
      localStorage.removeItem(REDIRECT_KEY);
      router.push(finalRedirectPath);
    } else {
      console.log("[로그] google_users에 없음. 전화번호 입력 단계로 이동합니다.");
      setStep("phone");
    }
  };

  // -------------------------------
  // Google 로그인 성공 핸들러
  // -------------------------------
  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    console.log("[로그] Google 로그인 성공. 인증 코드를 서버로 전송합니다.");

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/auth/google-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tokenResponse.code }),
      });

      console.log("[로그] 서버로부터 응답 받음.");

      if (!response.ok) {
        console.error(`[로그] 서버 응답 오류: ${response.status}`);
        const errorData = await response.json();
        throw new Error(errorData.error || "서버 인증 실패");
      }

      const { user: userInfo, session } = await response.json();
      console.log("[로그] 유저 정보 및 세션 확인 성공:", userInfo);

      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      console.log("[로그] Supabase 클라이언트 세션 설정 완료.");

      setUser(userInfo);
      checkGoogleUser(userInfo.id);

    } catch (err) {
      console.error("[로그] 로그인 처리 중 오류 발생:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      console.log("[로그] 로그인 로딩 상태 비활성화.");
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: (error) => {
      console.error("[로그] Google 로그인 오류:", error);
      setError("Google 로그인에 실패했습니다.");
    },
    flow: "auth-code",
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  });

  // -------------------------------
  // 전화번호 제출
  // -------------------------------
  const handlePhoneSubmit = async () => {
    console.log("[로그] 전화번호 입력 폼 제출 시작.");

    try {
      setLoading(true);
      setError("");

      if (!user) {
        showModal("세션이 만료되었습니다. 다시 로그인 해주세요.");
        console.log("[로그] 세션 만료, 전화번호 매핑 중단.");
        return;
      }

      console.log("[로그] RPC 호출 payload:", {
        p_uuid: user.id,
        p_email: user.email,
        p_phone_number: phone,
      });

      const { error: rpcError } = await supabase.rpc("upsert_google_user_by_phone", {
        p_uuid: user.id,
        p_email: user.email,
        p_phone_number: phone,
      });

      if (rpcError) {
        console.error("[로그] RPC 호출 오류:", rpcError);

        if (rpcError.code === "23505") {
          setIsTerminationModalOpen(true);
        } else {
          showModal(
            "전화번호가 서비스 사용자 테이블에 존재하지 않습니다.\n입력 정보를 확인해주세요."
          );
        }

        setError("구글 사용자 매핑에 실패했습니다.");
        return;
      }

      console.log("[로그] 매핑 성공, 리다이렉트 시작.");
      const finalRedirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
      localStorage.removeItem(REDIRECT_KEY);
      router.push(finalRedirectPath);
    } catch (err) {
      console.error("[로그] 전화번호 매핑 오류:", err);
      setError("전화번호 매핑 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      console.log("[로그] 전화번호 매핑 로딩 상태 비활성화.");
    }
  };

  return (
    <PageLayout>
      <Head>
        <title>로그인</title>
      </Head>

      <S.Wrapper>
        <S.LoginCard>
          {step === "login" && (
            <>
              <S.Title>구글을 사용해 로그인해보세요!</S.Title>
              <S.Subtitle>
                한번 연동된 계정은 변경이 어려우니 잘 선택해주세요.
              </S.Subtitle>
              <S.GoogleLoginButton type="button" onClick={() => login()} disabled={loading}>
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
              <S.LoginButton onClick={handlePhoneSubmit} disabled={loading}>
                확인
              </S.LoginButton>
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
                <S.ModalButton onClick={handleTerminateSession}>
                  예, 종료합니다
                </S.ModalButton>
                <S.ModalCloseButton onClick={() => setIsTerminationModalOpen(false)}>
                  아니오
                </S.ModalCloseButton>
              </S.ModalContent>
            </S.ModalOverlay>
          )}
        </S.LoginCard>
      </S.Wrapper>
    </PageLayout>
  );
}