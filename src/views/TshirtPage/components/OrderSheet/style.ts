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
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
`;

export const WarningMessage = styled.div`
  background-color: #FFF3CD;
  color: #856404;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  border: 1px solid #FFEEBA;
`;

export const Section = styled.div`
  margin-bottom: 16px;
`;

export const Label = styled.p`
  font-family: "Wanted Sans", sans-serif;
  color: #000;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
`;

export const OptionGroup = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

interface OptionButtonProps {
  selected: boolean;
}

export const OptionButton = styled.button<OptionButtonProps>`
  padding: 8px 16px;
  border: 1px solid ${props => props.selected ? '#000' : '#eee'};
  background-color: ${props => props.selected ? '#000' : '#fff'};
  color: ${props => props.selected ? '#fff' : '#000'};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #000;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #aaa;
    border-color: #ddd;
    cursor: not-allowed;
    
    &:hover {
      border-color: #ddd;
    }
  }
`;

export const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const QuantityButton = styled.button`
  font-family: "Wanted Sans", sans-serif;
  color :#000;
  width: 32px;
  height: 32px;
  border: 1px solid #eee;
  background-color: #fff;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    border-color: #000;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #aaa;
    border-color: #ddd;
    cursor: not-allowed;
    
    &:hover {
      border-color: #ddd;
    }
  }
`;

export const QuantityDisplay = styled.span`
  font-size: 16px;
  font-weight: 700;
  min-width: 40px;
  text-align: center;
  font-family: "Wanted Sans", sans-serif;
  color :#000;
`;

export const Error = styled.p`
  color: #E23D3D;
  font-size: 14px;
  margin-bottom: 16px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

export const Button = styled.button`
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export const CancelButton = styled(Button)`
  background-color: #f8f8f8;
  color: #000;
`;

export const OrderButton = styled(Button)`
  background-color: #000;
  color: #fff;
  
  &:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
`;

export const AddToCartButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin: 20px 0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #444;
  }
  
  &:disabled {
    background-color: #aaa;
    cursor: not-allowed;
    
    &:hover {
      background-color: #aaa;
    }
  }
`;

export const CartSection = styled.div`
  margin-top: 4px;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

export const CartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
`;

export const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  margin-bottom: 8px;
`;

export const CartItemInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  span {
    font-size: 14px;
    color: #333;
  }
`;

export const TotalPriceSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ddd;
`;

export const DiscountNotice = styled.div`
  font-size: 14px;
  color: #666;
  text-align: right;
  margin-bottom: 8px;
`;

export const DiscountAmount = styled.div`
  font-size: 16px;
  color: #E23D3D;
  text-align: right;
  margin-bottom: 8px;
  font-weight: 600;
`;

export const TotalPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  text-align: right;
`;

export const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;

  &:hover {
    color: #ff0000;
  }
`; 