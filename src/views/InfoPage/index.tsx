import PageLayout from "@src/components/common/PageLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@src/lib/supabase";
import Head from "next/head";
import * as S from "./style";

// 사용자 데이터 타입 정의
interface UserData {
  id: number;
  name: string;
  birth_date: string;
  phone_number: string;
  cell_name: string;
  leader_name: string;
  status: string;
  last_login_at: string;
}

export default function MyInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Supabase auth user
  const [userData, setUserData] = useState<UserData | null>(null); // public.users table user
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 오류:", error);
      setError("로그아웃에 실패했습니다.");
    } else {
      router.push("/login");
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        // 인증되지 않았으면 로그인 페이지로 리다이렉트
        console.error("사용자 인증 실패:", authError?.message);
        router.push("/login");
        return;
      }
      
      setUser(authUser);

      try {
        // google_users에서 phone_number 조회 (auth.uid로 접근)
        const { data: gUser, error: gError } = await supabase
          .from("google_users")
          .select("phone_number")
          .eq("uuid", authUser.id)
          .maybeSingle();

        if (gError || !gUser) {
          console.error("Google user not found:", gError?.message);
          router.push("/login"); // 매핑된 유저가 없으면 로그인 페이지로
          return;
        }

        // users 테이블에서 상세 정보 조회 (RLS 정책에 의해 접근 가능)
        const { data: dbUser, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("phone_number", gUser.phone_number)
          .maybeSingle();
        
        if (dbError || !dbUser) {
          console.error("DB users table not found:", dbError?.message);
          setError("사용자 정보를 찾을 수 없습니다.");
          return;
        }

        setUserData(dbUser as UserData);
      } catch (e: any) {
        console.error("데이터 로드 오류:", e);
        setError("사용자 정보를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);
  
  if (loading) {
    return (
      <PageLayout>
        <S.Wrapper>
          <S.LoadingText>정보를 불러오는 중...</S.LoadingText>
        </S.Wrapper>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <S.Wrapper>
          <S.ErrorMessage>{error}</S.ErrorMessage>
          <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
        </S.Wrapper>
      </PageLayout>
    );
  }

  if (!userData) {
    return (
      <PageLayout>
        <S.Wrapper>
          <S.NoDataText>사용자 정보가 없습니다.</S.NoDataText>
        </S.Wrapper>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head>
        <title>내 정보</title>
      </Head>
      <S.Wrapper>
        <S.Title>내 정보</S.Title>
        <S.Card>
          <S.ProfileImage src={`https://www.gravatar.com/avatar/${user?.id}?d=retro`} alt="프로필 이미지" />
          <S.InfoWrapper>
            <S.InfoItem>
              <S.Label>이름</S.Label>
              <S.Value>{userData.name}</S.Value>
            </S.InfoItem>
            <S.InfoItem>
              <S.Label>전화번호</S.Label>
              <S.Value>{userData.phone_number}</S.Value>
            </S.InfoItem>
            <S.InfoItem>
              <S.Label>생년월일</S.Label>
              <S.Value>{userData.birth_date}</S.Value>
            </S.InfoItem>
            <S.InfoItem>
              <S.Label>다락방</S.Label>
              <S.Value>{userData.cell_name}</S.Value>
            </S.InfoItem>
            <S.InfoItem>
              <S.Label>순장</S.Label>
              <S.Value>{userData.leader_name}</S.Value>
            </S.InfoItem>
          </S.InfoWrapper>
          <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
        </S.Card>
      </S.Wrapper>
    </PageLayout>
  );
}