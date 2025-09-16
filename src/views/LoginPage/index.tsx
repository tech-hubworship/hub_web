import PageLayout from "@src/components/common/PageLayout";
import { useState, useEffect } from "react";
import { supabase } from "@src/lib/supabase";
import { useRouter } from "next/router";
import { FaGoogle } from "react-icons/fa";
import * as S from "./style";
import Head from "next/head";

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
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem(REDIRECT_KEY);
    window.location.reload(); 
  };

  /** 1. 구글 로그인 */
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" },
      });
      if (error) {
        console.error("Google 로그인 오류:", error);
        setError("Google 로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("Google 로그인 중 오류 발생:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 2. 전화번호 입력 후 google_users 매핑 */
  const handlePhoneSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user) {
        showModal("세션이 만료되었습니다. 다시 로그인 해주세요.");
        setLoading(false);
        return;
      }

      console.log("[LoginPage] RPC 호출 payload:", {
        p_uuid: user.id,
        p_email: user.email,
        p_phone_number: phone,
      });

      const { error: rpcError } = await supabase.rpc('upsert_google_user_by_phone', {
        p_uuid: user.id,
        p_email: user.email,
        p_phone_number: phone,
      });

      if (rpcError) {
        console.error("[LoginPage] RPC 호출 오류:", rpcError);
        
        if (rpcError.code === '23505') {
          setIsTerminationModalOpen(true);
        } else {
          showModal("전화번호가 서비스 사용자 테이블에 존재하지 않습니다.\n입력 정보를 확인해주세요.");
        }
        
        setError("구글 사용자 매핑에 실패했습니다.");
        setLoading(false);
        return;
      }

      console.log("[LoginPage] 매핑 성공, 리다이렉트 시작");
      const finalRedirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
      localStorage.removeItem(REDIRECT_KEY);
      router.push(finalRedirectPath);
    } catch (err) {
      console.error("전화번호 매핑 오류:", err);
      setError("전화번호 매핑 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 3. 로그인 상태 체크 */
  useEffect(() => {
    const redirect = router.query.from as string;
    if (redirect && !redirect.includes("login")) {
      localStorage.setItem(REDIRECT_KEY, redirect);
    } else {
      localStorage.removeItem(REDIRECT_KEY);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AuthStateChange]", event, session);
        if (event === "SIGNED_IN" && session?.user) {
          const currentUser = session.user;
          setUser(currentUser);
          console.log("[SIGNED_IN] 유저 정보:", currentUser);

          if (currentUser?.app_metadata?.provider === "google") {
            const checkGoogleUser = async () => {
              const { data: gUser, error: gError } = await supabase
                .from("google_users")
                .select("*")
                .eq("uuid", currentUser.id)
                .maybeSingle();

              if (gError) {
                console.error("[LoginPage] google_users 조회 오류:", gError);
                return;
              }

              if (gUser) {
                console.log("[LoginPage] google_users 존재, 바로 리다이렉트");
                const finalRedirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
                localStorage.removeItem(REDIRECT_KEY);
                router.push(finalRedirectPath);
              } else {
                console.log("[LoginPage] google_users 없음, 전화번호 입력 단계로 이동");
                setStep("phone");
              }
            };
            checkGoogleUser();
          }
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
          setStep("login");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router.query.from, router]);

  /** UI 렌더링 */
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
              <S.Subtitle>한번 연동된 계정은 변경이 어려우니 잘 선택해주세요.</S.Subtitle>
              <S.GoogleLoginButton
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
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
              <S.LoginButton
                onClick={handlePhoneSubmit}
                disabled={loading}
              >
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
                  이미 해당 전화번호로 연결된 구글 계정이 있습니다.<br/>
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