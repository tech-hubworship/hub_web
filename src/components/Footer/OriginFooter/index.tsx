import { useRouter } from "next/router";
import { FC, useState } from "react";
import Link from "next/link";
import ArrowRight from "@src/assets/icons/arrow_right_16x16.svg";
import Channels from "@src/components/Footer/Channels";
import * as St from "./style";

const OriginFooter: FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setMessage("");
    setSendSuccess(false);
    setSendError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setSendError("메시지를 입력해주세요.");
      return;
    }

    setSending(true);
    setSendError("");

    try {
      const response = await fetch('/api/tech-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          inquiryType: 'general',
          pageUrl: window.location.pathname
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 에러 상세 정보 콘솔에 출력
        console.error('API 에러:', data);
        
        // 사용자에게 보여줄 에러 메시지
        const errorMessage = data.error || '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
        
        throw new Error(errorMessage);
      }
      
      setSendSuccess(true);
      setMessage("");
      setTimeout(() => {
        setIsModalOpen(false);
        setSendSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error("문의사항 저장 오류:", error);
      setSendError(error.message || "메시지 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <St.Root>
      <St.ContentWrap>
        <div>
          <St.TitleButton onClick={handleClick}>
            <span>테크팀에게 한마디(버그, 문의사항)</span>
            <ArrowRight />
          </St.TitleButton>
          <St.LegalLinks>
            <Link href="/law/intro" passHref legacyBehavior>
              <St.LegalLink>사이트 소개</St.LegalLink>
            </Link>
            <Link href="/law/terms" passHref legacyBehavior>
              <St.LegalLink>이용약관</St.LegalLink>
            </Link>
            <Link href="/law/privacy" passHref legacyBehavior>
              <St.LegalLink>개인정보 처리방침</St.LegalLink>
            </Link>
          </St.LegalLinks>
          <St.CopyrightText>
            HUB TECH
            <br />
            Copyrightⓒ2025.HUB. All rights reserved.
          </St.CopyrightText>
        </div>
        
        
        <St.ChannelsWrap>
          <St.ChannelTitleText>HUB 채널 바로가기</St.ChannelTitleText>
          <Channels isFooter={true} />
        </St.ChannelsWrap>
      </St.ContentWrap>

      {isModalOpen && (
        <St.ModalOverlay onClick={handleClose}>
          <St.ModalContent onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => e.stopPropagation()}>
            <St.ModalHeader>
              <St.ModalTitle>테크팀에게 한마디(버그, 문의사항)</St.ModalTitle>
              <St.CloseButton onClick={handleClose}>×</St.CloseButton>
            </St.ModalHeader>
            
            <St.ModalBody>
              {sending ? (
                <St.LoadingContainer>
                  <St.LoadingSpinner />
                  <St.LoadingText>제출 중입니다...</St.LoadingText>
                </St.LoadingContainer>
              ) : sendSuccess ? (
                <St.SuccessMessage>
                  <St.SuccessIcon>✓</St.SuccessIcon>
                  <div>제출완료되었습니다</div>
                  <div>감사합니다.</div>
                  <St.FeedbackLink>
                    <St.FeedbackLinkText>
                      관리자 피드백은 "내 문의사항" 페이지에서 확인하실 수 있습니다.
                    </St.FeedbackLinkText>
                    <St.FeedbackLinkButton
                      onClick={() => {
                        router.push('/tech-inquiry-feedback');
                        setIsModalOpen(false);
                      }}
                    >
                      내 문의사항 확인하기
                    </St.FeedbackLinkButton>
                  </St.FeedbackLink>
                </St.SuccessMessage>
              ) : (
                <>
                  <St.TextArea 
                    value={message}
                    onChange={handleChange}
                    placeholder="버그 제보나 문의사항을 익명으로 남겨주세요. 예) 페이지 로딩이 느려요, 특정 기능이 작동하지 않아요 등"
                    disabled={sending}
                  />
                  {sendError && <St.ErrorMessage>{sendError}</St.ErrorMessage>}
                  <St.SubmitButton onClick={handleSubmit} disabled={sending}>
                    제출
                  </St.SubmitButton>
                </>
              )}
            </St.ModalBody>
          </St.ModalContent>
        </St.ModalOverlay>
      )}
    </St.Root>
  );
};

export default OriginFooter;
