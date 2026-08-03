import { NextRequest, NextResponse } from "next/server";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { narrativeBuilderAgent } from "@/lib/agents/narrative-builder-agent";
import { safetyGuardAgent } from "@/lib/agents/safety-guard-agent";
import { analyzeMindmap } from "@/lib/analytics/mindmap-analyzer";
import { supabaseService } from "@/services/supabase-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || "user-elderly-123";

    const answers = await supabaseService.getAnswers(userId);

    // Agent 3 (narrative-builder 4-stage relay)
    const result = await narrativeBuilderAgent.buildNarratives(userId, answers);

    // Mandatory Safety Guard check (Agent 4) — verified PER CHAPTER, not just on the
    // concatenated text, so a violation in one chapter can't slip through by being diluted
    // across the full narrative. Any chapter that fails is replaced, never shipped as-is.
    const violatedChapters: string[] = [];
    const verifiedNarratives = [];
    for (const narrative of result.narratives) {
      const chapterGuard = await safetyGuardAgent.verify(narrative.content);
      if (chapterGuard.passed) {
        verifiedNarratives.push(narrative);
      } else {
        console.warn(`Narrative chapter "${narrative.title}" failed Safety Guard checklist:`, chapterGuard.violations);
        violatedChapters.push(narrative.title);
        verifiedNarratives.push({
          ...narrative,
          content: "이 시기의 기억은 다정하게 다시 정리하는 중입니다. 다음 회상 때 이어가 볼게요.",
        });
      }
    }
    const verifiedFullNarrativeText = verifiedNarratives
      .map((n) => `\n\n### ${n.title} (${n.event_date.substring(0, 4)})\n${n.content}`)
      .join("")
      .trim();

    // Dynamically extract real entities from user answers using Agent 1 (ocrExtractorAgent)
    const extractedEntities = await ocrExtractorAgent.extractFromAnswers(answers);
    const analytics = analyzeMindmap(extractedEntities, answers, verifiedNarratives);

    return NextResponse.json({
      success: true,
      narratives: verifiedNarratives,
      fullNarrativeText: verifiedFullNarrativeText,
      safetyCheck: { passed: violatedChapters.length === 0, violatedChapters },
      analytics: {
        weakEntities: analytics.weakEntities,
        nodeSizes: analytics.nodeSizes,
        suggestedSharedFrequency: analytics.suggestedSharedFrequency,
      },
    });
  } catch (err: any) {
    console.error("API /api/narrative error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
