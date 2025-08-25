import styled from '@emotion/styled';

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #FFFFFF;
  padding-top: 88px;
`;

export const Header = styled.div`
  padding: 0 20px;
  margin-bottom: 16px;
`;

export const Content = styled.main`
  padding: 0px 20px;
`;

export const Title = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 2px;
  white-space: pre-line;
  line-height: 37px;
  letter-spacing: -0.56px;
  color: #000000;
`;

export const Subtitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  line-height: 37px;
  letter-spacing: -0.32px;
  color: #A1A1A1;
  margin-bottom: 1px;
`;

export const Section = styled.section`
  margin-bottom: 40px;
`;

export const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 800;
  line-height: 37px;
  letter-spacing: -0.32px;
  color: #000000;
  margin-bottom: 16px;
  border-bottom: 1px solid #000000;
`;

export const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #D7D7D7;
`;

export const TimeBlock = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const TimeLabel = styled.span`
  font-size: 16px;
  font-weight: 400;
  letter-spacing: -0.32px;
  color: #898989;
  margin-bottom: 8px;
  text-align: center;
`;

export const Time = styled.span`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.48px;
  color: #000;
  text-align: center;
`;

export const Note = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 37px;
  letter-spacing: -0.32px;
  color: #666666;
  margin-top: 16px;
`;

export const TshirtInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
`;

export const QRCodeWrapper = styled.div`
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const OrderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const OrderDetail = styled.div`
  font-size: 16px;
  color: #333;
`;

export const OrderStatus = styled.div<{ status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  ${({ status }) => {
    switch (status) {
      case '입금확인중':
        return `
          background-color: #FFF3CD;
          color: #856404;
        `;
      case '입금완료':
        return `
          background-color: #D4EDDA;
          color: #155724;
        `;
      case '미입금':
        return `
          background-color: #F8D7DA;
          color: #721C24;
        `;
      case '지급대기':
        return `
          background-color: #CCE5FF;
          color: #004085;
        `;
      case '지급완료':
        return `
          background-color: #D1ECF1;
          color: #0C5460;
        `;
      case '주문확정':
        return `
          background-color: #DC3545;
          color: #FFFFFF;
        `;
      default:
        return `
          background-color: #E2E3E5;
          color: #383D41;
        `;
    }
  }}
`;

export const TshirtMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
  color: #666;
`;

export const InfoIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #666;
  font-size: 12px;
  font-style: italic;
`;

export const FaqButton = styled.button`
  width: 100%;
  height: 48px;
  color:#000;
  background-color: #FFFFFF;
  border: 1px solid #000000;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
`;

export const LogoutButton = styled.button`
  width: 100%;
  height: 48px;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  margin-top: 16px;
  margin-bottom: 40px;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

export const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  font-size: 16px;
  color: #666;
`;

export const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #666;
`;

export const RetryButton = styled.button`
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #333;
  }
`;

export const OrderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const SlideButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:first-of-type {
    left: 8px;
  }
  
  &:last-of-type {
    right: 8px;
  }
`;

export const OrderCount = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 8px;
`;

export const SubSlideButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

export const SubSlideButton = styled.button`
  font-size: 12px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #ebebeb;
  }
`;

export const ChangeNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #F8F8F8;
  border-radius: 4px;
  margin-top: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #EFEFEF;
  }
`;

export const ChangeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

export const ChangeText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  text-decoration: underline;
`;

export const TshirtStatusContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

interface StatusBoxProps {
  confirming?: boolean;
  notPaid?: boolean;
}

export const StatusBox = styled.div<StatusBoxProps>`
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  
  ${({ confirming, notPaid }) => {
    if (confirming) {
      return `
        background-color: #FFF3CD;
        color: #856404;
      `;
    }
    if (notPaid) {
      return `
        background-color: #F8D7DA;
        color: #721C24;
      `;
    }
    return '';
  }}
`;

export const CopyAccountButton = styled.button`
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

export const TshirtInfoList = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
`;

export const TshirtColor = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  margin-top: 16px;
  
  &:first-of-type {
    margin-top: 0;
  }
`;

export const TshirtSize = styled.div`
  font-size: 14px;
  margin-left: 16px;
  margin-bottom: 4px;
  color: #333;
`;

export const TshirtNote = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #000;
  margin-bottom: 16px;
  
  span {
    margin-left: 8px;
    text-decoration: underline;
  }
`;

// 티셔츠 주문 슬라이드 스타일
export const TshirtCarousel = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const OrderCardCarousel = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 20px;
`;

export const OrderCardsSlider = styled.div`
  display: flex;
  width: 100%;
  transition: transform 0.3s ease-out;
  
  &.dragging {
    transition: none;
  }
`;

export const OrderCard = styled.div`
  flex: 0 0 100%;
  width: 100%;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const OrderNumber = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  margin-bottom: 16px;
