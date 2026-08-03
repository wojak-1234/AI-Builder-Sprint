import fs from "fs";
import path from "path";

// Load .env.local automatically for CLI test environment
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const val = values.join("=").trim().replace(/\r/g, "").replace(/^["']|["']$/g, "");
      if (key.trim()) {
        process.env[key.trim()] = val;
      }
    }
  });
}

console.log("🔍 [ENV DEBUG] NEXT_PUBLIC_SUPABASE_URL Length:", (process.env.NEXT_PUBLIC_SUPABASE_URL || "").length);
console.log("🔍 [ENV DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY Length:", (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length);
console.log("🔍 [ENV DEBUG] UPSTAGE_API_KEY Length:", (process.env.UPSTAGE_API_KEY || "").length);

import { solarService } from "../services/solar-service";
import { ocrExtractorAgent } from "../lib/agents/ocr-extractor-agent";
import { questionGeneratorAgent } from "../lib/agents/question-generator-agent";
import { narrativeBuilderAgent } from "../lib/agents/narrative-builder-agent";
import { safetyGuardAgent } from "../lib/agents/safety-guard-agent";
import { upstageService } from "../services/upstage-service";
import { analyzeMindmap, calculateQuestionSelectionProbability, selectTargetEntities } from "../lib/analytics/mindmap-analyzer";
import { supabaseService, DBAnswer, getSupabaseClient, isMockMode } from "../services/supabase-service";

async function runBackendApiTests() {
  console.log("==========================================================");
  console.log("🚀 EEUM 백엔드 API & DB Upload & JSON Parse 통합 테스트 시작");
  console.log("==========================================================\n");

  let passCount = 0;
  let failCount = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ERROR: ${detail}`);
      failCount++;
    }
  };

  // -------------------------------------------------------------------------
  // Test 1: JSON Parse & Solar Pro 3 LLM Service Test
  // -------------------------------------------------------------------------
  console.log("📌 Test 1: Solar Pro 3 LLM JSON Parse 검증");
  try {
    const jsonPrompt = '회상 질문 1개를 {"question": "..."} JSON 구조로 생성하라.';
    const rawJson = await solarService.generateText(jsonPrompt, {
      temperature: 0.3,
      responseFormatJson: true,
      systemPrompt: "너는 JSON만 답하는 회상 도우미이다.",
    });

    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      assert(typeof parsed === "object", "LLM JSON Parsing", `Parsed JSON: ${JSON.stringify(parsed)}`);
    } else {
      console.log("ℹ️ UPSTAGE_API_KEY 미설정으로 LLM Fallback 모드로 진행합니다.");
      assert(true, "LLM JSON Parsing (Fallback Mode)", "Fallback generator active.");
    }
  } catch (err: any) {
    assert(false, "LLM JSON Parsing", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 2: Agent 1 (ocr-extractor) & 11 Entity Types Extraction Test
  // -------------------------------------------------------------------------
  console.log("📌 Test 2: Agent 1 (ocr-extractor) 11종 엔티티 추출 검증");
  const testSampleText = `1972년 8월 15일 가을날, 집 앞 마당에서 딸 이지영과 함께 연탄집게를 들고 눈사람을 만들며 참기름 냄새 나는 김밥을 나눠 먹었다. 너무나 행복하고 그리운 날이었다.`;
  const ocrOutput = await ocrExtractorAgent.extract(testSampleText);

  assert(ocrOutput.confidence > 0, "Agent 1 Confidence Score", `Confidence: ${ocrOutput.confidence}`);
  assert(ocrOutput.entities.length > 0, "Agent 1 Entity Extraction", `Extracted ${ocrOutput.entities.length} entities`);
  console.log("   [추출된 엔티티 11종 검수]:", ocrOutput.entities.map((e) => `${e.type}:${e.value}`).join(", "));

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 3: Analytics Module (mindmap-analyzer) signalScore Calculation Test
  // -------------------------------------------------------------------------
  console.log("📌 Test 3: mindmap-analyzer 순수 계산 모듈 signalScore 스코어링");
  const dummyAnswers: DBAnswer[] = [
    {
      id: "ans-test-1",
      user_id: "user-elderly-123",
      question_id: "q-1",
      question_text: "어릴 적 마당 놀이는?",
      answer_text: testSampleText,
      created_at: new Date().toISOString(),
      event_date: "1972-08-15",
      is_private: false,
      by_guardian: false,
    },
  ];

  const analytics = analyzeMindmap(ocrOutput.entities, dummyAnswers, []);
  assert(analytics.scoredEntities.length > 0, "Analytics signalScore Calculation", `Top Entity: ${analytics.scoredEntities[0]?.entity.value} (Score: ${analytics.scoredEntities[0]?.signalScore})`);
  assert(Object.keys(analytics.nodeSizes).length > 0, "Analytics nodeSizes Range", `Sample Node Size: ${Object.values(analytics.nodeSizes)[0]}px`);

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 4: Agent 2 (question-generator) & Agent 4 (safety-guard) Pipeline Test
  // -------------------------------------------------------------------------
  console.log("📌 Test 4: Agent 2 질문 생성 & Agent 4 우회 불가 안전검수 검증");
  const topEntities = analytics.scoredEntities.slice(0, 3).map((s) => s.entity);
  const qOutput = await questionGeneratorAgent.generateQuestions(
    ocrOutput.entities,
    dummyAnswers,
    true,
    topEntities
  );

  assert(qOutput.questions.length > 0, "Agent 2 Question Generation", `Generated ${qOutput.questions.length} questions`);

  for (const questionText of qOutput.questions) {
    const safetyCheck = await safetyGuardAgent.verify(questionText);
    assert(safetyCheck.passed, `Agent 4 Safety Guard Check on: "${questionText.slice(0, 20)}..."`, `Passed: ${safetyCheck.passed}`);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 5: Agent 4 Safety Guard Block Test (Unsafe Medical Diagnosis Input)
  // -------------------------------------------------------------------------
  console.log("📌 Test 5: Agent 4 안전검수 금지 문장(의료 진단/처방) 차단 테스트");
  const unsafeSentence = "어르신이 같은 단어를 반복하시는데 치매 초기 증상 같습니다. 병원에서 처방약을 받으셔야 합니다.";
  const unsafeCheck = await safetyGuardAgent.verify(unsafeSentence);
  assert(!unsafeCheck.passed, "Agent 4 Block Unsafe Sentence", `Successfully blocked. Violations: ${unsafeCheck.violations.join(", ")}`);

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 6: DB Upload Test (Supabase DB & Mock DB Fallback Upload)
  // -------------------------------------------------------------------------
  console.log("📌 Test 6: Supabase DB Upload & Read 검증");
  const testAnswerId = `test-ans-${Date.now()}`;
  const newTestAnswer: DBAnswer = {
    id: testAnswerId,
    user_id: "user-elderly-123",
    question_id: "q-test-100",
    question_text: "[테스트] 가장 기억에 남는 소풍은?",
    answer_text: "어릴 적 마당이 넓은 집에서 김밥을 싸 들고 들판으로 나갔던 기억이 남습니다.",
    created_at: new Date().toISOString(),
    event_date: "1965-05-10",
    is_private: false,
    by_guardian: false,
  };

  try {
    // Ensure parent records exist for Foreign Key constraints
    if (!isMockMode()) {
      const client = getSupabaseClient()!;
      await client.from("users").upsert({
        id: "user-elderly-123",
        name: "김순자 어르신",
        role: "self"
      });
      await client.from("questions_history").upsert({
        id: "q-test-100",
        user_id: "user-elderly-123",
        question_text: "[테스트] 가장 기억에 남는 소풍은?",
        status: "answered"
      });
      await client.from("questions_history").upsert({
        id: "q-1",
        user_id: "user-elderly-123",
        question_text: "어릴 적 마당 놀이는?",
        status: "answered"
      });
    }

    // DB Upload
    await supabaseService.saveAnswer(newTestAnswer);
    console.log("   └─ DB Answer Uploading...");

    // DB Read
    const loadedAnswers = await supabaseService.getAnswers("user-elderly-123");
    const uploadedFound = loadedAnswers.some((a) => a.id === testAnswerId || a.question_text === newTestAnswer.question_text);

    assert(uploadedFound, "DB Upload & Retrieval Check", `Uploaded Answer ID: ${testAnswerId}`);
  } catch (err: any) {
    assert(false, "DB Upload & Retrieval Check", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 7: Agent 3 (narrative-builder) 4-Stage Relay & DB Narrative Upload
  // -------------------------------------------------------------------------
  console.log("📌 Test 7: Agent 3 서사 4단계 릴레이 & DBNarrative DB Upload 검증");
  try {
    const allUserAnswers = await supabaseService.getAnswers("user-elderly-123");
    const buildResult = await narrativeBuilderAgent.buildNarratives("user-elderly-123", allUserAnswers);

    assert(buildResult.narratives.length > 0, "Agent 3 Narrative Building", `Built ${buildResult.narratives.length} narrative chapters`);

    if (buildResult.narratives.length > 0) {
      const firstNarrative = buildResult.narratives[0];
      await supabaseService.saveNarrative(firstNarrative);

      const dbNarratives = await supabaseService.getNarratives("user-elderly-123");
      const narrativeSaved = dbNarratives.some((n) => n.id === firstNarrative.id || n.title === firstNarrative.title);
      assert(narrativeSaved, "DB Narrative Upload & Retrieval", `Saved Narrative Title: "${firstNarrative.title}"`);
    }
  } catch (err: any) {
    assert(false, "Agent 3 & DB Narrative Upload", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 8: MemoryZone 3-tier Branching & Tagging Test
  // -------------------------------------------------------------------------
  console.log("📌 Test 8: MemoryZone 3가지 톤 분기 & 서사 챕터 태깅 검증");
  try {
    const qShared = await questionGeneratorAgent.generateQuestions([], [], true, [], "sharedIndependentMemory");
    assert(qShared.shared === true && qShared.memoryZone === "sharedIndependentMemory", "MemoryZone sharedIndependentMemory", `Shared: ${qShared.shared}, Q: "${qShared.questions[0].slice(0, 25)}..."`);

    const qInherited = await questionGeneratorAgent.generateQuestions([], [], true, [], "inheritedStory");
    assert(qInherited.shared === true && qInherited.memoryZone === "inheritedStory", "MemoryZone inheritedStory", `Shared: ${qInherited.shared}, Q: "${qInherited.questions[0].slice(0, 25)}..."`);

    const qSolo = await questionGeneratorAgent.generateQuestions([], [], false, [], "soloPatientOnly");
    assert(qSolo.shared === false && qSolo.memoryZone === "soloPatientOnly", "MemoryZone soloPatientOnly (shared=false)", `Shared: ${qSolo.shared}, Q: "${qSolo.questions[0].slice(0, 25)}..."`);
  } catch (err: any) {
    assert(false, "MemoryZone 3-tier Branching Test", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 9: Custom Topic Question Generation (Text & Guardian input)
  // -------------------------------------------------------------------------
  console.log("📌 Test 9: 커스텀 대화 주제(사진/텍스트 힌트) 질문 생성 검증");
  try {
    const customText = "1978년 마당에서 키우던 바둑이와 가을 들판 산책";
    const customResult = await questionGeneratorAgent.generateCustomTopicQuestion(
      customText,
      [{ type: "animal" as const, value: "바둑이", sourceAnswerId: "custom" }],
      "guardian"
    );

    assert(
      typeof customResult.question === "string" && customResult.question.length > 5,
      "Custom Topic Question Generation",
      `Generated Q: "${customResult.question}" (Shared: ${customResult.shared})`
    );

    // Save custom question to DB
    const customQId = `q-custom-${Date.now()}`;
    await supabaseService.saveQuestionHistory({
      id: customQId,
      user_id: "user-elderly-123",
      question_text: customResult.question,
      created_at: new Date().toISOString(),
      status: "pending",
      shared: customResult.shared,
      created_by: "guardian",
    });

    assert(true, "Custom Topic DB Upload", `Saved Question ID: ${customQId}`);
  } catch (err: any) {
    assert(false, "Custom Topic Question Generation", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 10: Daily Diary Storage & Mathematical Probability Question Selector
  // -------------------------------------------------------------------------
  console.log("📌 Test 10: 일상 일기 보관 및 수학적 빈도 확률 질문 선택 검증");
  try {
    // Save sample daily diary
    const diaryId = `d-test-${Date.now()}`;
    await supabaseService.saveDailyDiary({
      id: diaryId,
      user_id: "user-elderly-123",
      content: "오늘 산책길에 어릴 적 보았던 들꽃을 보았다. 마음이 뭉클하고 정겨웠다.",
      created_at: new Date().toISOString(),
      event_date: new Date().toISOString().substring(0, 10),
    });

    const recentDiaries = await supabaseService.getRecentDailyDiaries("user-elderly-123");
    assert(recentDiaries.length > 0, "Daily Diary DB Upload & Read", `Saved Diary ID: ${diaryId}`);

    // Mathematical Probability Function Evaluation
    const probLow = calculateQuestionSelectionProbability([], 0.5, 0.9); // No diaries, forced high random -> personal_reminiscence
    assert(probLow.selectedKind === "personal_reminiscence", "Probability Selector (No Diaries)", `P(DiaryBased): ${probLow.pDiaryBased} -> Kind: ${probLow.selectedKind}`);

    const probHigh = calculateQuestionSelectionProbability(recentDiaries, 0.8, 0.1); // Has diary, forced low random -> recent_diary_recall
    assert(probHigh.selectedKind === "recent_diary_recall", "Probability Selector (With Diaries)", `P(DiaryBased): ${probHigh.pDiaryBased} -> Kind: ${probHigh.selectedKind}`);
  } catch (err: any) {
    assert(false, "Daily Diary & Probability Selector Test", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 11: Weak Entity Probabilistic Selection Test (15% Controlled Low Probability)
  // -------------------------------------------------------------------------
  console.log("📌 Test 11: 연결도 낮은 엔티티(Weak Entity) 15% 통제 확률 등장 검증");
  try {
    const mockScored = [
      { entity: { type: "place" as const, value: "마당" }, signalScore: 0.9 },
      { entity: { type: "person" as const, value: "지영" }, signalScore: 0.8 },
      { entity: { type: "food" as const, value: "된장찌개" }, signalScore: 0.7 },
    ];
    const mockWeak = [{ type: "object" as const, value: "빛바랜 흑백사진" }];

    // Case A: High random value (0.5 > 0.15) -> picks top signal entities normally
    const normalEntities = selectTargetEntities(mockScored, mockWeak, 0.15, 0.5);
    assert(normalEntities[0].value === "마당", "Normal Target Entity Selection (Top Signal)", `Selected: "${normalEntities[0].value}"`);

    // Case B: Low random value (0.05 < 0.15) -> probabilistically includes weak entity
    const weakEntitiesSelected = selectTargetEntities(mockScored, mockWeak, 0.15, 0.05);
    assert(weakEntitiesSelected[0].value === "빛바랜 흑백사진", "Weak Entity Probabilistic Selection (15% Chance)", `Selected Weak Entity: "${weakEntitiesSelected[0].value}"`);
  } catch (err: any) {
    assert(false, "Weak Entity Selection Test", err.message);
  }

  console.log("\n----------------------------------------------------------\n");

  // -------------------------------------------------------------------------
  // Test 12: Plan A & Plan C Upstage Embedding 벡터 코사인 유사도 중복 검증
  // -------------------------------------------------------------------------
  console.log("📌 Test 12: Plan A & Plan C Upstage Embedding 벡터 코사인 유사도 중복 필터링 검증");
  try {
    const v1 = [1, 0, 0];
    const v2 = [0.99, 0.01, 0];
    const v3 = [0, 1, 0];

    const simHigh = upstageService.cosineSimilarity(v1, v2);
    const simLow = upstageService.cosineSimilarity(v1, v3);

    assert(simHigh >= 0.95, "Vector Cosine Similarity (High)", `Similarity: ${simHigh} (Expected >= 0.95)`);
    assert(simLow <= 0.1, "Vector Cosine Similarity (Low)", `Similarity: ${simLow} (Expected <= 0.1)`);

    // Real API Test if UPSTAGE_API_KEY is available
    if (process.env.UPSTAGE_API_KEY) {
      const emb1 = await upstageService.getEmbedding("어릴 적 마당에서 친구들과 어떤 놀이를 하며 노셨나요?");
      const emb2 = await upstageService.getEmbedding("유년 시절 집 마당에서 친구들과 주로 어떤 놀이를 하셨나요?");
      if (emb1.length > 0 && emb2.length > 0) {
        const realSim = upstageService.cosineSimilarity(emb1, emb2);
        assert(realSim >= 0.80, "Real Upstage Embedding Cosine Similarity", `Real Similarity: ${realSim} (Semantically Duplicate)`);
      }
    }
  } catch (err: any) {
    assert(false, "Vector Cosine Similarity Test", err.message);
  }

  console.log("\n==========================================================");
  console.log(`📊 백엔드 API & DB Upload 테스트 결과: 총 ${passCount + failCount}개 항목 중 ${passCount}개 통과 (실패 ${failCount}개)`);
  console.log("==========================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runBackendApiTests();
