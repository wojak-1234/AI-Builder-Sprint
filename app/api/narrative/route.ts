import { NextRequest, NextResponse } from "next/server";
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

    // Mandatory Safety Guard check on fullNarrativeText (Agent 4)
    const guardResult = await safetyGuardAgent.verify(result.fullNarrativeText);

    if (!guardResult.passed) {
      console.warn("Narrative text failed Safety Guard checklist:", guardResult.violations);
    }

    // Run mindmap-analyzer calculations
    const mockEntities = answers.map((a) => ({
      type: "place" as const,
      value: "마당",
      sourceAnswerId: a.id,
    }));
    const analytics = analyzeMindmap(mockEntities, answers, result.narratives);

    return NextResponse.json({
      success: true,
      narratives: result.narratives,
      fullNarrativeText: result.fullNarrativeText,
      safetyCheck: guardResult,
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
