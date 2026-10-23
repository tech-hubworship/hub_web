// =============================================================
// 전도 페이지(/evangelism) 정적 데이터
//  - 마크업과 분리해 유지보수를 쉽게 하기 위한 데이터 레이어
//  - 복음 카드(사영리) 8단계 / 찬양 추천 / 온누리 캠퍼스 목록
// =============================================================

/** 복음 카드 한 단계 */
export interface GospelStep {
  no: string;
  tag: string;
  /** public/evangelism/step-0X.png */
  image: string;
  title: string;
  /** 본문 단락(여러 줄) */
  body: string[];
  /** 관련 말씀 구절 라벨 */
  verses: string[];
  /** 마지막 단계에서 노출할 선택적 링크 (해당 탭으로 이동) */
  link?: { label: string; tab: TabKey };
}

export const GOSPEL_STEPS: GospelStep[] = [
  {
    no: "01",
    tag: "창조",
    image: "/evangelism/step-01.png",
    title: "사람은 본래 행복하게 창조되었습니다",
    body: ["사람은 본래 하나님과 교제하며 행복하게 살도록 창조되었습니다."],
    verses: ["창세기 1장 27절"],
  },
  {
    no: "02",
    tag: "죄",
    image: "/evangelism/step-02.png",
    title: "그러나 사람은 하나님을 떠났습니다",
    body: [
      "하나님께 불순종하여 죄를 지었고 하나님을 떠나게 되었습니다.",
      "결과: 불안, 두려움, 사망",
    ],
    verses: ["로마서 3장 23절", "로마서 6장 23절"],
  },
  {
    no: "03",
    tag: "사랑",
    image: "/evangelism/step-03.png",
    title: "하나님께서 예수님을 보내셨습니다",
    body: [
      "하나님께서는 사람들을 불쌍히 여기시고 예수 그리스도를 대속물로 이 땅에 보내셨습니다.",
    ],
    verses: ["요한일서 4장 8절", "마가복음 10장 45절"],
  },
  {
    no: "04",
    tag: "구원",
    image: "/evangelism/step-04.png",
    title: "예수님은 죽으시고 부활하셨습니다",
    body: [
      "예수님께서는 우리의 모든 죄 값을 치르기 위해 십자가에서 죽으시고 삼 일 만에 부활하셨습니다.",
      "하나님께서는 우리에게 평안과 영생을 선물로 주시기 원하십니다.",
    ],
    verses: ["요한복음 14장 27절", "요한복음 10장 10절"],
  },
  {
    no: "05",
    tag: "평안과 영생",
    image: "/evangelism/step-05.png",
    title: "당신은 참 평안과 영생을 받고 싶지 않으십니까?",
    body: [
      "하나님께서는 지금 이 시간 당신이 예수님을 영접하여 참 평안과 영생을 받기 원하십니다.",
    ],
    verses: ["요한복음 3장 16절", "요한복음 1장 12절"],
  },
  {
    no: "06",
    tag: "초대",
    image: "/evangelism/step-06.png",
    title: "예수님을 영접하도록 초대하십니다",
    body: [
      "지금 예수님께서는 당신의 마음 문을 두드리고 계십니다. 예수님을 영접하여 참 평안과 영생을 얻으시겠습니까?",
    ],
    verses: ["요한계시록 3장 20절"],
  },
  {
    no: "07",
    tag: "기도",
    image: "/evangelism/step-07.png",
    title: "이렇게 기도할 수 있습니다",
    body: [
      "하나님 아버지, 저는 죄인입니다. 저의 죄를 회개하오니 용서하여 주십시오. 예수님께서 저의 죄 때문에 십자가에서 죽으시고 부활하신 것을 믿습니다. 지금 이 시간 제 마음에 들어오셔서 저의 구원자와 주님이 되어 주십시오. 예수님의 이름으로 기도합니다. 아멘.",
    ],
    verses: [],
  },
  {
    no: "08",
    tag: "새로운 시작",
    image: "/evangelism/step-08.png",
    title: "하나님의 자녀가 되었습니다",
    body: [
      "예수님을 영접하여 하나님의 자녀가 되었습니다. 가까운 교회에 나가 하나님의 말씀을 듣고 기도하며 하나님과 함께 행복한 삶을 누리세요.",
    ],
    verses: ["요한복음 3장 16절", "요한복음 1장 12절"],
    link: { label: "가까운 온누리교회 찾아보기", tab: "church" },
  },
];

