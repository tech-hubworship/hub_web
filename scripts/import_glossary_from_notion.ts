/**
 * Notion에서 추출한 용어사전 데이터를 데이터베이스에 삽입하는 스크립트
 * 
 * 사용법:
 * npx tsx scripts/import_glossary_from_notion.ts
 */

import { supabaseAdmin } from "@src/lib/supabase";

interface GlossaryTerm {
  term_name: string;
  category: "신앙" | "공동체" | "행사" | "기타";
  definition: string;
  example?: string;
  related_terms?: number[];
  order_index: number;
}

// Notion에서 추출한 용어 데이터
const glossaryTerms: GlossaryTerm[] = [
  // ㄱ
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
  // ㄷ
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
  // ㄹ
  {
    term_name: "링크",
    category: "공동체",
    definition: "새로 온 사람을 기존 공동체 구성원과 연결해주는 역할이나 사람",
    example: "링크를 통해 새가족을 소개받았어요",
    order_index: 5,
  },
  // ㅁ
  {
    term_name: "멘토",
    category: "공동체",
    definition: "신앙생활이나 공동체 생활에서 조언과 도움을 주는 선배나 지도자",
    example: "멘토님께서 많은 조언을 해주셨어요",
    order_index: 6,
  },
  // ㅂ
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
  // ㅅ
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
  // ㅇ
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
  // ㅋ
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
  // ㅎ
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
  // A~Z
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
];

async function importGlossaryTerms() {
  console.log("용어사전 데이터 삽입을 시작합니다...");

  try {
    // 기존 데이터 확인
    const { data: existingTerms } = await supabaseAdmin
      .from("glossary_terms")
      .select("term_name");

    const existingNames = new Set(existingTerms?.map((t) => t.term_name) || []);

    // 새로 추가할 용어들
    const newTerms = glossaryTerms.filter((term) => !existingNames.has(term.term_name));

    if (newTerms.length === 0) {
      console.log("추가할 새로운 용어가 없습니다.");
      return;
    }

    console.log(`${newTerms.length}개의 새로운 용어를 삽입합니다...`);

    // 데이터 삽입
    const { data, error } = await supabaseAdmin
      .from("glossary_terms")
      .insert(
        newTerms.map((term) => ({
          ...term,
          is_active: true,
          search_count: 0,
          related_terms: term.related_terms || [],
        }))
      )
      .select();

    if (error) {
      console.error("데이터 삽입 오류:", error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0}개의 용어가 성공적으로 삽입되었습니다.`);
    console.log("\n삽입된 용어 목록:");
    data?.forEach((term) => {
      console.log(`  - ${term.term_name} (${term.category})`);
    });
  } catch (error) {
    console.error("오류 발생:", error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  importGlossaryTerms()
    .then(() => {
      console.log("\n완료되었습니다!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("실행 오류:", error);
      process.exit(1);
    });
}

export { importGlossaryTerms };
