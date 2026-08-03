import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/services/supabase-service";
import { analyzeMindmap } from "@/lib/analytics/mindmap-analyzer";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-elderly-123";

    const narratives = await supabaseService.getNarratives(userId);
    const answers = await supabaseService.getAnswers(userId);

    // Dynamically extract real entities from user answers using Agent 1 (ocrExtractorAgent)
    const extractedEntities = await ocrExtractorAgent.extractFromAnswers(answers);

    const analytics = analyzeMindmap(extractedEntities, answers, narratives);

    return NextResponse.json({
      success: true,
      narratives,
      analytics,
    });
  } catch (err: any) {
    console.error("API /api/mindmap error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
