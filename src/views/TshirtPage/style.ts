import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// 로딩 애니메이션을 위한 keyframes 추가
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
`;

export const Logo = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #E23D3D;
`;

export const MenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;

  span {
    display: block;
    width: 20px;
    height: 2px;
    background-color: #000;
  }
`;

export const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px;
`;

export const ImageSection = styled.section`
  width: 100%;
  height: 500px;
  background-color: #E23D3D;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
`;

export const Title = styled.h2`
  font-size: 80px;
  font-weight: 900;
  color: #000;
`;

export const InfoSection = styled.section`
  max-width: 600px;
`;

export const InfoSection2 = styled.section`
  max-width: 600px;
  margin-top: 40px;
`;

export const ProductTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.32px;
  line-height: 37px;
  color: #000;
  margin-bottom: 8px;
`;

export const Deadline = styled.div`
  font-size: 16px;
  color: #555;
  margin-bottom: 24px;
`;

export const Price = styled.p`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.56px;
  line-height: 37px;
  color: #000;
  margin-bottom: 20px;
`;

export const SizeGuide = styled.div`
  border-top: 4px solid #EBEBEB;
  border-bottom: 4px solid #EBEBEB;
  padding: 10px 0;

  margin-bottom: 10px;
`;

export const SizeGuideTitle = styled.h4`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #000;
`;

export const SizeGuideContent = styled.p`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.28px;
  color: #555;
  margin-bottom: 10px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  
  th, td {
    text-align: center;
    padding: 14px;
    font-size: 11px;
    color: #000;
    border: none;
    border-bottom: 1px solid #ddd;
  }

  th:first-child, td:first-child {
    width: 100px;
    text-align: left;
    padding-left: 0;
  }

  th:not(:first-child), td:not(:first-child) {
    width: 50px;
    padding: 8px 4px;
  }

  th {
    font-weight: 700;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
  }

  td {
    font-weight: 500;
  }

  tbody tr:last-child td {
    border-bottom: 1px solid #ddd;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 40px;
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

export const CloseButton = styled(Button)`
  background-color: #f8f8f8;
  color: #000;
`;

export const OrderButton = styled.button`
  width: 100%;
  padding: 18px 0;
  background-color: #222;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #000;
  }
`;

export const ApplyButton = styled(OrderButton)`
  margin-top: 10px;
  background-color: #4285f4;
  
  &:hover {
    background-color: #3367d6;
  }
`;

export const Notice = styled.div`
  margin-top: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  background-color: #f9f9f9;
  padding: 12px 16px;
  border-radius: 8px;
`;

export const Link = styled.a`
  color: #0066cc;
  text-decoration: underline;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #004499;
  }
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: 600px;
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

export const Section = styled.div`
  margin-bottom: 24px;
`;

export const Label = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
`;

export const OptionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

export const OptionButton = styled.button<{ selected?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => (props.selected ? '#000' : '#ddd')};
  background-color: ${props => (props.selected ? '#000' : '#fff')};
  color: ${props => (props.selected ? '#fff' : '#000')};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    border-color: #000;
  }
`;

export const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: fit-content;
`;

export const QuantityButton = styled.button`
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  font-size: 18px;
  font-weight: bold;
  color: #000;
  cursor: pointer;
  
  &:hover {
    background-color: #f8f8f8;
  }
`;

export const QuantityDisplay = styled.span`
  width: 40px;
  text-align: center;
  font-size: 16px;
`;

export const AddToCartButton = styled.button`
  width: 100%;
  height: 48px;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 16px;
`;

export const CartSection = styled.div`
  margin-top: 24px;
  border-top: 1px solid #eee;
  padding-top: 24px;
`;

export const CartTitle = styled.h4`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
`;

export const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
`;

export const CartItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  span {
    margin-right: 8px;
    font-size: 16px;
    font-weight: 500;
  }
  
  span:nth-of-type(1), /* 색상 */
  span:nth-of-type(2) /* 사이즈 */ {
    font-size: 18px;
    font-weight: 600;
  }
`;

export const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  
  &:hover {
    color: #E23D3D;
  }
`;

export const TotalPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  text-align: right;
  margin-top: 16px;
`;

export const Error = styled.div`
  color: #E23D3D;
  font-size: 14px;
  margin-top: 16px;
`;

export const InfoInputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const InfoLabel = styled.span`
  font-size: 14px;
  color: #555;
`;

export const InfoValue = styled.span<{ highlight?: boolean }>`
  font-size: 16px;
  font-weight: ${props => (props.highlight ? '700' : '400')};
  color: ${props => (props.highlight ? '#000' : '#333')};
`;

export const DepositorInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

export const InfoNote = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 4px;
`;

export const CopyButton = styled.button`
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
  position: relative;
  
  &:hover {
    background-color: #eee;
  }
`;

export const CopiedBadge = styled.span`
  position: absolute;
  top: -20px;
  right: 0;
  background-color: #000;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

export const StaticInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const CancelOrderButton = styled.button`
  background-color: #E23D3D;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
`; 

export const SaveButton = styled.button`
  width: 60%;
  background-color: #222;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #000;
  }
`;

export const CancelButton = styled(Button)`
  background-color: #f8f8f8;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  color: #000;
`;

// 로딩 관련 컴포넌트
export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  padding: 20px;
`;

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2C62EA;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 20px;
`;

export const LoadingText = styled.p`
  font-size: 16px;
  color: #666;
  text-align: center;
`;

// 에러 관련 컴포넌트
export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  padding: 20px;
`;

export const ErrorText = styled.p`
  font-size: 16px;
  color: #e74c3c;
  text-align: center;
  margin-bottom: 20px;
`;

export const RetryButton = styled.button`
  background-color: #2C62EA;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1a4ac0;
  }
`;