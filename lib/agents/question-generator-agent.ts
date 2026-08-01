import { solarService } from "@/services/solar-service";
import { DBAnswer, MemoryZone } from "@/services/supabase-service";
import { ExtractedEntity } from "@/lib/analytics/mindmap-analyzer";

export type QuestionGeneratorOutput = {
  questions: string[];
  memoryZone: MemoryZone;
  shared: boolean;
  questionKind?: "personal_reminiscence" | "recent_diary_recall";
};

export const questionGeneratorAgent = {
  /**
   * [Agent 2] question-generator
   * Generates 1-3 open-ended reminiscence questions using Upstage Solar Pro 3 (temp 0.4).
   * Supports 3-tier MemoryZone branching and dynamic QuestionKind (personal_reminiscence vs recent_diary_recall).
   */
  generateQuestions: async (
    entities: ExtractedEntity[],
    answersHistory: DBAnswer[],
    isSharedMode: boolean = false,
    topSignalEntities: ExtractedEntity[] = [],
    memoryZone: MemoryZone = "sharedIndependentMemory",
    recentDiaries: { content: string; event_date: string }[] = [],
    questionKind: "personal_reminiscence" | "recent_diary_recall" = "personal_reminiscence"
  ): Promise<QuestionGeneratorOutput> => {
    const targetEntities = topSignalEntities.length > 0 ? topSignalEntities : entities;
    const entityListStr = targetEntities.map((e) => `${e.type}:${e.value}`).join(", ") || "유년 시절, 마당, 추억";
    const historyStr = answersHistory.slice(-3).map((a) => `질문: ${a.question_text}\n답변: ${a.answer_text}`).join("\n---\n");
    const diaryStr = recentDiaries.slice(0, 2).map((d) => `일기: ${d.content}`).join("\n");

    let zoneGuidance = "";
    let isShared = isSharedMode;

    if (memoryZone === "sharedIndependentMemory") {
      isShared = true;
      zoneGuidance = `[MemoryZone: sharedIndependentMemory - 핵심 공유 구간]
- 부모와 자녀 모두 직접 경험한 초등학교 입학, 소풍, 가족 행사 등의 공통 사건입니다.
- 양쪽 모두 각자의 기억을 풀어놓을 수 있는 개방형 질문으로 작성하세요. (예: "자녀분이 초등학교 들어가던 날, 기억나는 장면이 있으세요?")`;
    } else if (memoryZone === "inheritedStory") {
      isShared = true;
      zoneGuidance = `[MemoryZone: inheritedStory - 자녀 유아기 전해들은 이야기]
- 자녀가 아기였을 때의 이야기입니다.
- 부모에게는 당시의 솔직한 회상 질문을, 자녀에게는 "어릴 적 부모님께 이 이야기 들어보신 적 있으세요?" 형태로 들었던 기억에 대한 반응을 유도하도록 작성하세요.`;
    } else {
      // soloPatientOnly
      isShared = false;
      zoneGuidance = `[MemoryZone: soloPatientOnly - 자녀 출생 전 부모님의 단독 인생]
- 부모님이 자녀를 낳기 전 유년 시절이나 청년 시절의 단독 추억입니다.
- 절대로 자녀에게 동시 발송하지 않는 부모 단독 질문으로 작성하세요. (추후 '자녀분이 모르는 부모님의 소중한 이야기' 챕터로 엮입니다.)`;
    }

    let kindGuidance = "";
    if (questionKind === "recent_diary_recall" && diaryStr) {
      kindGuidance = `[QuestionKind: recent_diary_recall - 최근 일상 일기 기반 연계 회상]
- 어르신이 며칠 전이나 오늘 적으신 일상 일기 내용(${diaryStr})과 유년 시절/과거 엔티티(${entityListStr})를 다정하게 연결하여 인지 자극 회상 질문으로 만드세요.
(예: "며칠 전 산책길에서 들꽃을 보셨다고 하셨는데, 유년 시절 고향 집 들판에서 자주 보셨던 꽃이나 추억도 함께 생각나셨나요?")`;
    } else {
      kindGuidance = `[QuestionKind: personal_reminiscence - 개인적 원본 회상]
- 어르신의 가슴속 깊은 곳에 간직된 과거 유년/청년 시절 소중한 개인적 경험과 인물, 장소에 대한 정겨운 원본 회상 질문으로 만드세요.`;
    }

    const systemPrompt = `너는 노년층의 회상을 돕는 '이음' 플랫폼의 따뜻한 회상 질문 생성기이다.
반드시 아래의 [절대 원칙], [MemoryZone 지침], [QuestionKind 지침]을 100% 엄격히 준수하여 질문을 작성하라:

[절대 원칙]
1. 절대로 의료적/정신과적 진단을 하지 마라 ("치매 초기", "인지 저하" 등 언급 절대 금지).
2. 절대로 사용자의 답변에 대한 조언이나 지침, 처방을 주지 마라.
3. 절대로 정답이나 오답을 판정하거나 채점하지 마라.
4. 질문은 항상 어르신 스스로 과거의 소중한 경험을 편안히 풀어놓을 수 있는 '개방형 질문'으로 끝내라.
5. 오직 제공된 사실과 엔티티 키워드만 활용하고, 지어내거나 왜곡하지 마라.

${zoneGuidance}

${kindGuidance}

[출력 형식]
JSON 객체 형식으로만 출력하라: { "questions": ["질문1", "질문2"] }`;

    const userPrompt = `아래 언급 빈도가 높거나 탐구 가치가 높은 우선순위 엔티티 키워드와 과거 답변 기록 및 최근 일기 기록을 바탕으로 질문 1~3개를 생성해 주세요.

우선 탐구 엔티티: [${entityListStr}]
MemoryZone: ${memoryZone}
질문 유형: ${questionKind}

최근 작성 일기:
${diaryStr || "없음"}

과거 답변 히스토리:
${historyStr}

응답은 JSON 포맷으로 {"questions": ["..."]} 형태로만 작성해 주세요.`;

    try {
      const responseText = await solarService.generateText(userPrompt, {
        temperature: 0.4,
        responseFormatJson: true,
        systemPrompt,
      });

      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return {
            questions: parsed.questions.slice(0, 3),
            memoryZone,
            shared: isShared,
            questionKind,
          };
        }
      }
    } catch (err) {
      console.error("Error in Agent 2 (question-generator):", err);
    }

    // Fallback questions per memoryZone
    const fallbackQuestions =
      memoryZone === "soloPatientOnly"
        ? ["자녀분을 만나기 전, 어릴 적 집 앞 마당에서 친구들과 함께 즐겁게 놀았던 추억이 생각나시나요?"]
        : memoryZone === "inheritedStory"
          ? ["자녀분이 아기였을 때 밤잠을 설치며 보살피던 순간이나 가장 사랑스러웠던 모습이 떠오르시나요?"]
          : ["자녀분이 처음 입학하거나 소풍 가던 날 아침, 함께 나누었던 이야기나 설렘이 기억나시나요?"];

    return {
      questions: fallbackQuestions,
      memoryZone,
      shared: isShared,
    };
  },

  /**
   * Generates a single open-ended question based on user/guardian custom text input or photo OCR entities.
   */
  generateCustomTopicQuestion: async (
    rawTopicInput: string,
    extractedEntities: ExtractedEntity[] = [],
    creatorRole: "self" | "guardian" = "self"
  ): Promise<{ question: string; shared: boolean }> => {
    const entityListStr = extractedEntities.map((e) => `${e.type}:${e.value}`).join(", ");
    const roleContext = creatorRole === "guardian" ? "자녀분(보호자)이 어르신과 함께 나누고 싶어서 직접 제시한 추억 주제" : "어르신 본인이 직접 꺼낸 소중한 추억 힌트";

    const systemPrompt = `너는 노년층의 회상을 돕는 '이음' 플랫폼의 따뜻한 회상 질문 생성기이다.
사용자나 보호자가 직접 제공한 텍스트 또는 사진 판독 키워드를 바탕으로 어르신이 정겹게 답변할 수 있는 1개의 따뜻한 개방형 회상 질문으로 다듬어라.

[절대 원칙]
1. 절대 진단이나 처방, 조언하지 마라.
2. 절대 채점하거나 정답/오답을 내리지 마라.
3. 질문은 반드시 다정하고 따뜻하며 스스로 과거 추억을 이야기할 수 있는 개방형 문장 1개로 완성하라.

[출력 포맷]
JSON 형식: { "question": "질문 문구" }`;

    const userPrompt = `제시된 주제 힌트를 바탕으로 회상 질문 1개를 작성해 주세요.
작성 주체 성격: ${roleContext}
입력 힌트 문구: "${rawTopicInput}"
추출 키워드: [${entityListStr}]

응답은 JSON 포맷으로 {"question": "..."} 형태로만 작성해 주세요.`;

    try {
      const responseText = await solarService.generateText(userPrompt, {
        temperature: 0.4,
        responseFormatJson: true,
        systemPrompt,
      });

      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.question && typeof parsed.question === "string") {
          return {
            question: parsed.question,
            shared: creatorRole === "guardian",
          };
        }
      }
    } catch (err) {
      console.error("Error in generateCustomTopicQuestion:", err);
    }

    const fallbackQ = rawTopicInput
      ? `"${rawTopicInput}"에 관해 가슴속에 간직하고 계신 정겨운 기억을 편안히 나누어 주시겠어요?`
      : "사진 속에 담긴 소중한 그날의 이야기와 느낌을 조금 더 들려주시겠어요?";

    return {
      question: fallbackQ,
      shared: creatorRole === "guardian",
    };
  },
};
