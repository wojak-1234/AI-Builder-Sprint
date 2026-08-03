import { solarService } from "@/services/solar-service";
import { DBAnswer, DBNarrative, MergedPerspective } from "@/services/supabase-service";

export type NarrativeBuilderOutput = {
  narratives: DBNarrative[];
  fullNarrativeText: string;
};

export const narrativeBuilderAgent = {
  /**
   * [Agent 3] narrative-builder
   * Executed in 4 separate stages with MemoryZone chapter tagging:
   * 1. Chronological Sorting (Code logic)
   * 2. Clustering (Solar Pro 3, temp 0.3) -> Chapter title
   * 3. Natural Language Reconstruction (Solar Pro 3, temp 0.7) -> Paragraph
   * 4. Merged Perspective & MemoryZone Tagging (Solar Pro 3, temp 0.3)
   */
  buildNarratives: async (
    userId: string,
    answers: DBAnswer[]
  ): Promise<NarrativeBuilderOutput> => {
    if (!answers || answers.length === 0) {
      return { narratives: [], fullNarrativeText: "" };
    }

    // Stage 1: Chronological Sorting by event_date
    const sortedAnswers = [...answers].sort((a, b) =>
      a.event_date.localeCompare(b.event_date)
    );

    // Group answers by event_date year or memoryZone
    const groupedMap = new Map<string, DBAnswer[]>();
    sortedAnswers.forEach((ans) => {
      const yearGroup = ans.event_date.substring(0, 4) || "과거";
      if (!groupedMap.has(yearGroup)) {
        groupedMap.set(yearGroup, []);
      }
      groupedMap.get(yearGroup)!.push(ans);
    });

    const narratives: DBNarrative[] = [];
    let fullNarrativeText = "";

    // Iterate over groups for Stage 2, 3, 4
    for (const [year, groupAnswers] of Array.from(groupedMap.entries())) {
      const groupContentStr = groupAnswers
        .map((a) => `[작성자: ${a.by_guardian ? "보호자" : "본인"}, 메모리영역: ${a.memory_zone || "sharedIndependentMemory"}, 질문: ${a.question_text}] ${a.answer_text}`)
        .join("\n");

      // Stage 2: Clustering (Solar Pro 3, temp 0.3)
      const clusterPrompt = `다음 회상 답변 모음을 1개의 명확한 챕터 제목으로 요약하라.\n답변들:\n${groupContentStr}`;
      const titleText = await solarService.generateText(clusterPrompt, {
        temperature: 0.3,
        systemPrompt: "너는 회상록 편집자이다. 챕터 제목(10자 이내)만 짧게 작성하라.",
      }) || `${year}년의 추억`;

      // Stage 3: Natural Language Reconstruction (Solar Pro 3, temp 0.7)
      const reconPrompt = `다음 답변들을 하나의 따뜻하고 매끄러운 단락 이야기로 재구성하라.\n답변들:\n${groupContentStr}`;
      const reconstructedText = await solarService.generateText(reconPrompt, {
        temperature: 0.7,
        systemPrompt: "어르신의 문체를 존중하여 2~3문장의 따뜻한 수필 형태로 연결하라.",
      }) || groupAnswers.map((a) => a.answer_text).join(" ");

      // Stage 4: Merged Perspective & MemoryZone Tagging
      const dominantZone = groupAnswers[0]?.memory_zone || "sharedIndependentMemory";
      let chapterTag: "shared" | "inherited" | "solo_hidden_gem" = "shared";

      if (dominantZone === "soloPatientOnly") {
        chapterTag = "solo_hidden_gem"; // 자녀분이 모르는 이야기
      } else if (dominantZone === "inheritedStory") {
        chapterTag = "inherited"; // 이야기로 전해들은 기억
      } else {
        chapterTag = "shared"; // 함께 나눈 세대 연결 기억
      }

      const mergedAnswers: MergedPerspective[] = groupAnswers.map((a) => {
        const matchingGuardian = groupAnswers.find(
          (g) => g.question_id === a.question_id && g.by_guardian
        );
        return {
          question: a.question_text,
          userText: a.by_guardian ? undefined : a.answer_text,
          guardianText: a.by_guardian ? a.answer_text : matchingGuardian?.answer_text,
          memoryZone: a.memory_zone,
          differences: matchingGuardian
            ? ["어르신의 원본 기억과 자녀가 기억하는 이야기가 함께 병기되었습니다."]
            : undefined,
        };
      });

      const summaryPrefix =
        chapterTag === "solo_hidden_gem"
          ? "[자녀가 모르는 부모님의 소중한 이야기] "
          : chapterTag === "inherited"
          ? "[전해들은 이야기] "
          : "[함께 나눈 세대 연결 기억] ";

      const summaryText = `${summaryPrefix}${year}년 시점, ${titleText.trim()}에 관한 기록입니다.`;

      const yearId = (groupAnswers[0].event_date || "1960").substring(0, 4);
      const stableId = `n-${userId}-${yearId}`;

      const narrative: DBNarrative = {
        id: stableId,
        user_id: userId,
        title: titleText.trim().replace(/^["']|["']$/g, ""),
        summary: summaryText,
        content: reconstructedText.trim(),
        event_date: groupAnswers[0].event_date || "1960-01-01",
        created_at: new Date().toISOString(),
        mergedAnswers,
        chapterTag,
      };

      narratives.push(narrative);
      fullNarrativeText += `\n\n### ${narrative.title} (${year})\n${narrative.content}`;
    }

    return {
      narratives,
      fullNarrativeText: fullNarrativeText.trim(),
    };
  },
};
