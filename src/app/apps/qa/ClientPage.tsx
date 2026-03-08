"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import dynamic from "next/dynamic";
import { useInquiryModal } from "@src/contexts/InquiryModalContext";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

const theme = {
  primary: "#0066ff",
  text: "#1f2a5c",
  textSecondary: "rgba(31, 42, 92, 0.7)",
  textTertiary: "rgba(31, 42, 92, 0.5)",
  border: "rgba(31, 42, 92, 0.12)",
  white: "#ffffff",
  grayHover: "rgba(31, 42, 92, 0.06)",
};

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

export default function QAClientPage() {
  const router = useRouter();
  const { openModal: openInquiryModal } = useInquiryModal();
  const { data: session, status: sessionStatus } = useSession();
  const [inquiries, setInquiries] = useState<InquiryFeedback[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false); // 로딩 최소 표시 후 콘텐츠 전환

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?redirect=/apps/qa");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) return;
    const fetchInquiries = async () => {
      try {
        const res = await fetch("/api/tech-inquiries/my-inquiries");
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "문의사항을 불러오지 못했습니다.");
        setInquiries(result.data || []);
      } catch (err: unknown) {
        setError((err as Error)?.message || "문의사항을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, [sessionStatus, session?.user?.id]);

  // 로딩이 끝나도 최소 400ms 로딩 UI 유지 후 콘텐츠 표시 → 깜빡임 감소
  const isLoading = sessionStatus === "loading" || loading;
  React.useEffect(() => {
    if (!isLoading && !error) {
      const t = setTimeout(() => setShowContent(true), 400);
      return () => clearTimeout(t);
    }
    if (isLoading) setShowContent(false);
  }, [isLoading, error]);

  const openDetail = (inq: InquiryFeedback) => setSelectedInquiry(inq);
  const closeDetail = () => setSelectedInquiry(null);

  const showLoadingState = isLoading || (!showContent && !error);

  return (
    <>
      <Global styles={globalStyles} />
      <Container>
        <HeaderRow>
          <TitleBlock>
            <Title className="header-title">💬 문의사항</Title>
            <Subtitle className="header-subtitle">제출한 문의와 관리자 답변을 확인하세요</Subtitle>
          </TitleBlock>
          <InquiryButton type="button" onClick={openInquiryModal}>
            문의하기
          </InquiryButton>
        </HeaderRow>

        <ContentWrap>
          {error ? (
            <Card>
              <ErrorState>
                <ErrorIcon>⚠️</ErrorIcon>
                <ErrorTitle>오류가 발생했습니다</ErrorTitle>
                <ErrorMessage>{error}</ErrorMessage>
                <BackButton onClick={() => router.push("/apps")}>앱 목록으로</BackButton>
              </ErrorState>
            </Card>
          ) : showLoadingState ? (
            <LoadingWrap>
              <LoadingCard>
                <LoadingIconWrap>💬</LoadingIconWrap>
                <LoadingSpinner />
                <LoadingText>문의사항을 불러오는 중</LoadingText>
                <LoadingSub>잠시만 기다려 주세요</LoadingSub>
              </LoadingCard>
            </LoadingWrap>
          ) : (
            <ContentFadeIn>
          {inquiries.length === 0 ? (
            <Card style={{ width: "100%" }}>
              <EmptyState>
                <EmptyIcon>📝</EmptyIcon>
                <EmptyTitle>문의사항이 없습니다</EmptyTitle>
                <EmptyText>아직 제출한 문의가 없습니다. 위 「문의하기」 버튼이나 푸터에서 문의할 수 있습니다.</EmptyText>
                <BackButton onClick={() => router.push("/apps")}>앱 목록으로</BackButton>
              </EmptyState>
            </Card>
          ) : (
            <ListCard>
              <ListTitle>문의 목록</ListTitle>
              <BoardTable>
                <BoardThead>
                  <tr>
                    <BoardTh $width={48}>번호</BoardTh>
                    <BoardTh $width={80}>유형</BoardTh>
                    <BoardTh>내용</BoardTh>
                    <BoardTh $width={88}>답변상태</BoardTh>
                    <BoardTh $width={100}>날짜</BoardTh>
                  </tr>
                </BoardThead>
                <BoardTbody>
                  {inquiries.map((inq, index) => (
                    <BoardTr key={inq.id} onClick={() => openDetail(inq)}>
                      <BoardTd $center>{inquiries.length - index}</BoardTd>
                      <BoardTd>
                        <ItemType>{INQUIRY_TYPE_LABELS[inq.inquiry_type] || inq.inquiry_type}</ItemType>
                      </BoardTd>
                      <BoardTd $ellipsis title={inq.message}>
                        {inq.message.length > 50 ? `${inq.message.slice(0, 50)}...` : inq.message}
                      </BoardTd>
                      <BoardTd>
                        <ResponseBadge $done={inq.has_response}>
                          {inq.has_response ? "답변 완료" : "답변 대기"}
                        </ResponseBadge>
                      </BoardTd>
                      <BoardTd $center>
                        {new Date(inq.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                      </BoardTd>
                    </BoardTr>
                  ))}
                </BoardTbody>
              </BoardTable>
            </ListCard>
          )}
            </ContentFadeIn>
          )}
        </ContentWrap>

        {selectedInquiry && (
          <ModalOverlay onClick={closeDetail}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>문의 상세</ModalTitle>
                <CloseButton type="button" onClick={closeDetail} aria-label="닫기">
                  ✕
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <SectionTitle>문의 정보</SectionTitle>
                <InfoRow>
                  <InfoLabel>유형</InfoLabel>
                  <Badge>{INQUIRY_TYPE_LABELS[selectedInquiry.inquiry_type] || selectedInquiry.inquiry_type}</Badge>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>상태</InfoLabel>
                  <Badge $status={selectedInquiry.status}>
                    {STATUS_LABELS[selectedInquiry.status] || selectedInquiry.status}
                  </Badge>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>제출일</InfoLabel>
                  <InfoValue>
                    {new Date(selectedInquiry.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                  </InfoValue>
                </InfoRow>

                <SectionTitle>문의 내용</SectionTitle>
                <MessageBox>{selectedInquiry.message}</MessageBox>
                {selectedInquiry.page_url && (
                  <PageUrl>제출한 페이지: {selectedInquiry.page_url}</PageUrl>
                )}

                {selectedInquiry.has_response && selectedInquiry.admin_response ? (
                  <>
                    <SectionTitle>
                      ✅ 관리자 답변
                      {selectedInquiry.response_at && (
                        <ResponseDate>
                          ({new Date(selectedInquiry.response_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})
                        </ResponseDate>
                      )}
                    </SectionTitle>
                    <ResponseBox>{selectedInquiry.admin_response}</ResponseBox>
                  </>
                ) : (
                  <>
                    <SectionTitle>관리자 답변</SectionTitle>
                    <WaitingBox>
                      <WaitingIcon>⏳</WaitingIcon>
                      <WaitingText>아직 답변이 없습니다.</WaitingText>
                      <WaitingSub>검토 후 답변 드리겠습니다.</WaitingSub>
                    </WaitingBox>
                  </>
                )}
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
      <Footer />
    </>
  );
}

const globalStyles = css`
  .hub-qa-page {
    -webkit-tap-highlight-color: transparent;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #f7f8fb 0%, #eff2f8 50%, #e0e7ff 100%);
  padding: 44px 20px 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
`;

const Title = styled.h1`
  font-size: 38px;
  font-weight: 800;
  color: ${theme.text};
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
  @media (max-width: 768px) {
    font-size: 26px;
  }
`;

const Subtitle = styled.p`
  font-size: 17px;
  color: ${theme.textSecondary};
  text-align: center;
  margin-bottom: 30px;
  max-width: 460px;
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 22px;
  }
`;

const TitleBlock = styled.div`
  flex: 1;
  min-width: 0;
  .header-title {
    text-align: left;
    margin-bottom: 4px;
  }
  .header-subtitle {
    text-align: left;
    margin-bottom: 0;
  }
  @media (max-width: 768px) {
    .header-title,
    .header-subtitle {
      text-align: center;
    }
  }
`;

const HeaderRow = styled.div`
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InquiryButton = styled.button`
  background: linear-gradient(180deg, ${theme.primary} 0%, #0052cc 100%);
  color: ${theme.white};
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.15s;
  &:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ContentWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (min-width: 1024px) {
    flex-direction: row;
    gap: 32px;
    align-items: flex-start;
  }
`;

const Card = styled.div`
  background: ${theme.white};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }
`;

const ListCard = styled(Card)`
  width: 100%;
  overflow-x: auto;
`;

const ListTitle = styled.h2`
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: ${theme.text};
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const BoardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const BoardThead = styled.thead`
  background: rgba(31, 42, 92, 0.06);
  border-bottom: 2px solid ${theme.border};
`;

const BoardTh = styled.th<{ $width?: number }>`
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  color: ${theme.text};
  white-space: nowrap;
  ${(p) => p.$width && `width: ${p.$width}px;`}
  &:first-child,
  &:last-child {
    text-align: center;
  }
`;

const BoardTbody = styled.tbody``;

const BoardTr = styled.tr`
  cursor: pointer;
  border-bottom: 1px solid ${theme.border};
  transition: background 0.15s ease;
  &:hover {
    background: rgba(0, 102, 255, 0.04);
  }
  &:last-child {
    border-bottom: none;
  }
`;

const BoardTd = styled.td<{ $center?: boolean; $ellipsis?: boolean }>`
  padding: 14px 10px;
  color: ${theme.textSecondary};
  vertical-align: middle;
  ${(p) => p.$center && "text-align: center;"}
  ${(p) => p.$ellipsis && "max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"}
`;

const ItemType = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #5b21b6;
  background: #ede9fe;
  padding: 4px 10px;
  border-radius: 6px;
`;

const ResponseBadge = styled.span<{ $done: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
  background: ${(p) => (p.$done ? "#d1fae5" : "#fef3c7")};
  color: ${(p) => (p.$done ? "#065f46" : "#92400e")};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: ${theme.white};
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${theme.border};
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: ${theme.text};
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: ${theme.grayHover};
  color: ${theme.textSecondary};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  &:hover {
    background: ${theme.border};
    color: ${theme.text};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: ${theme.text};
  &:not(:first-of-type) {
    margin-top: 24px;
  }
`;

const ResponseDate = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${theme.textSecondary};
  margin-left: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textSecondary};
  min-width: 56px;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: ${theme.text};
`;

const Badge = styled.span<{ $status?: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${(p) => {
    if (!p.$status) return "#f1f5f9";
    switch (p.$status) {
      case "new": return "#dbeafe";
      case "in_progress": return "#fef3c7";
      case "resolved": return "#d1fae5";
      case "closed": return "#fee2e2";
      default: return "#f1f5f9";
    }
  }};
  color: ${(p) => {
    if (!p.$status) return "#475569";
    switch (p.$status) {
      case "new": return "#1e40af";
      case "in_progress": return "#92400e";
      case "resolved": return "#065f46";
      case "closed": return "#991b1b";
      default: return "#475569";
    }
  }};
`;

const MessageBox = styled.div`
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid ${theme.border};
  font-size: 15px;
  line-height: 1.7;
  color: ${theme.text};
  white-space: pre-wrap;
  word-break: break-word;
`;

const PageUrl = styled.div`
  margin-top: 10px;
  font-size: 13px;
  color: ${theme.textSecondary};
`;

const ResponseBox = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 2px solid #3b82f6;
  font-size: 15px;
  line-height: 1.7;
  color: ${theme.text};
  white-space: pre-wrap;
  word-break: break-word;
`;

const WaitingBox = styled.div`
  padding: 32px 20px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
`;

const WaitingIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

const WaitingText = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
`;

const WaitingSub = styled.div`
  font-size: 14px;
  color: #64748b;
`;

const FooterRow = styled.div`
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid ${theme.border};
  display: flex;
  justify-content: center;
`;

const BackButton = styled.button`
  padding: 12px 24px;
  background: ${theme.primary};
  color: ${theme.white};
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    filter: brightness(1.05);
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
  }
`;

const LoadingWrap = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
  padding: 24px;
`;

const ContentFadeIn = styled.div`
  width: 100%;
  animation: contentFadeIn 0.35s ease-out;
  @keyframes contentFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LoadingCard = styled.div`
  background: ${theme.white};
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 42, 92, 0.08);
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-width: 280px;
  @media (max-width: 768px) {
    padding: 40px 24px;
    gap: 20px;
  }
`;

const LoadingIconWrap = styled.div`
  font-size: 48px;
  line-height: 1;
  opacity: 0.9;
  @media (max-width: 768px) {
    font-size: 40px;
  }
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid ${theme.border};
  border-top-color: ${theme.primary};
  border-radius: 50%;
  animation: loadingSpin 0.85s ease-in-out infinite;
  @keyframes loadingSpin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 18px;
  font-weight: 700;
  color: ${theme.text};
  margin: 0;
  letter-spacing: -0.02em;
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const LoadingSub = styled.p`
  font-size: 14px;
  color: ${theme.textSecondary};
  margin: 0;
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const ErrorState = styled.div`
  padding: 48px 20px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const ErrorTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${theme.text};
  margin: 0 0 8px;
`;

const ErrorMessage = styled.p`
  font-size: 15px;
  color: ${theme.textSecondary};
  margin: 0 0 20px;
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 56px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: ${theme.text};
  margin: 0 0 8px;
`;

const EmptyText = styled.p`
  font-size: 15px;
  color: ${theme.textSecondary};
  margin: 0 0 24px;
  line-height: 1.6;
`;
