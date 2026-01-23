"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import PageLayout from "@src/components/common/PageLayout";
import * as S from "@src/styles/tech-inquiry-feedback-style";

interface InquiryFeedback {
  id: number;
  message: string;
  inquiry_type: string;
  status: string;
  admin_response?: string;
  response_at?: string;
  created_at: string;
  page_url?: string;
  has_response: boolean;
}

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  bug: "버그",
  inquiry: "문의",
  suggestion: "제안",
  general: "일반",
};

const STATUS_LABELS: Record<string, string> = {
  new: "신규",
  in_progress: "처리중",
  resolved: "해결됨",
  closed: "종료",
};

export default function ClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const idParam = searchParams?.get("id");
  const selectedId = useMemo(() => {
    if (!idParam) return null;
    const n = parseInt(idParam, 10);
    return Number.isNaN(n) ? null : n;
  }, [idParam]);

  const [inquiries, setInquiries] = useState<InquiryFeedback[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryFeedback | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?redirect=/tech-inquiry-feedback");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      return;
    }

    const fetchInquiries = async () => {
      try {
        const response = await fetch("/api/tech-inquiries/my-inquiries");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "문의사항을 불러오는데 실패했습니다.");
        }

        setInquiries(result.data || []);

        if (selectedId) {
          const inquiry = result.data?.find((inq: InquiryFeedback) => inq.id === selectedId);
          if (inquiry) setSelectedInquiry(inquiry);
        }
      } catch (err: any) {
        setError(err.message || "문의사항을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, [sessionStatus, session?.user?.id, selectedId]);

  if (sessionStatus === "loading" || loading) {
    return (
      <PageLayout>
        <S.Container>
          <S.LoadingState>
            <S.Spinner />
            <p>로딩 중...</p>
          </S.LoadingState>
        </S.Container>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <S.Container>
          <S.ErrorState>
            <S.ErrorIcon>⚠️</S.ErrorIcon>
            <S.ErrorTitle>오류가 발생했습니다</S.ErrorTitle>
            <S.ErrorMessage>{error}</S.ErrorMessage>
            <S.BackButton onClick={() => router.push("/")}>
              홈으로 돌아가기
            </S.BackButton>
          </S.ErrorState>
        </S.Container>
      </PageLayout>
    );
  }

  const displayInquiry = selectedInquiry || (inquiries.length > 0 ? inquiries[0] : null);

  return (
    <PageLayout>
      <S.Container>
        <S.Header>
          <S.Title>💬 내 문의사항</S.Title>
          <S.Subtitle>
            제출하신 문의사항과 관리자 피드백을 확인하실 수 있습니다
          </S.Subtitle>
        </S.Header>

        {inquiries.length === 0 ? (
          <S.Card>
            <S.EmptyState>
              <S.EmptyIcon>📝</S.EmptyIcon>
              <S.EmptyTitle>문의사항이 없습니다</S.EmptyTitle>
              <S.EmptyText>아직 제출한 문의사항이 없습니다.</S.EmptyText>
              <S.BackButton onClick={() => router.push("/")}>
                홈으로 돌아가기
              </S.BackButton>
            </S.EmptyState>
          </S.Card>
        ) : (
          <>
            {inquiries.length > 1 && (
              <S.InquiryList>
                <S.ListTitle>문의사항 목록</S.ListTitle>
                {inquiries.map((inquiry) => (
                  <S.InquiryItem
                    key={inquiry.id}
                    active={selectedInquiry?.id === inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <S.InquiryItemHeader>
                      <S.InquiryItemType>
                        {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
                      </S.InquiryItemType>
                      <S.InquiryItemStatus status={inquiry.status}>
                        {STATUS_LABELS[inquiry.status] || inquiry.status}
                      </S.InquiryItemStatus>
                      {inquiry.has_response && (
                        <S.Badge status="resolved" style={{ fontSize: "10px" }}>
                          답변완료
                        </S.Badge>
                      )}
                    </S.InquiryItemHeader>
                    <S.InquiryItemMessage>
                      {inquiry.message.length > 100
                        ? `${inquiry.message.substring(0, 100)}...`
                        : inquiry.message}
                    </S.InquiryItemMessage>
                    <S.InquiryItemDate>
                      {new Date(inquiry.created_at).toLocaleDateString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </S.InquiryItemDate>
                  </S.InquiryItem>
                ))}
              </S.InquiryList>
            )}

            {displayInquiry && (
              <S.Card>
                <S.Section>
                  <S.SectionTitle>문의 정보</S.SectionTitle>
                  <S.InfoGrid>
                    <S.InfoItem>
                      <S.InfoLabel>문의 유형</S.InfoLabel>
                      <S.Badge>
                        {INQUIRY_TYPE_LABELS[displayInquiry.inquiry_type] ||
                          displayInquiry.inquiry_type}
                      </S.Badge>
                    </S.InfoItem>
                    <S.InfoItem>
                      <S.InfoLabel>처리 상태</S.InfoLabel>
                      <S.Badge status={displayInquiry.status}>
                        {STATUS_LABELS[displayInquiry.status] || displayInquiry.status}
                      </S.Badge>
                    </S.InfoItem>
                    <S.InfoItem>
                      <S.InfoLabel>제출일</S.InfoLabel>
                      <S.InfoValue>
                        {new Date(displayInquiry.created_at).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })}
                      </S.InfoValue>
                    </S.InfoItem>
                  </S.InfoGrid>
                </S.Section>

                <S.Section>
                  <S.SectionTitle>문의 내용</S.SectionTitle>
                  <S.MessageBox>{displayInquiry.message}</S.MessageBox>
                  {displayInquiry.page_url && (
                    <S.InfoText>
                      <strong>제출한 페이지:</strong> {displayInquiry.page_url}
                    </S.InfoText>
                  )}
                </S.Section>

                {displayInquiry.has_response && displayInquiry.admin_response ? (
                  <S.Section>
                    <S.SectionTitle>
                      ✅ 관리자 피드백
                      {displayInquiry.response_at && (
                        <S.ResponseDate>
                          (
                          {new Date(displayInquiry.response_at).toLocaleString("ko-KR", {
                            timeZone: "Asia/Seoul",
                          })}
                          )
                        </S.ResponseDate>
                      )}
                    </S.SectionTitle>
                    <S.ResponseBox>{displayInquiry.admin_response}</S.ResponseBox>
                  </S.Section>
                ) : (
                  <S.Section>
                    <S.SectionTitle>관리자 피드백</S.SectionTitle>
                    <S.WaitingBox>
                      <S.WaitingIcon>⏳</S.WaitingIcon>
                      <S.WaitingText>아직 관리자 피드백이 없습니다.</S.WaitingText>
                      <S.WaitingSubtext>
                        관리자가 검토 후 피드백을 드릴 예정입니다.
                      </S.WaitingSubtext>
                    </S.WaitingBox>
                  </S.Section>
                )}

                <S.Footer>
                  <S.BackButton onClick={() => router.push("/")}>
                    홈으로 돌아가기
                  </S.BackButton>
                </S.Footer>
              </S.Card>
            )}
          </>
        )}
      </S.Container>
    </PageLayout>
  );
}

