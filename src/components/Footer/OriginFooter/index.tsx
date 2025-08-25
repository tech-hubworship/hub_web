import { useRouter } from "next/router";
import { FC, useState } from "react";
import ArrowRight from "@src/assets/icons/arrow_right_16x16.svg";
import Channels from "@src/components/Footer/Channels";
import * as St from "./style";
import { supabase } from "@src/lib/supabase";

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
      // inquiries 테이블이 없는 경우를 대비한 에러 처리
      const { error } = await supabase
        .from('inquiries')
        .insert([
          { 
            message: message.trim(),
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error("문의사항 저장 오류:", error);
        if (error.code === "42P01") {  // 테이블이 없는 경우
          // 테이블 생성 시도 (관리자 권한이 필요하므로 실패할 수 있음)
          try {
            await supabase.rpc('create_inquiries_table');
            // 테이블 생성 후 다시 저장 시도
            const { error: insertError } = await supabase
              .from('inquiries')
              .insert([
                { 
                  message: message.trim(),
                  created_at: new Date().toISOString()
                }
              ]);
            
            if (insertError) throw insertError;
          } catch (createTableError) {
            console.error("테이블 생성 오류:", createTableError);
            throw createTableError;
          }
        } else {
          throw error;
        }
      }

      setSendSuccess(true);
      setMessage("");
      setTimeout(() => {
        setIsModalOpen(false);
        setSendSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("문의사항 저장 오류:", error);
      setSendError("메시지 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <St.Root>
      <St.ContentWrap>
        <div>
          <St.TitleButton onClick={handleClick}>
            <span>개발자에게 한마디(익명)</span>
            <ArrowRight />
          </St.TitleButton>
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
              <St.ModalTitle>개발자에게 한마디(익명)</St.ModalTitle>
              <St.CloseButton onClick={handleClose}>×</St.CloseButton>
            </St.ModalHeader>
            
            <St.ModalBody>
              {!sendSuccess ? (
                <>
                  <St.TextArea 
                    value={message}
                    onChange={handleChange}
                    placeholder="개발자에게 문의하실 내용이나 의견을 남겨주세요."
                    disabled={sending}
                  />
                  {sendError && <St.ErrorMessage>{sendError}</St.ErrorMessage>}
                  <St.SubmitButton onClick={handleSubmit} disabled={sending}>
                    {sending ? "전송 중..." : "보내기"}
                  </St.SubmitButton>
                </>
              ) : (
                <St.SuccessMessage>
                  메시지가 성공적으로 전송되었습니다!
                </St.SuccessMessage>
              )}
            </St.ModalBody>
          </St.ModalContent>
        </St.ModalOverlay>
      )}
    </St.Root>
  );
};

export default OriginFooter;