// -------------------------------------------------------------
// 찬양 추천
// -------------------------------------------------------------

export type SongMood = "comfort" | "strength" | "curious" | "love";

export interface SongMoodMeta {
  key: SongMood;
  label: string;
}

export const SONG_MOODS: SongMoodMeta[] = [
  { key: "comfort", label: "위로가 필요할 때" },
  { key: "strength", label: "힘이 필요할 때" },
  { key: "curious", label: "하나님이 궁금할 때" },
  { key: "love", label: "하나님의 사랑" },
];

/** 무드별 플레이어 테마 (그라데이션 + 포인트 색) */
export const SONG_THEMES: Record<
  SongMood,
  { gradient: string; accent: string; emoji: string }
> = {
  comfort: {
    gradient: "linear-gradient(135deg, #2f5d53 0%, #4b7e6d 60%, #7fa98f 100%)",
    accent: "#dff0e4",
    emoji: "🌿",
  },
  strength: {
    gradient: "linear-gradient(135deg, #7a3b1d 0%, #c2662f 55%, #e59b5b 100%)",
    accent: "#ffe8d2",
    emoji: "🔥",
  },
  curious: {
    gradient: "linear-gradient(135deg, #2b3a67 0%, #3f5aa6 55%, #7f9bd6 100%)",
    accent: "#e2ebff",
    emoji: "✨",
  },
  love: {
    gradient: "linear-gradient(135deg, #7a2d4a 0%, #c0547d 55%, #f0a3bf 100%)",
    accent: "#ffe3ee",
    emoji: "💛",
  },
};

export interface Song {
  title: string;
  artist: string;
  /** 유튜브 영상 ID. 있으면 플레이어에서 바로 임베드 재생, 없으면 검색 링크로 폴백 */
  youtubeID?: string;
}

