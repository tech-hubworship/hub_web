import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import Head from "next/head";
import PageLayout from "@src/components/common/PageLayout";
import * as S from "@src/views/LoginPage/style";
import { FaGoogle } from "react-icons/fa";

const REDIRECT_KEY = "login_redirect";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user?.isNewUser) {
        router.replace("/signup");
      } else {
        const redirectPath = localStorage.getItem(REDIRECT_KEY) || "/Info";
        localStorage.removeItem(REDIRECT_KEY);
        router.replace(redirectPath);
      }
    }
  }, [status, session, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <PageLayout>
        <S.Wrapper><S.LoginCard><S.Title>로그인 정보를 확인 중입니다...</S.Title></S.LoginCard></S.Wrapper>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head><title>로그인</title></Head>
      <S.Wrapper>
        <S.LoginCard>
          <S.Title>로그인하고 모든 서비스를 이용해보세요</S.Title>
          <S.Subtitle>구글 계정을 통해 간편하게 시작할 수 있습니다.</S.Subtitle>
          <S.GoogleLoginButton type="button" onClick={() => signIn('google')}>
            <FaGoogle /> Google 계정으로 로그인
          </S.GoogleLoginButton>
        </S.LoginCard>
      </S.Wrapper>
    </PageLayout>
  );
}