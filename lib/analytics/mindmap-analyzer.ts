import { DBAnswer, DBNarrative } from "@/services/supabase-service";

export type EntityType =
  | "person"
  | "place"
  | "object"
  | "time_period"
  | "food"
  | "occasion"
  | "activity"
  | "sensory"
  | "animal"
  | "emotion"
  | "event";

export type ExtractedEntity = {
  id?: string;
  type: EntityType;
  value: string;
  sourceAnswerId?: string;
  lastMentionedAt?: string;
};

export type MindmapAnalyzerResult = {
  weakEntities: ExtractedEntity[];
  nodeSizes: Record<string, number>; // 60 ~ 140 px
  suggestedSharedFrequency: number;
  scoredEntities: Array<{
    entity: ExtractedEntity;
    signalScore: number;
  }>;
};

/**
 * Pure calculation module for Knowledge Graph analysis (non-LLM)
 * Calculates signalScore, weakEntities, and nodeSizes based on entity frequency,
 * connectivity, recency, and co-occurrence diversity.
 */
export function analyzeMindmap(
  entities: ExtractedEntity[],
  answers: DBAnswer[],
  _narratives: DBNarrative[]
): MindmapAnalyzerResult {
  const now = Date.now();
  const entityStats = new Map<
    string,
    {
      entity: ExtractedEntity;
      count: number;
      connectedAnswers: Set<string>;
      coOccurringTypes: Set<EntityType>;
      lastTime: number;
    }
  >();

  // Aggregate entity statistics
  entities.forEach((ent) => {
    const key = `${ent.type}:${ent.value}`;
    if (!entityStats.has(key)) {
      entityStats.set(key, {
        entity: ent,
        count: 0,
        connectedAnswers: new Set(),
        coOccurringTypes: new Set(),
        lastTime: ent.lastMentionedAt ? new Date(ent.lastMentionedAt).getTime() : 0,
      });
    }
    const stat = entityStats.get(key)!;
    stat.count += 1;
    if (ent.sourceAnswerId) {
      stat.connectedAnswers.add(ent.sourceAnswerId);
    }
  });

  // Calculate co-occurrence types per answer
  const answerEntityMap = new Map<string, ExtractedEntity[]>();
  entities.forEach((ent) => {
    if (ent.sourceAnswerId) {
      if (!answerEntityMap.has(ent.sourceAnswerId)) {
        answerEntityMap.set(ent.sourceAnswerId, []);
      }
      answerEntityMap.get(ent.sourceAnswerId)!.push(ent);
    }
  });

  answerEntityMap.forEach((entsInAnswer) => {
    const typesInAnswer = new Set<EntityType>(entsInAnswer.map((e) => e.type));
    entsInAnswer.forEach((ent) => {
      const key = `${ent.type}:${ent.value}`;
      const stat = entityStats.get(key);
      if (stat) {
        typesInAnswer.forEach((t) => {
          if (t !== ent.type) stat.coOccurringTypes.add(t);
        });
      }
    });
  });

  // Calculate signalScore and nodeSizes
  const scoredEntities: Array<{ entity: ExtractedEntity; signalScore: number }> = [];
  const nodeSizes: Record<string, number> = {};
  const weakEntities: ExtractedEntity[] = [];

  entityStats.forEach((stat, key) => {
    const frequency = stat.count;
    const degree = stat.connectedAnswers.size;
    const diversity = stat.coOccurringTypes.size;

    // Recency score (days elapsed, normalized)
    const daysElapsed = Math.max(1, (now - stat.lastTime) / (1000 * 60 * 60 * 24));
    const recencyScore = 1 / Math.log2(daysElapsed + 1);

    // High signalScore = isolated/rare or deeply entangled entities worth probing deeper
    // Formula: (degree * 0.4) + (diversity * 0.3) + (recencyScore * 0.2) + (1 / frequency * 0.1)
    const signalScore = parseFloat(
      (degree * 0.4 + diversity * 0.3 + recencyScore * 0.2 + (1 / Math.max(1, frequency)) * 0.1).toFixed(3)
    );

    scoredEntities.push({ entity: stat.entity, signalScore });

    // Node size range: 60px ~ 140px based on degree and frequency
    const calculatedSize = Math.min(140, Math.max(60, 60 + degree * 12 + frequency * 5));
    nodeSizes[key] = calculatedSize;

    // Detect weak entities (low degree or not mentioned recently)
    if (degree <= 1 || daysElapsed > 7) {
      weakEntities.push(stat.entity);
    }
  });

  // Sort by signalScore descending
  scoredEntities.sort((a, b) => b.signalScore - a.signalScore);

  // Calculate suggested shared frequency for caregiver responses (0.1 ~ 0.9)
  const totalAnswers = answers.length;
  const guardianAnswers = answers.filter((a) => a.by_guardian).length;
  const guardianRatio = totalAnswers > 0 ? guardianAnswers / totalAnswers : 0.5;
  const suggestedSharedFrequency = parseFloat(Math.min(0.9, Math.max(0.1, guardianRatio + 0.2)).toFixed(2));

  return {
    weakEntities,
    nodeSizes,
    suggestedSharedFrequency,
    scoredEntities,
  };
}

