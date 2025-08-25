import styled from '@emotion/styled';

export const Container = styled.div`
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #fff;
`;

export const SliderContainer = styled.div`
  width: 100%;
  height: 500px;
  position: relative;
  overflow: hidden;
`;

export const Slider = styled.div`
  display: flex;
  position: relative;
  width: 400%;
  height: 100%;
  transition: transform 0.3s ease-out;

  &.dragging {
    transition: none;
  }
`;

export const Slide = styled.div`
  width: 25%;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  img {
    width: auto;
    height: auto;
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }
`;

export const Title = styled.h2`
  font-size: 80px;
  font-weight: 900;
  color: #000;
  text-transform: uppercase;
  letter-spacing: -2px;
  position: relative;
  z-index: 1;
`;

export const DotsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  z-index: 2;
`;

interface DotProps {
  active: boolean;
}

export const Dot = styled.button<DotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#000' : '#fff'};
  border: 1px solid #000;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.active ? 1 : 0.5};
  transform: scale(${props => props.active ? 1.2 : 1});

  &:hover {
    opacity: 1;
  }
`; 