export const SONGS: Record<SongMood, Song[]> = {
  comfort: [
    { title: "Love Letter", artist: "제이어스", youtubeID: "ZQppjVXpbbA" },
    { title: "하나님의 열심", artist: "러빔", youtubeID: "QkHKe6bPPE0" },
    { title: "나 주님을 모른다 하여도", artist: "팀룩", youtubeID: "VeuP0yejeYM" },
    { title: "사랑한다 말하시네", artist: "기프티드", youtubeID: "90N9uLZPwKw" },
    { title: "누군가 널 위해 기도하네", artist: "Gina", youtubeID: "W3KElVsukPU" },
    { title: "샬롬", artist: "김상진", youtubeID: "jU9N7Skw_b4" },
    { title: "나의 안에 거하라", artist: "김상진", youtubeID: "oIgpHu4B6bk" },
    { title: "평안을 너에게 주노라", artist: "지나", youtubeID: "0hUOwMlq940" },
    { title: "무너짐 가운데서", artist: "WELOVE", youtubeID: "BEXi88t6Nao" },
    { title: "함께 계셨네", artist: "웨이홈", youtubeID: "p4HJckWAHBY" },
    { title: "하나님은 너를 지키시는 자", artist: "Wayhome", youtubeID: "wYkhLEAqhBs" },
    { title: "내 이름 아시죠", artist: "J-US", youtubeID: "7w3dvCQ3m1I" },
    { title: "주의 자녀로 산다는 것은", artist: "Gifted", youtubeID: "TKSS0P4H2zQ" },
    { title: "성령이 오셨네", artist: "김도현", youtubeID: "cSeoTN9ztRk" },
    { title: "주님 마음 내게 주소서", artist: "마커스", youtubeID: "TcogMm4emKQ" }
  ],
  "strength": [
    { title: "어둔 날 다 지나고", artist: "위러브", youtubeID: "uHHYagMPOro" },
    { title: "주를 찾는 모든 자들이", artist: "팀룩워십", youtubeID: "Fi2waeWY18g" },
    { title: "너는 꽃이야", artist: "Hisplan", youtubeID: "QNuN6618rS4" },
    { title: "주의 음성을 내가 들으니", artist: "제이어스", youtubeID: "_YrZ6l_LZHI" },
    { title: "예수 날 위해 이 땅에 오신 주", artist: "어노인팅", youtubeID: "5N4uCeJ8-ws" },
    { title: "새 힘 얻으리", artist: "Hisplan", youtubeID: "bU_ShwpQzaQ" },
    { title: "주가 지으신 이 날에", artist: "어노인팅", youtubeID: "FkpbYaNiU8Y" },
    { title: "We Praise You", artist: "Bethel Music & Brandon Lake", youtubeID: "vVVXeKCg9w4" },
    { title: "Washed", artist: "Elevation Worship", youtubeID: "O3TAEexierM" },
    { title: "Goodbye Yesterday", artist: "Elevation Worship", youtubeID: "qOD9M95_fS0" },
    { title: "내힘이 되신", artist: "Histigma", youtubeID: "EX03xrCwkyk" },
    { title: "Need You, Lord!", artist: "Hisplan", youtubeID: "kaaKrquxAN0" },
    { title: "두려움 떠나네", artist: "아갓유", youtubeID: "OMLkqmilEgo" },
    { title: "I Thank God", artist: "Elevation Worship", youtubeID: "LM1qrx0Huds" },
    { title: "Here Again", artist: "Elevation Worship", youtubeID: "aIdZ5KRiakM" },
    { title: "Confidence", artist: "Sanctus Real", youtubeID: "KA9kSBv1QrI" },
    { title: "전신갑주", artist: "아이자야식스티원", youtubeID: "17Qykmf8oS4" },
    { title: "불을 내려주소서", artist: "천관웅", youtubeID: "DpHuf3TfRnE" },
    { title: "태산을 넘어 험곡에 가도", artist: "아이자야식스티원", youtubeID: "__eQZBul7-g" }
  ],
  "curious": [
    { title: "하나님의 세계", artist: "홍이삭", youtubeID: "nUTvfKu7q3c" },
    { title: "지극히 높으신 주", artist: "예람워십", youtubeID: "o_7pBZ7Ih8U" },
    { title: "나의 하나님", artist: "예람워십", youtubeID: "YnyY7dsWPg0" },
    { title: "예수 우리들의 밝은 빛", artist: "어노인팅", youtubeID: "bBsVACE3tkQ" },
    { title: "그가 오신 이유", artist: "심종호", youtubeID: "6MCaECq6Czg" },
    { title: "The Blessing", artist: "아가파오", youtubeID: "mDK9ZrhJA34" },
    { title: "창조의 아버지", artist: "위클래시아", youtubeID: "sPvC2YPLu8w" },
    { title: "Way Maker", artist: "아가파오", youtubeID: "VxRZDqbDoMk" },
    { title: "위대하신 주", artist: "제이어스", youtubeID: "2RP43Zor38g" },
    { title: "목마른 사슴이", artist: "어노이팅", youtubeID: "ele4YXY84lY" }
  ],
  "love": [
    { title: "하나님의 사랑이", artist: "WELOVE", youtubeID: "fV69rb_MO3o" },
    { title: "내 모습이대로", artist: "JUS", youtubeID: "7w3dvCQ3m1I" },
    { title: "사랑은 여전히 사랑이어서", artist: "한웅재", youtubeID: "cdKib8Oearw" },
    { title: "예수 사랑하심은", artist: "아이자야식스티원", youtubeID: "A_drAemgpYc" },
    { title: "하나님께서 세상을 사랑하사", artist: "어노인팅", youtubeID: "-n24d45myCg" },
    { title: "그 크신 하나님의 사랑", artist: "제이어스", youtubeID: "VuGyGTKbOpQ" },
    { title: "진리", artist: "어노인팅", youtubeID: "602e5ZZokl0" },
    { title: "Washed", artist: "Elevation Worship", youtubeID: "TXG-5Do-hGg" },
    { title: "주님의 선하심", artist: "기프티드", youtubeID: "f0PASE89D6E" },
    { title: "사랑중에 사랑", artist: "WELOVE", youtubeID: "GDoarJJezi0" },
    { title: "은혜", artist: "손경민", youtubeID: "pZuW2CV0mXY" },
    { title: "소원", artist: "한웅재", youtubeID: "EMJLuwJpehE" },
    { title: "예수사랑하심은", artist: "아이자야 식스티원", youtubeID: "A_drAemgpYc" }
  ]
}

