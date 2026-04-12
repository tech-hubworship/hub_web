import styled from '@emotion/styled';
import { colors } from '@sopt-makers/colors';

export const Root = styled.footer<{ variant?: "default" | "dark" }>`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  min-height: 162px;
  background-color: ${({ variant }) => (variant === "dark" ? "#121212" : "#202020")};
  position: relative;
  z-index: 2;
  ${({ variant }) =>
    variant === "dark" &&
    `
    padding-bottom: env(safe-area-inset-bottom, 0);
  `}

  /* 태블릿 + 데스크탑 뷰 */
  @media (min-width: 47.875rem) {
    scroll-snap-align: center;
    padding-left: 40px;
  }

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    height: 264px;
  }
`;

export const ContentWrap = styled.div`
  display: flex;
  justify-content: space-between;

  /* 데스크탑 뷰 */
  @media (min-width: 75rem) {
    max-width: 1100px;
    margin: 0px auto;
    padding-top: 35px;
  }

  /* 태블릿 뷰 */
  @media (max-width: 74.9375rem) and (min-width: 47.875rem) {
    margin: 0px 40px;
    padding-top: 35px;
  }

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    display: block;

    padding-top: 30px;
    /* padding-left: 9px; */
    padding-left: 8%;
    width: 327px;
  }
`;


export const TitleButton = styled.button`
  cursor: pointer;
  line-height: 20px;
  display: flex;
  align-items: center;

  color: #ffffff;
  font-size: 14px;
  font-weight: 700;

  span {
    margin-right: 5px;
    font-size: 100%;
  }
`;

export const LegalLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 20px;
  flex-wrap: wrap;

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    gap: 12px;
  }
`;

export const LegalLink = styled.a`
  font-size: 12px;
  font-weight: 400;
  color: #ffffff;
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    font-size: 10px;
  }
`;

export const CopyrightText = styled.p`
  width: 100%;
  margin-top: 12px;
  line-height: 180%;
  font-size: 12px;
  font-weight: 400;
  color: #ffffff;

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    font-size: 10px;
  }
`;

export const ChannelsWrap = styled.div`
  width: 190px;
  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    margin-top: 40px;
  }
`;

export const ChannelTitleText = styled.p`
  margin-bottom: 25px;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    margin-bottom: 20px;
  }
`;

// 문의하기 모달 스타일
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

export const ModalContent = styled.div`
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04);
  
  @media (max-width: 47.86875rem) {
    width: calc(100% - 32px);
    margin: 16px;
    border-radius: 12px;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

export const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.02em;
`;

export const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0.04);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #1a1a1a;
  }
`;

export const ModalBody = styled.div`
  padding: 24px;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 160px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.12);
  }
`;

export const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 14px;
  margin: -8px 0 16px;
`;

export const SubmitButton = styled.button`
  width: 100%;
  background: linear-gradient(180deg, #0066ff 0%, #0052cc 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  
  &:hover:not(:disabled) {
    opacity: 0.95;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export const SuccessMessage = styled.div`
  text-align: center;
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  margin-bottom: 4px;
  animation: scaleIn 0.35s ease-out;
  
  @keyframes scaleIn {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.08); }
    100% { transform: scale(1); opacity: 1; }
  }
`;

export const SuccessTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
`;

export const SuccessSub = styled.div`
  font-size: 15px;
  color: #666;
  line-height: 1.5;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
`;

export const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoadingText = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #666;
`;

export const FeedbackLink = styled.div`
  margin-top: 24px;
  padding: 20px;
  background: rgba(0, 102, 255, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(0, 102, 255, 0.12);
  text-align: center;
  width: 100%;
`;

export const FeedbackLinkTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
`;

export const FeedbackLinkText = styled.div`
  font-size: 14px;
  color: #555;
  margin-bottom: 14px;
  line-height: 1.5;
`;

export const FeedbackLinkButton = styled.button`
  background: linear-gradient(180deg, #0066ff 0%, #0052cc 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  
  &:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const FeedbackLinkUrl = styled.div`
  font-size: 11px;
  color: #999;
  word-break: break-all;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-family: monospace;
`;
