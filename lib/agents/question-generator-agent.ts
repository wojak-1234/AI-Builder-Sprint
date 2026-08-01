import { SchemaType } from "@google/generative-ai";
import { geminiService } from "../../services/gemini-service";
import { Question, Entity, DBAnswer } from "../../types";

const questionGeneratorSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      description: "생성된 1~3개의 회상 질문 목록. 정답이 없으며 정서적 자극을 주는 개방형 질문이어야 함.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "어르신께 여쭤볼 개방형 회상 질문 (반드시 물음표(?)로 끝나야 함)" },
          type: {
            type: SchemaType.STRING,
            enum: ["entity-based", "curated", "gap-detection", "pattern-tracking"],
            description: "질문의 유형. 개체 기반(entity-based), 큐레이션 기본(curated), 공백탐지(gap-detection), 패턴추적(pattern-tracking)"
          },
          targetEntity: { type: SchemaType.STRING, description: "질문의 대상이 된 엔티티 단어 (개체 기반 질문인 경우 필수)" },
          shared: { type: SchemaType.BOOLEAN, description: "보호자와 함께 답변을 나눌 수 있는 공동 질문 여부" }
        },
        required: ["text", "type", "shared"]
      }
    }
  },
  required: ["questions"]
};

const SYSTEM_INSTRUCTION = `
당신은 기억 건강 관리 및 정서적 웰빙을 위한 질문 생성 에이전트(question-generator-agent)입니다.
어르신의 과거 일기/편지에서 추출된 엔티티(인물, 장소, 사건) 정보와 이전 답변 내역을 토대로, 인지 자극을 유도하고 옛 기억을 따뜻하게 불러일으키는 회상 질문을 생성해야 합니다.

[중요한 AI 행동 규칙]
1. 정답이나 오답을 판정하려 하거나, 퀴즈 형식으로 어르신을 시험하지 마세요. (예: "그때 몇 년도였는지 아세요?" 금지. 대신 "그때 마당 풍경이 어땠는지 기억나세요?" 권장)
2. 절대 의료적인 진단을 하거나 조언, 처방(예: "운동을 더 하셔야 합니다" 등)을 언급하지 마세요.
3. 모든 질문은 따뜻하고 존중하는 경어체를 사용하며, 반드시 스스로 생각을 이어 나갈 수 있는 개방형 질문(끝이 물음표 '?' 로 끝남)이어야 합니다.
4. 사실을 함부로 왜곡하거나 지어내지 마세요. 제공된 내용 내에서만 추억을 연계하여 질문을 구성하십시오.
5. 공유 모드일 경우 보호자(자녀)와 공통 질문을 나눌 수 있도록 질문을 설계하고 shared를 true로 태깅하세요.
`;

const CURATED_QUESTIONS = [
  "젊은 날 열심히 돈을 모아서 처음으로 샀던 가장 소중한 물건이 떠오르시나요? 그것을 처음 손에 쥐었을 때 기분은 어땠나요?",
  "가장 처음 사귄 단짝 친구와 함께 가던 골목길이나, 둘이 나누었던 가장 즐거웠던 약속이 기억나시나요?",
  "어머니가 정성껏 끓여주시던 찌개 냄새나 고소한 전을 부치시던 소리 중, 지금도 군침을 돌게 하는 음식이 있으신가요?",
  "가족들에게 처음으로 직접 요리를 대접해 주었던 날이 기억나시나요? 어떤 음식이었고 다들 맛있게 먹었나요?",
  "젊은 시절 흥얼거리며 좋아했던 노래 한 자락이 있으신가요? 그 노래를 들으면 어떤 날씨나 풍경이 함께 연상되시나요?"
];

export const questionGeneratorAgent = {
  /**
   * Generates open-ended reminiscence questions based on contextual information
   */
  generateQuestions: async (
    entities: Entity[],
    history: DBAnswer[],
    isSharedMode: boolean = true
  ): Promise<Question[]> => {
    // Basic mock fallback logic
    let mockQuestions: Question[] = [];

    if (entities.length > 0) {
      // Create dynamic question based on entities
      const eventEntity = entities.find((e) => e.category === "event");
      const personEntity = entities.find((e) => e.category === "person");
      const locationEntity = entities.find((e) => e.category === "location");

      if (eventEntity && locationEntity) {
        mockQuestions.push({
          text: `${locationEntity.name}에서 있었던 ${eventEntity.name}에 대해 기록해 주셨네요. 그날 온 가족이 옹기종기 모여 나누었던 소소한 대화나 마당 가득 차올랐던 설렘이 더 기억나시나요?`,
          type: "entity-based",
          targetEntity: eventEntity.name,
          shared: isSharedMode
        });
      } else if (personEntity) {
        mockQuestions.push({
          text: `추억 속의 ${personEntity.name} 님과 함께 보냈던 시간 중, 지금 생각해도 입가에 미소가 지어지는 따스한 추억이 더 있으신가요?`,
          type: "entity-based",
          targetEntity: personEntity.name,
          shared: isSharedMode
        });
      }
    }

    // Add a gap-detection / curated question as a secondary option
    // Gap detection looks for time periods or topics with no responses
    const hasChildhoodQuestions = history.some(h => h.question_text.includes("어릴 적") || h.question_text.includes("유년"));
    if (!hasChildhoodQuestions) {
      mockQuestions.push({
        text: "어릴 적 살던 동네의 흙냄새나, 해 질 녘 골목길에서 동네 아이들과 술래잡기를 하다 저녁 먹으라고 부르던 어머니의 목소리가 들리던 풍경이 떠오르시나요?",
        type: "gap-detection",
        shared: isSharedMode
      });
    } else {
      const randomCurated = CURATED_QUESTIONS[Math.floor(Math.random() * CURATED_QUESTIONS.length)];
      mockQuestions.push({
        text: randomCurated,
        type: "curated",
        shared: isSharedMode
      });
    }

    // Cap at 3 questions
    mockQuestions = mockQuestions.slice(0, 2);

    const prompt = `
[컨텍스트 데이터]
- 최근 추출된 개체(엔티티) 목록: ${JSON.stringify(entities)}
- 어르신의 과거 답변 이력: ${JSON.stringify(history.map(h => ({ q: h.question_text, a: h.answer_text })))}
- 공유 모드 활성화 여부: ${isSharedMode ? "예 (보호자 연동)" : "아니오"}

위 데이터를 참고하여 규칙을 지켜 회상 질문 1~2개를 생성해 주세요.
`;

    try {
      const response = await geminiService.generateJSON<{
        questions: Question[];
      }>(prompt, questionGeneratorSchema, { questions: mockQuestions }, SYSTEM_INSTRUCTION);

      // Post-processing to enforce rule: must end with ?
      const sanitized = (response.questions || []).map((q) => {
        let text = q.text.trim();
        if (!text.endsWith("?")) {
          text = text + "?";
        }
        return {
          ...q,
          text
        };
      });

      return sanitized.length > 0 ? sanitized : mockQuestions;
    } catch (error) {
      console.error("question-generator-agent error, using fallback:", error);
      return mockQuestions;
    }
  }
};