/** 찬양 제목+아티스트로 유튜브 검색 URL 생성 */
export function songSearchUrl(song: Song): string {
  const query = encodeURIComponent(`${song.title} ${song.artist} 찬양`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/**
 * 유튜브에서 열 URL.
 * youtubeID가 있으면 해당 영상으로 바로, 없으면 검색 결과로 이동.
 */
export function songYoutubeUrl(song: Song): string {
  if (song.youtubeID) {
    return `https://www.youtube.com/watch?v=${song.youtubeID}`;
  }
  return songSearchUrl(song);
}

// -------------------------------------------------------------
// CGN 영상
// -------------------------------------------------------------

export interface CgnPlaylist {
  title: string;
  desc: string;
  href: string;
}

export const CGN_CHANNEL_URL = "https://www.youtube.com/@cgn";

export const CGN_PLAYLISTS: CgnPlaylist[] = [
  {
    title: "찬양과 기독교 문화",
    desc: "찬양과 기독교 문화 콘텐츠를 만나보세요.",
    href: "https://www.youtube.com/playlist?list=PLSvEGrDFKwMk",
  },
  {
    title: "다큐멘터리",
    desc: "다큐멘터리 영상으로 다양한 삶과 현장을 살펴보세요.",
    href: "https://www.youtube.com/playlist?list=PLjj_uvKdTemB6oFOx2kgR1l26j22ZuvIC",
  },
  {
    title: "성경 이야기",
    desc: "성경 속 이야기들을 영상으로 만나보세요.",
    href: "https://www.youtube.com/playlist?list=PLjj_uvKdTemAdrgZOpESpm0FV0a_KnFd3",
  },
  {
    title: "인기 콘텐츠",
    desc: "많은 사람에게 사랑받는 CGN 콘텐츠를 만나보세요.",
    href: "https://www.youtube.com/playlist?list=PLjj_uvKdTemCzs1xbPidEK96UyWQkAbry",
  },
];

// -------------------------------------------------------------
// 온누리교회 캠퍼스
// -------------------------------------------------------------

export interface Campus {
  name: string;
  address: string;
  href: string;
}

export interface CampusRegion {
  region: string;
  campuses: Campus[];
}

export const CAMPUS_REGIONS: CampusRegion[] = [
  {
    region: "서울",
    campuses: [
      {
        name: "양재온누리교회",
        address: "서울 서초구 바우뫼로31길 70 횃불선교회관",
        href: "https://www.onnuri.org/about-onnuri/service-times/yangjae-campus/",
      },
      {
        name: "서빙고 온누리교회",
        address: "서울 용산구 이촌로 347-11 온누리교회",
        href: "https://www.onnuri.org/about-onnuri/service-times/seobinggo-campus/",
      },
      {
        name: "강동 온누리교회",
        address: "서울시 강동구 천호대로 157길 14 나비쇼핑몰 10, 11, 12층",
        href: "https://gd.onnuri.or.kr/pages/worship-information",
      },
    ],
  },
  {
    region: "경기·인천",
    campuses: [
      {
        name: "부천 온누리교회",
        address: "경기도 부천시 원미구 평천로 589(상동)",
        href: "https://bc.onnuri.or.kr/pages/worship-information",
      },
      {
        name: "수원 온누리교회",
        address:
          "경기도 용인시 처인구 명지로 116 명지대학교 자연캠퍼스 60주년 채플관",
        href: "https://sw.onnuri.or.kr/pages/worship",
      },
      {
        name: "남양주 온누리교회",
        address: "경기도 남양주시 경춘로476번길 16 JS 프라자 3층",
        href: "https://nyj.onnuri.or.kr/pages/serviceinform",
      },
      {
        name: "평택 온누리교회",
        address: "경기도 평택시 신흥 1로 2길 61, 2층",
        href: "https://kptonnuri.clickn.co.kr/pages/worship-list",
      },
      {
        name: "인천 온누리교회",
        address: "인천광역시 연수구 송도교육로75 (송도동 194-4)",
        href: "https://icn.onnuri.or.kr/pages/worship-information",
      },
      {
        name: "영종 온누리교회",
        address: "인천광역시 중구 운남로49",
        href: "https://iyj.onnuri.or.kr/pages/worship-information",
      },
      {
        name: "용인 온누리교회",
        address: "경기도 용인시 처인구 양지면 추계리 239번지 비전빌리지",
        href: "https://yi.onnuri.or.kr/pages/worship-information",
      },
    ],
  },
  {
    region: "그 외 지역",
    campuses: [
      {
        name: "대전 온누리교회",
        address: "대전광역시 서구 둔산로 64 온누리빌딩 3~6층",
        href: "https://dj.onnuri.or.kr/pages/worship",
      },
      {
        name: "제주 온누리교회",
        address: "제주특별자치도 서귀포시 안덕면 신화역사로 601",
        href: "https://jeju.onnuri.or.kr/pages/worship",
      },
      {
        name: "서산 온누리교회",
        address: "충남 서산시 안견로 213 서산온누리교회",
        href: "https://ss.onnuri.or.kr/pages/worship-information",
      },
    ],
  },
];

export const ONNURI_MAP_SEARCH_URL =
  "https://www.google.com/maps/search/?api=1&query=온누리교회";

/** 지역 라벨이 붙은 평탄화된 캠퍼스 목록 (플레이어식 큐 렌더용) */
export interface FlatCampus extends Campus {
  region: string;
}

export const FLAT_CAMPUSES: FlatCampus[] = CAMPUS_REGIONS.flatMap((r) =>
  r.campuses.map((c) => ({ ...c, region: r.region }))
);

/** 주소로 구글맵 임베드 URL 생성 (좌표 없이 위치 핀 표시) */
export function campusMapEmbedUrl(campus: Campus): string {
  const q = encodeURIComponent(`${campus.name} ${campus.address}`);
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

/** 주소로 구글맵 길찾기/검색 새 탭 URL */
export function campusMapLinkUrl(campus: Campus): string {
  const q = encodeURIComponent(`${campus.name} ${campus.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * 네이버 지도 검색 새 탭 URL (한국 사용자 길찾기용).
 * 교회명만으로 검색해야 네이버가 장소를 제대로 찾는다.
 * (교회명+전체주소를 함께 넣으면 쿼리가 너무 구체적이라 "조건에 맞는 업체 없음"이 뜸)
 */
export function campusNaverMapUrl(campus: Campus): string {
  const q = encodeURIComponent(campus.name);
  return `https://map.naver.com/p/search/${q}`;
}

// -------------------------------------------------------------
// 둘러보기(Explore) 카드 & 네비게이션 앵커
// -------------------------------------------------------------

// -------------------------------------------------------------
// 탭 구성
//  - 한 페이지 스크롤 대신 Hero 아래 탭바로 섹션을 전환한다.
//  - 탭 key 는 URL 쿼리(?tab=)와 동기화된다.
// -------------------------------------------------------------

export type TabKey =
  | "explore"
  | "why"
  | "gospel"
  | "qna"
  | "songs"
  | "cgn"
  | "church"
  | "hurray";

export interface TabMeta {
  key: TabKey;
  label: string;
}

export const TABS: TabMeta[] = [
  { key: "explore", label: "둘러보기" },
  { key: "why", label: "우리가 전도하는 이유" },
  { key: "gospel", label: "복음 이야기" },
  { key: "qna", label: "질문하기" },
  { key: "songs", label: "찬양 추천" },
  { key: "cgn", label: "CGN 영상" },
  { key: "church", label: "교회 찾기" },
  { key: "hurray", label: "허뤠이 소개" },
];

export const DEFAULT_TAB: TabKey = "explore";

export function isTabKey(value: string | null | undefined): value is TabKey {
  return !!value && TABS.some((t) => t.key === value);
}

/** 둘러보기 탭의 주제 카드 — 클릭 시 해당 탭으로 이동 */
export interface ExploreItem {
  tab: TabKey;
  title: string;
  desc: string;
  cta: string;
}

export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    tab: "why",
    title: "우리가 전도하는 이유",
    desc: "우리가 전하고 싶은 사랑과 복음의 이야기.",
    cta: "이야기 읽기",
  },
  {
    tab: "gospel",
    title: "복음에 대해 들어보실래요?",
    desc: "참된 행복과 평안, 영생에 관한 복음의 이야기.",
    cta: "복음 알아보기",
  },
  {
    tab: "qna",
    title: "질문과 답변",
    desc: "하나님, 신앙, 교회에 관한 질문을 남겨보세요.",
    cta: "질문 남기기",
  },
  {
    tab: "songs",
    title: "찬양 추천",
    desc: "지금 내 마음에 어울리는 찬양을 찾아보세요.",
    cta: "찬양 살펴보기",
  },
  {
    tab: "cgn",
    title: "CGN 영상",
    desc: "말씀과 간증, 다양한 기독교 콘텐츠",
    cta: "영상 콘텐츠 살펴보기",
  },
  {
    tab: "church",
    title: "가까운 온누리교회 찾아보기",
    desc: "가까운 캠퍼스의 위치와 예배 안내를 확인해 보세요.",
    cta: "캠퍼스 찾아보기",
  },
];
