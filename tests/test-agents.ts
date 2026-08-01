import { ocrExtractorAgent } from "../lib/agents/ocr-extractor-agent";
import { questionGeneratorAgent } from "../lib/agents/question-generator-agent";
import { safetyGuardAgent } from "../lib/agents/safety-guard-agent";
import { narrativeBuilderAgent } from "../lib/agents/narrative-builder-agent";
import { DBAnswer } from "@/services/supabase-service";

async function runTests() {
  console.log("=== 1. Testing Agent 1: OCR Extractor Agent ===");
  const testOcrText = "1972년 8월 15일 선우 돌잔치를 마당에서 했다. 삼촌이랑 이모가 와서 시끌벅적했다.";
  const ocrResult = await ocrExtractorAgent.extract(testOcrText);
  console.log("OCR Result Text matches input:", ocrResult.text === testOcrText);
  console.log("Extracted Entities count:", ocrResult.entities.length);
  console.log("Entities list:", JSON.stringify(ocrResult.entities, null, 2));

  if (ocrResult.entities.length > 0) {
    console.log("✅ OCR Extractor Agent passed.");
  } else {
    console.error("❌ OCR Extractor Agent failed to extract entities.");
  }

  console.log("\n=== 2. Testing Agent 2: Question Generator Agent ===");
  const generatedResult = await questionGeneratorAgent.generateQuestions(
    ocrResult.entities,
    [],
    true
  );
  console.log("Generated Questions:", JSON.stringify(generatedResult.questions, null, 2));
  const allEndWithQuestionMark = generatedResult.questions.every((q) => q.endsWith("?"));
  console.log("All questions end with '?':", allEndWithQuestionMark);

  if (generatedResult.questions.length > 0 && allEndWithQuestionMark) {
    console.log("✅ Question Generator Agent passed.");
  } else {
    console.error("❌ Question Generator Agent failed.");
  }

  console.log("\n=== 3. Testing Agent 4: Safety Guard Agent ===");
  // Test case A: Safe text
  const safeText = "그때 먹었던 김밥 참 맛있었는데 또 먹고 싶네요.";
  const safetyResultA = await safetyGuardAgent.verify(safeText);
  console.log("Safe text passed:", safetyResultA.passed);

  // Test case B: Unsafe text with medical diagnosis
  const unsafeText = "김순자 어르신은 단어를 많이 반복하시는데 치매 초기 증상인 것 같습니다. 처방약을 드셔야 합니다.";
  const safetyResultB = await safetyGuardAgent.verify(unsafeText);
  console.log("Unsafe text blocked (passed should be false):", safetyResultB.passed === false);
  console.log("Violations:", safetyResultB.violations);

  if (safetyResultA.passed && !safetyResultB.passed) {
    console.log("✅ Safety Guard Agent passed.");
  } else {
    console.error("❌ Safety Guard Agent failed.");
  }

  console.log("\n=== 4. Testing Agent 3: Narrative Builder Agent ===");
  const testAnswers: DBAnswer[] = [
    {
      id: "ans-1",
      user_id: "user-elderly-123",
      question_id: "q-1",
      question_text: "어릴 적 놀이는?",
      answer_text: "마당 감나무 밑에서 술래잡기를 했다.",
      created_at: new Date().toISOString(),
      event_date: "1955-10-15",
      is_private: false,
      by_guardian: false,
    },
  ];

  const narrativeResult = await narrativeBuilderAgent.buildNarratives("user-elderly-123", testAnswers);
  console.log("Narrative count:", narrativeResult.narratives.length);
  console.log("Full text length:", narrativeResult.fullNarrativeText.length);

  if (narrativeResult.narratives.length > 0) {
    console.log("✅ Narrative Builder Agent passed.");
  } else {
    console.error("❌ Narrative Builder Agent failed.");
  }
}

runTests();
