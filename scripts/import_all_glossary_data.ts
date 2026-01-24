/**
 * Notion에서 추출한 모든 데이터를 통합 테이블에 삽입하는 스크립트
 * 
 * 사용법:
 * npx tsx scripts/import_all_glossary_data.ts
 */

import { supabaseAdmin } from "@src/lib/supabase";

interface GlossaryTerm {
  term_name: string;
  category: "신앙" | "공동체" | "행사" | "기타" | "조직";
  definition: string;
  example?: string;
  schedule?: string;
  location?: string;
  related_terms?: number[];
  order_index: number;
}

// Notion에서 추출한 모든 데이터 (용어 + 조직 정보)
const allGlossaryData: GlossaryTerm[] = [
  // 공동체 용어 (ㄱ)
  {
    term_name: "그룹",
    category: "공동체",
    definition: "공동체 내에서 함께 모여 나눔과 교제를 나누는 소그룹 모임",
    example: "우리 그룹은 매주 금요일 모여요",
    order_index: 1,
  },
  {
    term_name: "기수",
    category: "공동체",
    definition: "같은 시기에 입교하거나 공동체에 합류한 사람들을 묶어 부르는 단위",
    example: "우리는 2024년 기수예요",
    order_index: 2,
  },
  // 신앙 용어 (ㄷ)
  {
    term_name: "다락방",
    category: "신앙",
    definition:
      "온누리교회의 소그룹 모임 형태 중 하나로, 가정이나 교회에서 모여 함께 말씀을 나누고 기도하는 모임",
    example: "우리 다락방은 매주 수요일 저녁에 모여요",
    order_index: 3,
  },
  {
    term_name: "더콜링",
    category: "신앙",
    definition: "하나님의 부르심을 의미하며, 자신의 삶에서 하나님의 뜻을 찾고 따르는 것",
    example: "더콜링을 통해 하나님의 뜻을 발견했어요",
    order_index: 4,
  },
  // 공동체 용어 (ㄹ)
  {
    term_name: "링크",
    category: "공동체",
    definition: "새로 온 사람을 기존 공동체 구성원과 연결해주는 역할이나 사람",
    example: "링크를 통해 새가족을 소개받았어요",
    order_index: 5,
  },
  // 공동체 용어 (ㅁ)
  {
    term_name: "멘토",
    category: "공동체",
    definition: "신앙생활이나 공동체 생활에서 조언과 도움을 주는 선배나 지도자",
    example: "멘토님께서 많은 조언을 해주셨어요",
    order_index: 6,
  },
  // 신앙 용어 (ㅂ)
  {
    term_name: "바이블아카데미(바아)",
    category: "신앙",
    definition:
      "온누리교회의 성경 공부 프로그램으로, 체계적인 성경 교육을 제공하는 과정",
    example: "바이블아카데미를 통해 성경을 깊이 공부했어요",
    order_index: 7,
  },
  {
    term_name: "블레싱",
    category: "신앙",
    definition: "하나님의 축복이나 은혜를 의미하며, 다른 사람에게 기도나 축복을 전하는 것",
    example: "블레싱을 받고 힘을 얻었어요",
    order_index: 8,
  },
  // 공동체 용어 (ㅅ)
  {
    term_name: "새가족 허그",
    category: "공동체",
    definition: "새로 온 가족을 따뜻하게 맞이하고 환영하는 행사나 시간",
    example: "새가족 허그에서 따뜻하게 맞이받았어요",
    order_index: 9,
  },
  {
    term_name: "순",
    category: "공동체",
    definition: "공동체 내에서 함께 모이는 소그룹 단위",
    example: "우리 순은 매주 일요일 모여요",
    order_index: 10,
  },
  {
    term_name: "순모임",
    category: "공동체",
    definition: "순 단위로 모여 함께 말씀을 나누고 교제하는 모임",
    example: "순모임에서 깊은 나눔을 나눴어요",
    order_index: 11,
  },
  // 행사 용어 (ㅇ)
  {
    term_name: "아웃리치",
    category: "행사",
    definition: "교회 밖으로 나가 복음을 전하고 섬기는 선교나 봉사 활동",
    example: "이번 주말에 아웃리치를 나갔어요",
    order_index: 12,
  },
  {
    term_name: "일대일 양육자, 동반자",
    category: "공동체",
    definition:
      "개인적으로 함께 성장하며 신앙을 나누는 관계. 양육자는 선배, 동반자는 동기나 후배를 의미",
    example: "일대일 양육자님과 정기적으로 만나요",
    order_index: 13,
  },
  // 공동체 용어 (ㅋ)
  {
    term_name: "캠모임/캠미/오피스모임",
    category: "공동체",
    definition: "캠퍼스나 직장에서 모이는 소그룹 모임",
    example: "캠모임에서 학교 친구들과 함께 모여요",
    order_index: 14,
  },
  {
    term_name: "킹덤 파이오니어",
    category: "신앙",
    definition: "하나님 나라를 위해 앞서가는 선구자적 역할을 하는 사람",
    example: "킹덤 파이오니어로서 사명을 감당하고 싶어요",
    order_index: 15,
  },
  // 공동체 용어 (ㅎ)
  {
    term_name: "허브업",
    category: "공동체",
    definition: "허브 공동체의 모임이나 행사",
    example: "이번 주 허브업에 참석할 예정이에요",
    order_index: 16,
  },
  {
    term_name: "홀리스타(홀스)",
    category: "신앙",
    definition:
      "전인적(전체적)인 성장을 추구하는 개념으로, 영성뿐만 아니라 삶의 모든 영역에서 하나님을 경험하는 것",
    example: "홀리스타로 성장하고 싶어요",
    order_index: 17,
  },
  {
    term_name: "화요성령집회(화성)",
    category: "행사",
    definition: "매주 화요일에 열리는 성령 집회",
    example: "화요성령집회에 참석하고 있어요",
    order_index: 18,
  },
  // 신앙/공동체 용어 (A~Z)
  {
    term_name: "FA/TP/TIM",
    category: "신앙",
    definition:
      "온누리교회의 신앙 교육 과정. FA는 First Academy, TP는 Training Program, TIM은 Training Institute for Ministry의 약자",
    example: "FA 과정을 수료했어요",
    order_index: 19,
  },
  {
    term_name: "MC",
    category: "공동체",
    definition: "Master of Ceremony의 약자로, 모임이나 행사를 진행하는 사람",
    example: "이번 행사에서 MC를 맡았어요",
    order_index: 20,
  },
  {
    term_name: "OD",
    category: "공동체",
    definition: "온누리교회의 조직 단위 중 하나",
    example: "OD에서 섬기고 있어요",
    order_index: 21,
  },
  {
    term_name: "ODO",
    category: "공동체",
    definition: "온누리교회의 조직 단위 중 하나",
    example: "ODO에서 함께 섬기고 있어요",
    order_index: 22,
  },
  // 조직 정보 (대학부/청년부) - 카테고리: 조직
  {
    term_name: "HUB 대학부",
    category: "조직",
    definition: "허브 대학부 모임",
    example: "HUB 대학부는 매주 일요일 오후 2시에 모여요",
    schedule: "일요일 오후 2:00",
    location: "양재 온누리교회 기쁨홀",
    order_index: 23,
  },
  {
    term_name: "하늘 대학부",
    category: "조직",
    definition: "하늘 대학부 모임",
    example: "하늘 대학부는 매주 일요일 오후 4시에 모여요",
    schedule: "일요일 오후 4:00",
    location: "온누리청소년센터지하 1층 체육관",
    order_index: 24,
  },
  {
    term_name: "Pole2 대학부",
    category: "조직",
    definition: "Pole2 대학부 모임",
    example: "Pole2 대학부는 매주 일요일 오전 10시에 모여요",
    schedule: "일요일 오전 10:00",
    location: "한성대 에듀센터 2층",
    order_index: 25,
  },
  {
    term_name: "J4U 청년부",
    category: "조직",
    definition: "J4U 청년부 모임",
    example: "J4U 청년부는 매주 일요일 오전 11시 반에 모여요",
    schedule: "일요일 오전 11시 반",
    location: "양재 온누리교회 기쁨홀",
    order_index: 26,
  },
  {
    term_name: "여호수아 청년부",
    category: "조직",
    definition: "여호수아 청년부 모임",
    example: "여호수아 청년부는 매주 일요일 오후 4시에 모여요",
    schedule: "일요일 오후 4시",
    location: "양재 온누리교회 사랑홀",
    order_index: 27,
  },
  {
    term_name: "갈렙 청년부",
    category: "조직",
    definition: "갈렙 청년부 모임",
    example: "갈렙 청년부는 매주 일요일 오후 1시 50분에 모여요",
    schedule: "일요일 오후 1시 50분",
    location: "숙명여고 강당",
    order_index: 28,
  },
  {
    term_name: "W 청년부",
    category: "조직",
    definition: "W 청년부 모임",
    example: "W 청년부는 1부와 2부로 나뉘어 모여요",
    schedule: "1부: 일요일 오전 10시 반, 2부: 일요일 오후 2시",
    location: "여의도 정곡빌딩 4층 여의도 이룸",
    order_index: 29,
  },
  {
    term_name: "길 청년부",
    category: "조직",
    definition: "길 청년부 모임",
    example: "길 청년부는 매주 일요일 오후 2시에 모여요",
    schedule: "일요일 오후 2시",
    location: "한성대 에듀센터 2층",
    order_index: 30,
  },
  {
    term_name: "Ch plus 청년부",
    category: "조직",
    definition: "Ch plus 청년부 모임",
    example: "Ch plus 청년부는 매주 일요일 오후 5시 반에 모여요",
    schedule: "일요일 오후 5시 반",
    location: "한성대 에듀센터 2층",
    order_index: 31,
  },
  {
    term_name: "Sns 청년부",
    category: "조직",
    definition: "Sns 청년부 모임",
    example: "Sns 청년부는 1부와 2부로 나뉘어 모여요",
    schedule: "1부: 일요일 오후 1시 반 2부: 일요일 오후 4시",
    location: "1부: 온누리청소년센터 지하 1층 체육관 2부: 서빙고 온누리교회 본관 3층(본당)",
    order_index: 32,
  },
  {
    term_name: "요셉 청년부",
    category: "조직",
    definition: "요셉 청년부 모임",
    example: "요셉 청년부는 매주 토요일 오후 5시에 모여요",
    schedule: "토요일 오후 5시",
    location: "서빙고 온누리교회 본당",
    order_index: 33,
  },
];