/**
 * Selects target entities for question generation.
 * By default, picks top signal entities, but with a small controlled probability (e.g. 15%),
 * probabilistically includes a weak/low-connectivity entity (연결도 낮은 엔티티)
 * to encourage exploring forgotten or rare memory nodes.
 */
export function selectTargetEntities(
  scoredEntities: Array<{ entity: ExtractedEntity; signalScore: number }>,
  weakEntities: ExtractedEntity[],
  weakProbability: number = 0.15, // 15% Controlled Low Probability
  forcedRandom: number | null = null
): ExtractedEntity[] {
  if (scoredEntities.length === 0) return [];

  const topEntities = scoredEntities.slice(0, 3).map((s) => s.entity);
  const randomVal = forcedRandom !== null ? forcedRandom : Math.random();

  // If weak/low-connectivity entities exist and random hits within 15% probability
  if (weakEntities.length > 0 && randomVal < weakProbability) {
    const randomIndex = Math.floor((forcedRandom !== null ? forcedRandom : Math.random()) * weakEntities.length);
    const selectedWeakEntity = weakEntities[randomIndex];

    // Ensure selected weak entity is included at the front of target entities
    if (!topEntities.some((e) => e.value === selectedWeakEntity.value)) {
      return [selectedWeakEntity, ...topEntities.slice(0, 2)];
    }
  }

  return topEntities;
}

export type QuestionTypeSelection = {
  pDiaryBased: number;
  selectedKind: "personal_reminiscence" | "recent_diary_recall";
};

/**
 * Calculates mathematical probability P(DiaryBased) based on recent diary frequency, gap days, and signal score.
 * Formula: P(DiaryBased) = Clamp(0.2, 0.8, 0.25 + 0.15 * N_recent - 0.04 * D_gap + 0.1 * S_signal)
 */
export function calculateQuestionSelectionProbability(
  recentDiaries: { created_at: string }[],
  topSignalScore: number = 0.5,
  forcedRandom: number | null = null
): QuestionTypeSelection {
  const now = new Date();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // 1. N_recent: Count diaries created within last 7 days
  const nRecent = recentDiaries.filter((d) => new Date(d.created_at).getTime() >= sevenDaysAgo).length;

  // 2. D_gap: Days elapsed since last diary entry
  let dGap = 7;
  if (recentDiaries.length > 0) {
    const lastDate = new Date(recentDiaries[0].created_at);
    dGap = Math.max(0, Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // 3. Mathematical Probability Calculation
  const rawP = 0.25 + 0.15 * nRecent - 0.04 * dGap + 0.1 * topSignalScore;
  const pDiaryBased = parseFloat(Math.min(0.8, Math.max(0.2, rawP)).toFixed(2));

  // 4. Random or deterministic selector
  const randomVal = forcedRandom !== null ? forcedRandom : Math.random();
  const selectedKind: "personal_reminiscence" | "recent_diary_recall" =
    randomVal < pDiaryBased ? "recent_diary_recall" : "personal_reminiscence";

  return {
    pDiaryBased,
    selectedKind,
  };
}
