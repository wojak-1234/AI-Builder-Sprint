export type EntityCategory = "person" | "location" | "date" | "event";

export type Entity = {
  name: string;
  category: EntityCategory;
  context: string;
};

export type OcrExtractionResult = {
  entities: Entity[];
  confidence: number;
  text: string;
  lowConfidence: boolean;
};

export type QuestionType = "entity-based" | "curated" | "gap-detection" | "pattern-tracking";

export type Question = {
  text: string;
  type: QuestionType;
  targetEntity?: string;
  shared: boolean;
};

export type DBUser = {
  id: string;
  role: "self" | "guardian";
  paired_user_id?: string;
  name: string;
  created_at: string;
};

export type DBAnswer = {
  id: string;
  user_id: string;
  question_id: string;
  question_text: string;
  answer_text: string;
  media_url?: string;
  voice_url?: string;
  created_at: string;
  event_date: string; // ISO string or YYYY-MM-DD
  is_private: boolean;
  by_guardian: boolean;
};

export type DBNarrative = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  content: string;
  event_date: string;
  created_at: string;
  mergedAnswers?: MergedPerspective[];
};

export type MergedPerspective = {
  question: string;
  userText?: string;
  guardianText?: string;
  differences?: string[];
};

export type SafetyGuardResult = {
  passed: boolean;
  reason?: string;
  fallbackOutput?: string;
};
