export type EntityCategory = "person" | "location" | "date" | "event";

export type MemoryZone =
  | "sharedIndependentMemory" // 핵심 공통 독립기억 (양쪽 직접경험)
  | "inheritedStory"          // 전해들은 이야기 (자녀 유아기)
  | "soloPatientOnly";        // 부모 단독 인생 (자녀 출생 전)

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
  memoryZone?: MemoryZone;
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
  memory_zone?: MemoryZone;
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
  chapterTag?: "shared" | "inherited" | "solo_hidden_gem";
};

export type MergedPerspective = {
  question: string;
  userText?: string;
  guardianText?: string;
  differences?: string[];
  memoryZone?: MemoryZone;
};

export type DBDailyDiary = {
  id: string;
  user_id: string;
  content: string;
  photo_url?: string;
  mood?: string;
  created_at: string;
  event_date: string;
};

export type DBQuestionHistory = {
  id: string;
  user_id: string;
  question_text: string;
  created_at: string;
  status: "pending" | "answered";
  shared: boolean;
  memory_zone?: MemoryZone;
  created_by?: "self" | "guardian";
  custom_image_url?: string;
  question_kind?: "personal_reminiscence" | "recent_diary_recall";
};
