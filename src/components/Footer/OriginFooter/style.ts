import styled from '@emotion/styled';
import { colors } from '@sopt-makers/colors';

export const Root = styled.footer`
  width: 100%;
  min-height: 162px;
  background-color: #202020;

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

  color: ${colors.gray10};
  font-size: 14rem;
  font-weight: 700;

  span {
    margin-right: 5px;
    font-size: 100%;
  }
`;

export const CopyrightText = styled.p`
  width: 100%;
  margin-top: 25px;
  line-height: 180%;
  font-size: 14rem;
  font-weight: 400;

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    font-size: 12rem;
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
  font-size: 16rem;
  font-weight: 500;

  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    margin-bottom: 20px;
  }
`;

// 모달 스타일 컴포넌트
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  /* 모바일 뷰 */
  @media (max-width: 47.86875rem) {
    width: 85%;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
`;

export const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #000;
  }
`;

export const ModalBody = styled.div`
  padding: 20px;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #fff;
  }
`;

export const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
`;

export const SubmitButton = styled.button`
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color:rgb(40, 40, 40);
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export const SuccessMessage = styled.p`
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  margin: 20px 0;
`;
