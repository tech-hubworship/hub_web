import styled from '@emotion/styled';

export const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  z-index: 1000;
`;

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
`;

export const Sheet = styled.div`
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

export const Title = styled.h3`
  font-family: "Wanted Sans", sans-serif;
  color: #000;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
`;

export const Section = styled.div`
  margin-bottom: 12px;
`;

export const SectionTitle = styled.h4`
  font-family: "Wanted Sans", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
`;

export const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

export const OrderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ProductName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

export const ProductDetails = styled.div`
  font-size: 14px;
  color: #666;
`;

export const ItemPrice = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #000;
`;

export const PaymentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`;

export const BankInfo = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`;

export const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const InfoInputRow = styled(InfoRow)`
`;

export const StaticInfoRow = styled(InfoRow)`
  padding: 8px 0;
`;

export const CopyableRow = styled(InfoRow)`
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &:active {
    background-color: #e8e8e8;
  }
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

export const InfoLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

export const InfoNote = styled.div`
  font-size: 12px;
  color: #ED2725;
`;

interface InfoValueProps {
  highlight?: boolean;
}

export const InfoValue = styled.div<InfoValueProps>`
  font-size: 16px;
  font-weight: ${props => props.highlight ? 700 : 600};
  color: ${props => props.highlight ? '#e74c3c' : '#000'};
`;

export const CopyableValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
`;

export const CopiedBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-color: #4CAF50;
  padding: 2px 6px;
  border-radius: 4px;
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const Notice = styled.div`
  margin-top: 12px;
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

export const Button = styled.button`
  flex: 1;
  height: 52px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease, background-color 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const CancelButton = styled(Button)`
  background-color: #f1f1f1;
  color: #333;
  
  &:hover:not(:disabled) {
    background-color: #e5e5e5;
  }
`;

export const ConfirmButton = styled(Button)`
  background-color: #000;
  color: #fff;
  
  &:hover:not(:disabled) {
    background-color: #333;
  }
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

export const PaymentTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin-bottom: 16px;
`;

export const PaymentDetail = styled.div`
  background-color: #f8f8f8;
  padding: 16px;
  border-radius: 8px;
`;

export const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const PaymentLabel = styled.span`
  font-size: 14px;
  color: #666;
`;

export const PaymentValue = styled.span`
  font-size: 16px;
  color: #000;
`;
