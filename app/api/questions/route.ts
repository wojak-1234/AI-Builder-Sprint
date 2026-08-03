import { NextRequest, NextResponse } from "next/server";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { safetyGuardAgent } from "@/lib/agents/safety-guard-agent";
import { analyzeMindmap, calculateQuestionSelectionProbability, selectTargetEntities } from "@/lib/analytics/mindmap-analyzer";
import { supabaseService, MemoryZone } from "@/services/supabase-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || "user-elderly-123";
    const isShared = !!body.isShared;
    const memoryZone: MemoryZone = body.memoryZone || "sharedIndependentMemory";

    // Fetch user answers, history, and recent daily diaries
    const answers = await supabaseService.getAnswers(userId);
    const recentDiaries = await supabaseService.getRecentDailyDiaries(userId);

    // Dynamically extract real entities from user answers using Agent 1 (ocrExtractorAgent)
    const extractedEntities = await ocrExtractorAgent.extractFromAnswers(answers);

    // Mindmap analytics calculation & Signal Score
    const analytics = analyzeMindmap(extractedEntities, answers, []);
    // Probabilistically select target entities (includes weak/low-connectivity entity with 15% controlled probability)
    const targetEntities = selectTargetEntities(analytics.scoredEntities, analytics.weakEntities, 0.15);
    const topSignalScore = analytics.scoredEntities[0]?.signalScore || 0.5;

    // Mathematical Probability Selection Engine
    const probabilityResult = calculateQuestionSelectionProbability(
      recentDiaries,
      topSignalScore
    );

    // Call Agent 2 (question-generator) with MemoryZone & QuestionKind
    const generated = await questionGeneratorAgent.generateQuestions(
      extractedEntities,
      answers,
      isShared,
      targetEntities,
      memoryZone,
      recentDiaries,
      probabilityResult.selectedKind
    );

    // Mandatory Safety Guard check (Agent 4)
    const verifiedQuestions: string[] = [];
    for (const qText of generated.questions) {
      const guardResult = await safetyGuardAgent.verify(qText);
      if (guardResult.passed) {
        verifiedQuestions.push(qText);
      } else {
        console.warn("Question blocked by Safety Guard:", guardResult.violations);
        verifiedQuestions.push("어릴 적 가을날 마당에서 친구들과 도런도런 이야기 나누던 기억이 나시나요?");
      }
    }

    return NextResponse.json({
      success: true,
      questions: verifiedQuestions,
      memoryZone: generated.memoryZone,
      shared: generated.shared,
      questionKind: probabilityResult.selectedKind,
      pDiaryBased: probabilityResult.pDiaryBased,
    });
  } catch (err: any) {
    console.error("API /api/questions error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
