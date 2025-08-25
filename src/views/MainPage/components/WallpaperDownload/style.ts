import styled from "@emotion/styled";

export const Container = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: calc((700 / 360) * 100vw);
  transition: height 0.3s ease;
  align-items: center;
  background-color: #1e1e1e;
  padding: 40px 0;
  
  @media (min-width: 58.75rem) {
    width: 100%;
    min-height: 700px;
  }
`;

export const Content = styled.main`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;

  @media (min-width: 58.75rem) {
    width: 100%;
  }
`;

export const ContentWrapper = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  position: relative;
  z-index: 2;
  padding-bottom: 20px;
  padding-top: 20px;

  @media (min-width: 58.75rem) {
    width: 100%;
    padding-left: 20px;
    padding-right: 20px;
  }
`;

export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  max-width: 600px;
  text-align: center;
`;

export const EssenceTag = styled.div`
  background-color: #ed2725;
  color: #fff;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 15px;
  letter-spacing: 1px;
`;

export const Title = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 10px;
  text-align: center;
`;

export const Subtitle = styled.p`
  font-size: 18px;
  font-weight: 400;
  color: #e0e0e0;
  text-align: center;
  margin-bottom: 15px;
`;

export const SolasIntro = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: #cccccc;
  text-align: center;
  margin-bottom: 10px;
  line-height: 1.5;
`;

export const SolasSlogan = styled.p`
  font-size: 20px;
  font-weight: 700;
  color: #ed2725;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

export const WallpaperGrid = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 90vw;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  margin-bottom: 30px;
  padding: 10px 0;
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  
  @media (min-width: 58.75rem) {
    max-width: 80vw;
    padding: 15px 0;
  }
`;

export const WallpaperItem = styled.div<{ $isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 10px;
  min-width: 220px;
  scroll-snap-align: center;
  margin-right: 15px;
  background-color: ${({ $isSelected }) => $isSelected ? 'rgba(237, 39, 37, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${({ $isSelected }) => $isSelected ? '#ed2725' : 'transparent'};
  
  &:hover {
    transform: translateY(-5px);
    background-color: ${({ $isSelected }) => $isSelected ? 'rgba(237, 39, 37, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:last-child {
    margin-right: 0;
  }
  @media (min-width: 58.75rem) {
    min-width: 260px;
  }
`;

export const WallpaperImage = styled.img`
  width: 100%;
  aspect-ratio: 9/16;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`;

export const WallpaperTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
`;

export const WallpaperSubtitle = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #cccccc;
  text-align: center;
  margin-top: 2px;
`;

export const VerseContainer = styled.div`
  background-color: rgba(237, 39, 37, 0.1);
  border: 1px solid rgba(237, 39, 37, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  max-width: 90%;
  
  @media (min-width: 58.75rem) {
    max-width: 800px;
  }
`;

export const Verse = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #e0e0e0;
  text-align: center;
`;

export const DownloadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: calc((320 / 360) * 100vw);
  
  @media (min-width: 58.75rem) {
    width: 400px;
  }
`;

export const DownloadButton = styled.button`
  width: 100%;
  height: calc((52 / 360) * 100vw);
  background-color: #ed2725;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    background-color: #6b6b6b;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(237, 39, 37, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  @media (min-width: 58.75rem) {
    height: 52px;
  }
`;

export const ButtonText = styled.span<{ $isDisabled: boolean }>`
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.56px;
  opacity: ${({ $isDisabled }) => $isDisabled ? 0.7 : 1};
`;

export const DownloadCounter = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #cccccc;
  text-align: center;
`;

export const ErrorMessage = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  background-color: rgba(237, 39, 37, 0.1);
  border: 1px solid rgba(237, 39, 37, 0.3);
  border-radius: 4px;
  color: #ed2725;
  font-size: 14px;
  text-align: center;
`; 