async function importAllGlossaryData() {
  console.log("통합 용어사전 데이터 삽입을 시작합니다...");
  console.log(`총 ${allGlossaryData.length}개의 항목을 처리합니다.\n`);

  try {
    // 기존 데이터 확인
    const { data: existingTerms } = await supabaseAdmin
      .from("glossary_terms")
      .select("term_name");

    const existingNames = new Set(existingTerms?.map((t) => t.term_name) || []);

    // 새로 추가할 용어들
    const newTerms = allGlossaryData.filter((term) => !existingNames.has(term.term_name));

    if (newTerms.length === 0) {
      console.log("✅ 추가할 새로운 항목이 없습니다. 모든 데이터가 이미 존재합니다.");
      return;
    }

    console.log(`📝 ${newTerms.length}개의 새로운 항목을 삽입합니다...\n`);

    // 카테고리별 통계
    const categoryStats = newTerms.reduce((acc, term) => {
      acc[term.category] = (acc[term.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("카테고리별 통계:");
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}개`);
    });
    console.log();

    // 데이터 삽입
    const { data, error } = await supabaseAdmin
      .from("glossary_terms")
      .insert(
        newTerms.map((term) => ({
          term_name: term.term_name,
          category: term.category,
          definition: term.definition,
          example: term.example || null,
          schedule: term.schedule || null,
          location: term.location || null,
          related_terms: term.related_terms || [],
          is_active: true,
          order_index: term.order_index,
          search_count: 0,
        }))
      )
      .select();

    if (error) {
      console.error("❌ 데이터 삽입 오류:", error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0}개의 항목이 성공적으로 삽입되었습니다.\n`);
    console.log("삽입된 항목 목록:");
    data?.forEach((term, index) => {
      const prefix = term.schedule || term.location ? "📍" : "📖";
      console.log(
        `  ${index + 1}. ${prefix} ${term.term_name} (${term.category})`
      );
      if (term.schedule) {
        console.log(`     ⏰ 일시: ${term.schedule}`);
      }
      if (term.location) {
        console.log(`     📍 장소: ${term.location}`);
      }
    });
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  importAllGlossaryData()
    .then(() => {
      console.log("\n✨ 완료되었습니다!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 실행 오류:", error);
      process.exit(1);
    });
}

export { importAllGlossaryData };
