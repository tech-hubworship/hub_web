import { useEffect, useState } from "react";
import { FaqItem, getMainPageFaqs } from "@src/lib/api/faq";
import FaqSection from "../FaqSection";
import * as S from "./style";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLoading } from "@src/contexts/LoadingContext";

function RulesList() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { startLoading } = useLoading();

  useEffect(() => {
    async function loadFaqs() {
      try {
        const data = await getMainPageFaqs();
        setFaqs(data);
      } catch (error) {
        console.error("FAQ 로드 중 오류:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFaqs();
  }, []);

  // 전체보기 버튼 클릭 핸들러
  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    startLoading(); // 전역 로딩 상태 활성화
    
    // 약간의 지연 후 페이지 이동
    setTimeout(() => {
      router.push('/FAQ');
    }, 100);
  };

  if (loading) {
    return <S.LoadingText>FAQ 불러오는 중...</S.LoadingText>;
  }

  return (
    <>
      <S.Ul>
        {faqs.length > 0 ? (
          faqs.map((item) => (
            <FaqSection
              key={item.id}
              tag={item.tag}
              title={item.title}
              contents={item.contents}
            />
          ))
        ) : (
          <S.NoData>FAQ 정보가 없습니다.</S.NoData>
        )}
      </S.Ul>
      <S.ViewAllButton onClick={handleViewAll}>
        <S.ButtonText>전체보기</S.ButtonText>
      </S.ViewAllButton>
    </>
  );
}

export default RulesList;
