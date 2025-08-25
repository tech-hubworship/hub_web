import { useState, useRef, useEffect } from 'react';
import * as S from './style';

const IMAGES = [
  '/images/tshirt1.png',
  '/images/tshirt2.png',
  '/images/tshirt3.png',
  '/images/tshirt4.png',
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // 이미지 미리 로딩
  useEffect(() => {
    IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setDragX(0);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = (clientX - startX);
    
    // 드래그 범위 제한
    if (
      (currentIndex === 0 && diff > 0) || 
      (currentIndex === IMAGES.length - 1 && diff < 0)
    ) {
      setDragX(diff * 0.2); // 끝에서는 저항감 있게
    } else {
      setDragX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = window.innerWidth * 0.2; // 20% 이상 드래그 시 슬라이드 변경
    
    if (Math.abs(dragX) > threshold) {
      if (dragX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (dragX < 0 && currentIndex < IMAGES.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    
    setDragX(0);
  };

  const getSliderStyle = () => {
    const baseTransform = -(currentIndex * 25); // 25%씩 이동 (100% / 4)
    const dragPercent = (dragX / window.innerWidth) * 25;
    
    return {
      transform: `translateX(${baseTransform + dragPercent}%)`,
    };
  };

  return (
    <S.Container>
      <S.SliderContainer>
        <S.Slider
          ref={sliderRef}
          className={isDragging ? 'dragging' : ''}
          style={getSliderStyle()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove as any}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove as any}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {IMAGES.map((image, index) => (
            <S.Slide key={index}>
              <img 
                src={image} 
                alt={`T-shirt ${index + 1}`}
                draggable="false"
              />
            </S.Slide>
          ))}
        </S.Slider>
      </S.SliderContainer>
      <S.DotsContainer>
        {IMAGES.map((_, index) => (
          <S.Dot
            key={index}
            active={currentIndex === index}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </S.DotsContainer>
    </S.Container>
  );
} 