`;

export const OrderSummary = styled.div`
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

export const ItemColor = styled.div`
  font-size: 16px;
  font-weight: 700;
 
  
  &:first-of-type {
  }
`;

export const ItemInfo = styled.div`
  font-size: 14px;
  margin-left: 16px;
  margin-bottom: 4px;
  color: #333;
`;

export const ViewDetailText = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

export const ViewDetailIcon = styled.span`
  margin-left: 4px;
  font-size: 16px;
  font-weight: bold;
`;

export const CarouselIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
`;

interface IndicatorDotProps {
  active: boolean;
}

export const IndicatorDot = styled.div<IndicatorDotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#000' : '#ddd'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? '#000' : '#bbb'};
  }
`;

// 주문 확인서 스타일
export const ConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ConfirmationCard = styled.div`
  width: 90%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
`;

export const ConfirmationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const ConfirmationTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  
  &:hover {
    color: #333;
  }
`;

export const OrderStatusBadge = styled(OrderStatus)`
  display: inline-block;
  margin-bottom: 16px;
`;

export const ConfirmationDetail = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

export const DetailLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

export const DetailValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

export const ConfirmationItemList = styled.div`
  margin-bottom: 20px;
`;

export const ConfirmationFooter = styled.div`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

export const InfoNote = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

// 주문 카드 컨테이너
export const OrderCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
`;

export const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const ColorRow = styled.div`
  display: flex;
  justify-content: space-start;
  align-items: center;
  margin-bottom: 8px;
`;

export const ItemSizes = styled.div`
  font-size: 14px;
  color: #333;
  margin-left: 16px;
`;

// 주문 상품 목록 스타일
export const ProductName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
`;

export const ProductDetails = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 4px;
`;

export const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

export const ItemPrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
`;

// 주문 확인서 모달 스타일
export const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  z-index: 1000;
`;

export const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
`;

export const ModalSheet = styled.div`
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  animation: slideUp 0.3s ease-out;
  position: relative;
  z-index: 1;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

export const ModalTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
  color: #000;
`;

export const ModalSectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: #000;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
`;

export const PaymentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`;

export const BankInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`;

export const StaticInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

export const InfoInputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const InfoLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

interface InfoValueProps {
  highlight?: boolean;
}

export const InfoValue = styled.div<InfoValueProps>`
  font-size: 16px;
  font-weight: ${props => props.highlight ? 700 : 600};
  color: ${props => props.highlight ? '#e74c3c' : '#000'};
`;

export const DepositorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`;

export const DepositorInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  
  &:focus {
    border-color: #999;
  }
`;

export const CopiedBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-color: #4CAF50;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
`;

export const CopyButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #e8e8e8;
  }
  
  &:active {
    background-color: #d9d9d9;
  }
`;

export const Notice = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f4e5;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #85662b;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

export const CancelButton = styled.button`
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background-color: #f1f1f1;
  color: #333;
  
  &:hover {
    background-color: #e5e5e5;
  }
`;

export const CancelOrderButton = styled(CancelButton)`
  background-color: #f8d7da;
  color: #721c24;
  
  &:hover {
    background-color: #f5c6cb;
  }
`;

export const RedConfirmButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  flex: 1;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: #c0392b;
  }
  
  &:disabled {
    background-color: #e57373;
    cursor: not-allowed;
  }
`;

// 주문 카드 인디케이터 컨테이너
export const Indicators = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
`;

// 주문 카운터
export const CardCounter = styled.div`
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
`;

export const PaymentDetail = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ddd;
`;

export const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const PaymentLabel = styled.span`
  font-size: 14px;
  color: #666;
`;

export const PaymentValue = styled.span`
  font-size: 14px;
  color: #000;
  font-weight: 600;
`;

// 주문확정 버튼 스타일
export const ConfirmOrderButton = styled.button`
  background-color: #ed2725;
  color: #fff;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  margin-right: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    background-color: #d61c1a;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

// 확인 버튼 스타일
export const ConfirmButton = styled(CancelButton)`
  background-color: #000;
  color: #fff;
  
  &:hover {
    background-color: #333;
  }
`;

// 주문 액션 컨테이너 (버튼들을 담는 컨테이너)
export const OrderActionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;

// 확인 텍스트 스타일
export const ConfirmText = styled.p`
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin: 24px 0 8px;
  color: #000;
`;

// 확인 노트 스타일
export const ConfirmNote = styled.p`
  font-size: 14px;
  text-align: center;
  margin: 0 0 24px;
  color: #666;
`;

// 메뉴 그리드
export const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
`;

// 메뉴 아이템
export const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f9ff;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// 메뉴 아이콘
export const MenuIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

// 메뉴 텍스트
export const MenuText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-align: center;
`;

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  vertical-align: middle;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const RoomInfo = styled.div`
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const RoomNumber = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
`;

export const NoRoomMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
`; 