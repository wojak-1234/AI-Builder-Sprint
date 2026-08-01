import { SchemaType } from "@google/generative-ai";
import { geminiService } from "../../services/gemini-service";
import { SafetyGuardResult } from "../../types";

const safetyGuardSchema = {
  type: SchemaType.OBJECT,
  properties: {
    passed: {
      type: SchemaType.BOOLEAN,
      description: "검수 통과 여부. 위반 사항이 전혀 없으면 true, 하나라도 위반하면 false"
    },
    reason: {
      type: SchemaType.STRING,
      description: "위반된 이유 또는 감지된 위반 사항 설명 (통과하지 못한 경우 필수)"
    },
    fallbackOutput: {
      type: SchemaType.STRING,
      description: "위반 사항을 교정하여 안전하게 수정한 대체 텍스트 (통과하지 못한 경우 필수)"
    }
  },
  required: ["passed"]
};

const SYSTEM_INSTRUCTION = `
당신은 기억 건강 진단 및 처방 방지 검수 에이전트(safety-guard-agent)입니다.
어르신과 자녀가 사용하는 기억 회상 플랫폼의 모든 생성 텍스트(질문, 재구성된 서사 등)를 사전 검수해야 합니다.

[검수 위반 기준]
1. 의료적 진단 또는 암시:
   - "치매 초기", "인지 기능 저하", "경도인지장애", "알츠하이머", "진단" 등 의학적인 상태를 판단하는 모든 종류의 표현을 절대 허용하지 않습니다.
   - 단, "요즘 피로하시거나 컨디션은 어떠신가요?" 처럼 일반적인 안부형 질문은 허용됩니다.
2. 조언 또는 처방:
   - "매일 아침 걷기를 해야 합니다", "이 약을 먹어야 기억이 좋아집니다" 등 의학적이거나 비의학적인 지시, 강요, 처방적 조언을 포함해서는 안 됩니다.
3. 정답/오답 판정 및 기억의 평가:
   - "어르신의 기억에 오류가 있습니다", "자녀의 말이 맞습니다", "틀린 기억" 같은 판정성 텍스트를 절대 금지합니다.
4. 강압적이거나 치료적인 뉘앙스:
   - 본 플랫폼은 비약물적 인지 자극 및 세대 간 연결만을 목적으로 합니다. '치료', '치유', '개선' 같은 부담을 주는 단어는 지양합니다.

검수 결과를 엄격히 판단해 주세요. 위반이 있을 경우 passed를 false로 하고, 위반 사유를 적은 뒤 위반 요소를 완전히 제거하고 따뜻한 개방형 어투로 수정한 안전한 텍스트(fallbackOutput)를 제공해야 합니다.
`;

export const safetyGuardAgent = {
  /**
   * Automatically inspects text to check against safety violations.
   * Enforces rules and cannot be bypassed.
   */
  checkSafety: async (content: string, type: "question" | "narrative"): Promise<SafetyGuardResult> => {
    if (!content || content.trim().length === 0) {
      return { passed: true };
    }

    // Client-side quick check (regex fallback) for absolute safety
    const forbiddenKeywords = [
      "치매",
      "알츠하이머",
      "인지저하",
      "인지장애",
      "진단",
      "처방",
      "치료",
      "의심됩니다",
      "오류가",
      "틀렸",
      "맞았습니다",
      "틀렸습니다",
      "정답",
      "오답",
      "치료해야",
      "약 복용"
    ];

    const hasForbiddenKeyword = forbiddenKeywords.some((word) => content.includes(word));
    
    let mockResult: SafetyGuardResult = {
      passed: !hasForbiddenKeyword,
      reason: hasForbiddenKeyword ? "의료적 단어 또는 평가적 표현이 포함되어 있습니다." : undefined,
      fallbackOutput: hasForbiddenKeyword 
        ? content
            .replace(/치매 초기 증상 같습니다/g, "최근 답변에서 비슷한 내용을 말씀해 주시는데, 요즘 피곤하시거나 컨디션은 어떠신가요?")
            .replace(/치매/g, "기억 건강")
            .replace(/진단/g, "안부 확인")
            .replace(/정답|오답|틀렸습니다/g, "다른 관점의 이야기")
        : undefined
    };

    const prompt = `
[검수 대상 텍스트 (${type === "question" ? "회상 질문" : "인생 서사"})]
"""
${content}
"""

위 텍스트에 대해 의료 진단, 처방, 혹은 정답/오답 판단이 포함되어 있는지 엄격하게 검증하여 JSON으로 출력해 주세요.
`;

    try {
      const response = await geminiService.generateJSON<SafetyGuardResult>(
        prompt,
        safetyGuardSchema,
        mockResult,
        SYSTEM_INSTRUCTION
      );

      // If Gemini returned failed validation but didn't provide fallback, guarantee one
      if (response.passed === false && !response.fallbackOutput) {
        response.fallbackOutput = mockResult.fallbackOutput || content;
      }

      return response;
    } catch (error) {
      console.error("safety-guard-agent error, using fallback safety:", error);
      return mockResult;
    }
  }
};
