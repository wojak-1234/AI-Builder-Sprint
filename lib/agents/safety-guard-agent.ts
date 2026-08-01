import { solarService } from "@/services/solar-service";

export type SafetyCheckResult = {
  passed: boolean;
  violations: string[];
  hasDiagnosis: boolean;
  hasAdvice: boolean;
  hasJudgement: boolean;
  isDistorted: boolean;
};

export const safetyGuardAgent = {
  /**
   * [Agent 4] safety-guard (Mandatory Check Gate)
   * Uses Upstage Solar Pro 3 (temp 0.1) for deterministic safety checklist verification.
   * Checks for: Medical diagnosis, Advice/prescription, Right/wrong judgements, and Distortion.
   * CANNOT be bypassed. Must be called as final step in all API routes.
   */
  verify: async (text: string): Promise<SafetyCheckResult> => {
    if (!text || !text.trim()) {
      return {
        passed: true,
        violations: [],
        hasDiagnosis: false,
        hasAdvice: false,
        hasJudgement: false,
        isDistorted: false,
      };
    }

    const systemPrompt = `너는 노년층 안심 플랫폼 '이음'의 엄격한 안전검수 시스템(Safety Guard)이다.
제시된 문장에 다음 금지 요소가 포함되어 있는지 냉정하게 검수하라:

[검수 항목]
1. hasDiagnosis: 의료적/정신과적 진찰이나 소견 표현 ("치매", "인지장애", "치매 초기", "치매 위험" 등)
2. hasAdvice: 강요나 지침, 처방, 명령조 표현 ("~해야 합니다", "~를 드세요" 등)
3. hasJudgement: 정답/오답 판단, 점수 부여, 랭킹, 열등 비교 표현
4. isDistorted: 사실 왜곡이나 조작 표현

응답은 반드시 아래 JSON 형식으로만 답하라:
{
  "hasDiagnosis": boolean,
  "hasAdvice": boolean,
  "hasJudgement": boolean,
  "isDistorted": boolean,
  "violations": ["위반 항목 원인 설명"]
}`;

    try {
      const responseText = await solarService.generateText(`검수 대상 문장:\n"${text}"`, {
        temperature: 0.1,
        responseFormatJson: true,
        systemPrompt,
      });

      if (responseText) {
        const result = JSON.parse(responseText);
        const hasDiag = !!result.hasDiagnosis;
        const hasAdv = !!result.hasAdvice;
        const hasJudge = !!result.hasJudgement;
        const isDist = !!result.isDistorted;

        const violations: string[] = result.violations || [];
        if (hasDiag) violations.push("의료적 진단성 표현 검출");
        if (hasAdv) violations.push("조언 및 처방성 표현 검출");
        if (hasJudge) violations.push("정답/오답 판정 및 비교 표현 검출");
        if (isDist) violations.push("사실 왜곡 표현 검출");

        const passed = !hasDiag && !hasAdv && !hasJudge && !isDist;

        return {
          passed,
          violations: Array.from(new Set(violations)),
          hasDiagnosis: hasDiag,
          hasAdvice: hasAdv,
          hasJudgement: hasJudge,
          isDistorted: isDist,
        };
      }
    } catch (err) {
      console.error("Error in Agent 4 (safety-guard):", err);
    }

    // Fallback keyword scanning if API fails
    const lower = text.toLowerCase();
    const hasDiag = lower.includes("치매") || lower.includes("인지장애") || lower.includes("의학적 진단");
    const hasAdv = lower.includes("반드시 ~해야") || lower.includes("처방");
    const hasJudge = lower.includes("틀렸습니다") || lower.includes("오답입니다") || lower.includes("점수는");

    const passed = !hasDiag && !hasAdv && !hasJudge;

    return {
      passed,
      violations: passed ? [] : ["안전 규칙 위반 항목 검출"],
      hasDiagnosis: hasDiag,
      hasAdvice: hasAdv,
      hasJudgement: hasJudge,
      isDistorted: false,
    };
  },
};
