import { solarService } from "@/services/solar-service";
import { upstageService } from "@/services/upstage-service";
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
   * Supports 3-tier MemoryZone branching, Plan C (15 past history window), and Plan A (Upstage Embedding Semantic Similarity Deduplication).
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
    // Plan C: Extended history window (slice -15) for context aware anti-repetition
    const recentHistoryItems = answersHistory.slice(-15);
    const historyStr = recentHistoryItems.map((a) => `질문: ${a.question_text}\n답변: ${a.answer_text}`).join("\n---\n");
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
6. 질문은 1개만 출력하고 맥락정도만 물어보고 자세히 물어보지 마라.
7. 과거 답변 히스토리에 기재된 과거 질문들과 주제, 소재, 맥락이 비슷한 질문을 절대로 중복해서 묻지 마라.

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
          let candidateQuestions: string[] = parsed.questions.slice(0, 3);

          // Plan A: Upstage Embedding Semantic Similarity Deduplication Gate
          const pastQuestionTexts = recentHistoryItems.map((a) => a.question_text);
          if (pastQuestionTexts.length > 0) {
            const freshQuestions: string[] = [];
            for (const candidateQ of candidateQuestions) {
              let isDuplicate = false;
              const candidateEmbedding = await upstageService.getEmbedding(candidateQ);

              if (candidateEmbedding.length > 0) {
                for (const pastQ of pastQuestionTexts) {
                  const pastEmbedding = await upstageService.getEmbedding(pastQ);
                  const sim = upstageService.cosineSimilarity(candidateEmbedding, pastEmbedding);
                  if (sim >= 0.82) {
                    console.log(`[Plan A Vector Deduplication] Filtered out duplicate question (sim: ${sim}): "${candidateQ}" vs past "${pastQ}"`);
                    isDuplicate = true;
                    break;
                  }
                }
              }

              if (!isDuplicate) {
                freshQuestions.push(candidateQ);
              }
            }

            if (freshQuestions.length > 0) {
              candidateQuestions = freshQuestions;
            }
          }

          return {
            questions: candidateQuestions,
            memoryZone,
            shared: isShared,
            questionKind,
          };
        }
      }
    } catch (err) {
      console.error("Error in Agent 2 (question-generator):", err);
    }

    // Fallback questions bank per memoryZone (Deduplicated against history)
    const fallbackBank =
      memoryZone === "soloPatientOnly"
        ? [
            "자녀분을 만나기 전, 어릴 적 집 앞 마당에서 친구들과 함께 즐겁게 놀았던 추억이 생각나시나요?",
            "청년 시절 처음으로 혼자 멀리 여행을 떠나시거나 고향을 나섰던 날의 기분은 어떠하셨나요?",
            "어릴 적 가장 좋아하셨던 계절과 그 계절이 되면 생각나는 정겨운 음식이나 추억이 있으신가요?"
          ]
        : memoryZone === "inheritedStory"
          ? [
            "자녀분이 아기였을 때 밤잠을 설치며 보살피던 순간이나 가장 사랑스러웠던 모습이 떠오르시나요?",
            "자녀분이 처음 걸음마를 떼거나 처음으로 '엄마/아빠'라고 불렀던 순간의 감동이 기억나시나요?",
            "어릴 적 자녀분에게 자주 들려주시던 이야기나 함께 불렀던 동요가 있으신가요?"
          ]
          : [
            "자녀분이 처음 입학하거나 소풍 가던 날 아침, 함께 나누었던 이야기나 설렘이 기억나시나요?",
            "가족이 다 함께 모여 맛있는 음식을 나누어 드셨던 명절이나 특별한 날의 기억이 떠오르시나요?",
            "자녀분과 함께 산책하거나 장을 보러 다니셨던 정겨운 거리나 길목이 있으신가요?"
          ];

    const pastQTexts = new Set(answersHistory.map((a) => a.question_text.trim()));
    const freshFallback = fallbackBank.find((q) => !pastQTexts.has(q.trim())) || fallbackBank[0];

    return {
      questions: [freshFallback],
      memoryZone,
      shared: isShared,
    };
  },

  /**
   * Generates a single open-ended question based on user/guardian custom text input or photo OCR entities.
   * Ensures strictly NO preamble, NO extra explanations, and pure question formatting.
   */
  generateCustomTopicQuestion: async (
    rawTopicInput: string,
    extractedEntities: ExtractedEntity[] = [],
    creatorRole: "self" | "guardian" = "self"
  ): Promise<{ question: string; shared: boolean }> => {
    const sanitizedInput = rawTopicInput
      .replace(/\[(사진 설명|지면 글씨|첨부 사진 기록)\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const entityListStr = extractedEntities.map((e) => `${e.type}:${e.value}`).join(", ");
    const roleContext = creatorRole === "guardian" ? "자녀분(보호자)이 직접 제안한 특정 추억 주제" : "어르신 본인이 직접 꺼낸 특정 추억 주제";

    const systemPrompt = `너는 노년층의 회상을 돕는 '이음' 플랫폼의 사용자 맞춤 질문 변환 전용 에이전트이다.
사용자나 보호자가 입력한 특정 [입력 힌트 문구]를 바탕으로, 해당 주제를 직접 언급하여 어르신께 물어보는 1개의 명확하고 다정한 회상 질문으로 변환하라.

[절대 작성 원칙]
1. 입력 힌트에 기재된 연도, 장소, 인물, 사건 키워드(예: "2002년 소풍 이야기", "1972년 돌잔치")를 자연스럽게 포착하여 다정한 1문장 질문으로 작성하라.
2. 절대로 '[사진 설명]', '[지면 글씨]' 같은 포맷 태그 문구를 질문 문장 안에 그대로 붙이거나 포함하지 마라.
3. 절대로 주제를 포괄적이거나 일반적인 추상적 질문으로 우회하지 말고, 맥락 속 주요 사건을 직접적으로 다정하게 물어보라.
4. 인사말, 머리말("질문:"), 부가설명 문구를 단 1단어도 포함하지 마라.
5. 질문 문장은 반드시 '?'(물음표)로 끝나게 하라.

[출력 포맷]
JSON 형식: { "question": "질문 문장" }`;

    const userPrompt = `아래 [입력 힌트 문구]의 맥락과 사건을 바탕으로 어르신께 드릴 명확하고 다정한 질문 1개로 변환해 주세요.
작성 주체: ${roleContext}
입력 힌트 문구: "${sanitizedInput}"
추출 키워드: [${entityListStr}]

[변환 예시]
- 입력: "2002년 소풍 이야기" -> 질문: "2002년 소풍 갔던 날, 어떤 재미있는 일이 있었나요?"
- 입력: "1972년 마당에서 선우 돌잔치를 치렀다" -> 질문: "1972년 선우 돌잔치 날, 온 가족이 모여 즐겁게 보내셨던 기분이 어떠하셨나요?"
- 입력: "어머니 된장찌개" -> 질문: "어머니가 끓여주신 된장찌개에 대해 어떤 따뜻한 기억이 있으신가요?"

응답은 JSON 포맷으로 {"question": "..."} 형태로만 작성해 주세요.`;

    const cleanQuestion = (raw: string): string => {
      let cleaned = raw
        .replace(/\[(사진 설명|지면 글씨|첨부 사진 기록)\]/g, "")
        .replace(/^["'‘“`]+|["'’`”]+$/g, "")
        .replace(/^(질문\s*:?\s*|추천\s*질문\s*:?\s*|답변\s*:?\s*|안녕하세요[!\s,.]*|다음은\s*질문입니다[!\s,.]*)/i, "")
        .trim();

      if (cleaned.includes("\n")) {
        const lines = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.endsWith("?") || l.includes("?"));
        if (lines.length > 0) {
          cleaned = lines[0];
        }
      }

      if (!cleaned.endsWith("?")) {
        cleaned = cleaned.replace(/[.!\s]+$/, "") + "?";
      }

      return cleaned;
    };

    try {
      const responseText = await solarService.generateText(userPrompt, {
        temperature: 0.2,
        responseFormatJson: true,
        systemPrompt,
      });

      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.question && typeof parsed.question === "string") {
          return {
            question: cleanQuestion(parsed.question),
            shared: creatorRole === "guardian",
          };
        }
      }
    } catch (err) {
      console.error("Error in generateCustomTopicQuestion:", err);
    }

    // Smart Fallback Handling
    let fallbackQ = "제시해주신 소중한 사진과 추억에 대해 어떤 이야기가 떠오르시나요?";
    if (sanitizedInput) {
      if (sanitizedInput.length > 25 || sanitizedInput.includes("\n")) {
        const yearMatch = sanitizedInput.match(/19[5-9]\d|20[0-2]\d/);
        if (yearMatch) {
          fallbackQ = `${yearMatch[0]}년 무렵에 치르셨던 특별한 일이나 추억에 대해 어떤 기억이 생각나시나요?`;
        } else {
          fallbackQ = "올려주신 사진 속 지면 글과 관련하여 어떤 정겨운 이야기가 생각나시나요?";
        }
      } else {
        const cleanInput = sanitizedInput.replace(/(이야기|추억|기억)$/, "").trim();
        fallbackQ = `${cleanInput}에 대해 어떤 소중한 추억이 떠오르시나요?`;
      }
    }

    return {
      question: cleanQuestion(fallbackQ),
      shared: creatorRole === "guardian",
    };
  },

  /**
   * Generates a dynamic, contextual daily diary prompt based on user's recent answers and diary history.
   * Connects recent keywords/entities into a warm, inviting daily life prompt using Upstage Solar.
   */
  generateDynamicDailyDiaryPrompt: async (
    answersHistory: DBAnswer[] = [],
    recentDiaries: { content: string; event_date?: string }[] = []
  ): Promise<string> => {
    const recentAnswerSnippet = answersHistory
      .slice(-5)
      .map((a) => a.answer_text)
      .filter(Boolean)
      .join(" ");

    const recentDiarySnippet = recentDiaries
      .slice(0, 3)
      .map((d) => d.content)
      .filter(Boolean)
      .join(" ");

    const contextText = `${recentAnswerSnippet} ${recentDiarySnippet}`.trim();

    if (!contextText) {
      const defaultPrompts = [
        "오늘 어떤 일이 있으셨고, 특별히 드신 맛있는 음식이 있으신가요?",
        "오늘 하루 중 가장 마음이 따뜻하셨던 순간이나 특별히 남기고 싶으신 일상이 있으신가요?",
        "오늘 걸으시거나 이웃, 가족과 대화하며 나눈 정겨운 이야기가 있으신가요?",
        "오늘 계절 날씨나 풍경을 보시며 어떤 생각이나 느낌이 드셨나요?",
      ];
      const dayIndex = new Date().getDay() % defaultPrompts.length;
      return defaultPrompts[dayIndex];
    }

    const systemPrompt = `너는 노년층 어르신의 일상 기록을 따뜻하게 유도하는 '이음' 일상 일기 질문 다듬기 에이전트이다.
어르신의 최근 회상 기록(${contextText.slice(0, 150)}) 맥락을 바탕으로, 어르신이 오늘 하루의 소소한 일상(오늘 먹은 음식, 마주친 풍경, 이웃/가족과의 대화, 건강 상태 등)을 편안히 기록하실 수 있는 다정한 1문장 질문을 작성하라.

[작성 원칙]
1. 부가설명, 인사말, 기호("질문:") 없이 오직 1문장의 개방형 질문만 작성하라.
2. 어르신의 최근 회상 키워드가 있다면 자연스럽게 연계하여 오늘 일상을 물어보아라.
3. 물음표(?)로 끝마쳐라.
4. 의료 진단이나 조언을 절대 포함하지 마라.

JSON 포맷: { "prompt": "질문 문장" }`;

    const userPrompt = `어르신의 최근 맥락: "${contextText.slice(0, 150)}"
오늘 일상 일기 적기를 유도할 따뜻한 1문장 질문을 생성해 주세요.`;

    try {
      const responseText = await solarService.generateText(userPrompt, {
        temperature: 0.5,
        responseFormatJson: true,
        systemPrompt,
      });

      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.prompt && typeof parsed.prompt === "string" && parsed.prompt.trim()) {
          let prompt = parsed.prompt.replace(/^["'‘“`]+|["'’`”]+$/g, "").trim();
          if (!prompt.endsWith("?")) prompt += "?";
          return prompt;
        }
      }
    } catch (err) {
      console.error("Error generating dynamic daily diary prompt:", err);
    }

    const fallbacks = [
      "오늘 어떤 일이 있으셨고, 특별히 드신 맛있는 음식이 있으신가요?",
      "오늘 하루 만난 반가운 얼굴이나 마주친 정겨운 풍경이 있으신가요?",
      "오늘 드신 식사나 소소한 일상 중 어떤 순간이 기억에 남으시나요?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  },
};
