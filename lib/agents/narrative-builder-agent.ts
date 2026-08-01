import { SchemaType } from "@google/generative-ai";
import { geminiService } from "../../services/gemini-service";
import { DBNarrative, DBAnswer, MergedPerspective } from "../../types";

const narrativeBuilderSchema = {
  type: SchemaType.OBJECT,
  properties: {
    chapters: {
      type: SchemaType.ARRAY,
      description: "답변들을 시간순 및 주제별로 군집화하여 재구성한 이야기 챕터 목록",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "챕터 제목 (예: 감나무 마당의 술래잡기, 소풍날 참기름 냄새)" },
          summary: { type: SchemaType.STRING, description: "나이테 시각화에 표시될 1~2문장의 핵심 요약" },
          content: { type: SchemaType.STRING, description: "개별 답변을 매끄러운 단락으로 다듬고 관점을 통합하여 흐르듯 재구성한 서사문" },
          event_date: { type: SchemaType.STRING, description: "이 사건이 일어난 대략적인 시점 (형식: YYYY-MM-DD 또는 YYYY)" },
          mergedAnswers: {
            type: SchemaType.ARRAY,
            description: "어르신과 보호자의 같은 질문에 대한 서로 다른/동일한 응답 비교 분석 목록",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING, description: "해당 질문 내용" },
                userText: { type: SchemaType.STRING, description: "어르신의 답변 원문" },
                guardianText: { type: SchemaType.STRING, description: "보호자의 대리/공유 답변 원문" },
                differences: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: "두 사람의 답변 내용 간의 세부 사실 차이 및 일치점 요약 (판단 없이 사실만 나열, 예: '어르신은 1955년 가을로 회상하시며, 보호자는 기와집 살던 시기로 기억함')"
                }
              },
              required: ["question"]
            }
          }
        },
        required: ["title", "summary", "content", "event_date"]
      }
    }
  },
  required: ["chapters"]
};

const SYSTEM_INSTRUCTION = `
당신은 회상 답변들을 모아 인생 서사를 재구성하는 서사 분석 에이전트(narrative-builder-agent)입니다.
어르신의 개별 답변들과 보호자가 대리 혹은 공유 모드로 입력한 답변들을 하나의 일관된 나이테 서사로 완성해 주세요.

당신의 작업은 다음 4단계를 정확히 따릅니다:
1. 시간순 정렬: 기록된 사건의 발생 시점(event_date)을 기준으로 이야기를 배열합니다.
2. 군집화: 유사한 연도, 인물, 혹은 마당/소풍 등의 주제를 가진 답변들을 하나의 '챕터' 단위로 묶습니다.
3. 자연어 재구성: 어투를 부드럽고 따뜻하게 문단으로 연결하여 완성도 높은 서사를 만듭니다.
4. 관점 병합 (보호자 답변 연동): 동일한 질문/사건에 대해 어르신과 보호자의 답변이 모두 존재할 경우, 두 관점을 한 챕터 안에 나란히 기술하고, 그 차이점과 공통점을 사실적으로만 정리합니다.
   ★ 절대 어느 쪽이 맞고 틀린지 '정답/오답 판정'을 하거나 '기억의 왜곡/결함'이라고 평가해서는 안 됩니다. "어르신은 ~로 회상하며, 보호자님은 ~로 기억하십니다"와 같이 개별 관점의 병합으로 서술하세요.
`;

