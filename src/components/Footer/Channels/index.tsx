import InstagramLogo from "@src/assets/icons/instagram.svg";
import KakaoLogo from "@src/assets/icons/kakao.svg";
import MailLogo from "@src/assets/icons/mail.svg";
import YoutubeLogo from "@src/assets/icons/youtube.svg";
import * as S from "./style";

interface ChannelsProps {
  isFooter?: boolean;
}

function Channels({ isFooter = false }: ChannelsProps) {
  const handleClick = (e: React.MouseEvent) => {
    switch (e.currentTarget.id) {
      case "mail":
        window.location.href = "mailto:joowonkoh@naver.com";
        break;
      case "facebook":
        window.open("https://www.youtube.com/@hub_worship");
        break;
      case "instagram":
        window.open("https://www.youtube.com/@hub_worship");
        break;
      case "youtube":
        window.open("https://www.youtube.com/@hub_worship");
        break;
      default:
        window.open("https://www.youtube.com/@hub_worship");
        break;
    }
  };

  return (
    <S.ChannelButtonsWrap isFooter={isFooter}>

      <InstagramLogo
        width={30}
        height={30}
        id="instagram"
        alt="인스타그램"
        onClick={handleClick}
      />
      <YoutubeLogo
        width={30}
        height={30}
        id="youtube"
        alt="유튜브"
        onClick={handleClick}
      />
    </S.ChannelButtonsWrap>
  );
}

export default Channels;
