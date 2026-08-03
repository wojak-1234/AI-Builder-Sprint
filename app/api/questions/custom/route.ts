import { NextRequest, NextResponse } from "next/server";
import { upstageService } from "@/services/upstage-service";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { safetyGuardAgent } from "@/lib/agents/safety-guard-agent";
import { supabaseService, DBQuestionHistory } from "@/services/supabase-service";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let userId = "user-elderly-123";
    let textHint = "";
    let creatorRole: "self" | "guardian" = "self";
    let extractedEntities: any[] = [];
    let imageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      userId = (formData.get("userId") as string) || userId;
      textHint = (formData.get("textHint") as string) || "";
      creatorRole = ((formData.get("creatorRole") as string) || "self") as "self" | "guardian";
      imageFile = formData.get("file") as File | null;
    } else {
      const body = await req.json();
      userId = body.userId || userId;
      textHint = body.textHint || "";
      creatorRole = body.creatorRole || "self";
    }

    let photoContextStr = "";

    // Process image file with OCR (Agent 1) if uploaded
    if (imageFile) {
      try {
        const upstageResult = await upstageService.parseDocument(imageFile);
        const ocrResult = await ocrExtractorAgent.extract(upstageResult.text);
        extractedEntities = ocrResult.entities.map((e) => ({
          type: e.type,
          value: e.value,
          sourceAnswerId: "custom-upload",
        }));
        photoContextStr = ocrResult.text ? ocrResult.text.trim() : "옛 앨범 사진 스캔본";
        if (!textHint) {
          textHint = photoContextStr;
        }
      } catch (ocrErr) {
        console.warn("Custom topic OCR parsing warning:", ocrErr);
      }
    }

    // Call Agent 2 for custom question generation
    const generated = await questionGeneratorAgent.generateCustomTopicQuestion(
      textHint,
      extractedEntities,
      creatorRole
    );

    // Call Agent 4 for safety verification
    let finalQText = generated.question;
    const safetyCheck = await safetyGuardAgent.verify(finalQText);
    if (!safetyCheck.passed) {
      finalQText = textHint
        ? `"${textHint}"에 얽힌 정겹고 따뜻했던 시절의 이야기를 나누어 주시겠어요?`
        : "사진 속 소중한 그날에 나누었던 이야기를 편안히 들려주시겠어요?";
    }

    const qid = `q-custom-${Date.now()}`;

    // 사진 첨부 시 사진 판독 맥락을 사용자 첫 응답(Answer) 기록으로 자동 저장
    if (imageFile) {
      await supabaseService.saveAnswer({
        id: `ans-photo-${Date.now()}`,
        user_id: userId,
        question_id: qid,
        question_text: finalQText,
        answer_text: `[첨부 사진 맥락 기록] ${photoContextStr || "옛 앨범 사진 스캔본"}`,
        created_at: new Date().toISOString(),
        event_date: new Date().toISOString().substring(0, 10),
        is_private: false,
        by_guardian: creatorRole === "guardian",
      });
    }

    // Save to Database (questions_history)
    const newQHistory: DBQuestionHistory = {
      id: qid,
      user_id: userId,
      question_text: finalQText,
      created_at: new Date().toISOString(),
      status: imageFile ? "answered" : "pending",
      shared: generated.shared,
      memory_zone: "sharedIndependentMemory",
      created_by: creatorRole,
    };

    await supabaseService.saveQuestionHistory(newQHistory);

    return NextResponse.json({
      success: true,
      qid,
      qtext: finalQText,
      shared: generated.shared,
      creatorRole,
      photoContextRecorded: Boolean(imageFile),
    });
  } catch (err: any) {
    console.error("API /api/questions/custom error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
