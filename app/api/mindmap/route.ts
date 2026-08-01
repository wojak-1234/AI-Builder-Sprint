import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/services/supabase-service";
import { analyzeMindmap } from "@/lib/analytics/mindmap-analyzer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-elderly-123";

    const narratives = await supabaseService.getNarratives(userId);
    const answers = await supabaseService.getAnswers(userId);

    const mockEntities = answers.flatMap((a) => [
      { type: "place" as const, value: "마당", sourceAnswerId: a.id },
      { type: "person" as const, value: "이지영", sourceAnswerId: a.id },
    ]);

    const analytics = analyzeMindmap(mockEntities, answers, narratives);

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