export const narrativeBuilderAgent = {
  /**
   * Orchestrates the 4-step process of sorting, clustering, reconstructing, and merging perspectives.
   */
  buildNarratives: async (
    userId: string,
    answers: DBAnswer[]
  ): Promise<DBNarrative[]> => {
    if (!answers || answers.length === 0) {
      return [];
    }

    // Default mock response based on seeder data
    const mockChapters: DBNarrative[] = [
      {
        id: "mock-n-1",
        user_id: userId,
        title: "감나무 마당의 술래잡기",
        summary: "1950년대 중반, 마당에 서 있던 커다란 감나무 뒤로 숨어 술래잡기 놀이를 하며 동네 아이들과 뛰놀던 시절을 회상합니다.",
        content: "김순자 어르신은 1950년대 가을날, 집 앞마당에 있던 커다란 감나무 주변에서 친구들과 술래잡기를 하며 유년 시절을 보냈습니다. 동네 아이들이 모두 모여 깔깔거리며 웃던 소리가 마당 가득 울려 퍼지곤 했습니다. 자녀 이지영 님 역시 어머니가 어린 시절 마당에 감나무가 있던 기와집에서 살며 친구들과 홍시를 나눠 먹던 추억을 들려주셨던 것을 기억하고 있습니다. 두 사람의 기억 속에 감나무 마당은 따스한 나눔과 천진난만한 웃음이 가득한 장소로 깊이 자리 잡고 있습니다.",
        event_date: "1955-10-15",
        created_at: new Date().toISOString(),
        mergedAnswers: [
          {
            question: "어릴 적 마당이 있던 집에서 가장 좋아했던 놀이는 무엇이었나요?",
            userText: "우리 집 마당에 감나무가 한 그루 있었는데, 가을만 되면 동네 아이들이 다 몰려와서 감나무 밑에서 술래잡기를 하고 놀았지. 내가 술래를 많이 했는데, 다들 감나무 뒤에 숨어서 찾기가 쉬웠어.",
            guardianText: "어머니가 옛날에 마당 넓은 기와집에 사셨다고 자주 말씀하셨어요. 특히 그 마당에 큰 감나무가 있었는데, 가을에 홍시를 따서 동네 친구들이랑 나눠 먹는 게 낙이었다고 하셨던 기억이 납니다.",
            differences: [
              "어머니(어르신)는 마당에서 감나무를 배경으로 술래잡기를 하던 기억을 중심적으로 설명하셨습니다.",
              "자녀(보호자)는 어머니가 가을에 감나무 홍시를 친구들과 나눠 먹던 추억을 들려주셨던 이야기를 기억하고 있습니다.",
              "두 분 모두 집 마당에 있던 감나무를 따스한 기억의 중심 요소로 공유하고 있습니다."
            ]
          }
        ]
      },
      {
        id: "mock-n-2",
        user_id: userId,
        title: "설레던 소풍날 분홍 소시지 김밥",
        summary: "1960년대 학창 시절, 어머니가 새벽부터 풍기시던 고소한 참기름 냄새와 노란 계란 옷을 입힌 분홍 소시지 도시락을 안고 나섰던 소풍길을 추억합니다.",
        content: "1964년 봄, 소풍을 앞둔 여고생 김순자는 전날 밤부터 설레어 쉽게 잠들지 못했습니다. 새벽바람을 가르며 부엌에서 퍼져나오던 참기름의 고소한 향기는 소풍 아침의 신호탄이었습니다. 얇게 채 썬 시금치와 노란 단무지만 단출하게 들어간 김밥이었지만 어머니의 사랑이 깃들어 꿀맛 같았습니다. 계란을 입힌 분홍 소시지가 도시락 한구석을 장식할 때면 말할 수 없는 행복을 느꼈습니다.",
        event_date: "1964-05-20",
        created_at: new Date().toISOString(),
        mergedAnswers: []
      }
    ];

    // Helper: Sort answers by event_date chronologically before sending
    const sortedAnswers = [...answers].sort((a, b) => {
      return a.event_date.localeCompare(b.event_date);
    });

    const prompt = `
[회상 답변 목록 (시간순 정렬됨)]
${JSON.stringify(
  sortedAnswers.map((a) => ({
    id: a.id,
    question_text: a.question_text,
    answer_text: a.answer_text,
    event_date: a.event_date,
    by_guardian: a.by_guardian,
    user_id: a.user_id
  }))
)}

위 답변 데이터를 분석하여, 1) 같은 사건/질문에 대한 사용자-보호자 관점을 비교 병합하고, 2) 유사 주제와 시기별로 군집화하여 매끄러운 인생 나이테 서사를 완성해 주세요.
`;

    try {
      const response = await geminiService.generateJSON<{
        chapters: Array<{
          title: string;
          summary: string;
          content: string;
          event_date: string;
          mergedAnswers?: MergedPerspective[];
        }>;
      }>(prompt, narrativeBuilderSchema, { chapters: mockChapters }, SYSTEM_INSTRUCTION);

      const dbChapters: DBNarrative[] = (response.chapters || []).map((ch, idx) => ({
        id: `n-${Date.now()}-${idx}`,
        user_id: userId,
        title: ch.title,
        summary: ch.summary,
        content: ch.content,
        event_date: ch.event_date,
        created_at: new Date().toISOString(),
        mergedAnswers: ch.mergedAnswers
      }));

      // In case API returned empty list, use mockChapters
      return dbChapters.length > 0 ? dbChapters : mockChapters;
    } catch (error) {
      console.error("narrative-builder-agent error, using fallback:", error);
      return mockChapters;
    }
  }
};
