import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type MemoryZone =
  | "sharedIndependentMemory" // 핵심 공통 독립기억 (양쪽 직접경험)
  | "inheritedStory"          // 전해들은 이야기 (자녀 유아기)
  | "soloPatientOnly";        // 부모 단독 인생 (자녀 출생 전)

// Standard types for the database
export type DBUser = {
  id: string;
  role: "self" | "guardian";
  paired_user_id?: string;
  name: string;
  email?: string;
  password?: string;
  dob?: string;          // For Elderly (self)
  phone?: string;        // For Guardian
  userCode?: string;     // Unique connection code for elderly pairing

  // Accessibility
  textSize?: "small" | "medium" | "large" | "xl";
  colorVision?: "default" | "daltonism" | "tritanopia" | "contrast";

  // AI Interaction Settings
  questionFrequency?: "once" | "twice" | "three" | "custom";
  appPurpose?: string;   // For Elderly (self)

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

export type DBDailyDiary = {
  id: string;
  user_id: string;
  content: string;
  photo_url?: string;
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

export type MergedPerspective = {
  question: string;
  userText?: string;
  guardianText?: string;
  differences?: string[];
  memoryZone?: MemoryZone;
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

const getCredentials = () => {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  
  const isValidUrl = (url.startsWith("http://") || url.startsWith("https://")) && !url.includes("your-project-id");
  if (!isValidUrl || !key) {
    return { url: "", key: "" };
  }
  return { url, key };
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getCredentials();
  if (!url || !key) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, key);
  }
  return cachedClient;
};

export const isMockMode = (): boolean => {
  const { url, key } = getCredentials();
  return !url || !key;
};

// Check if we are running in the browser
const isBrowser = typeof window !== "undefined";

// In-Memory/LocalStorage Database helper for Mock Mode
const MOCK_KEYS = {
  USERS: "eeum_mock_users",
  ANSWERS: "eeum_mock_answers",
  QUESTIONS: "eeum_mock_questions",
  NARRATIVES: "eeum_mock_narratives",
  DAILY_DIARIES: "eeum_mock_daily_diaries",
  CURRENT_USER: "eeum_mock_curr_user",
};

// Global in-memory fallback store for Node.js server environments
const memoryStore = new Map<string, any>();

const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (isBrowser) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }
  return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
};

const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (isBrowser) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    memoryStore.set(key, value);
  }
};

// Seed initial data if mock database is empty
const seedMockDatabase = () => {
  if (!getLocalStorageItem(MOCK_KEYS.USERS, null)) {
    const defaultUser: DBUser = {
      id: "user-elderly-123",
      role: "self",
      name: "김순자 어르신",
      email: "soonja@eeum.com",
      dob: "1945-03-10",
      userCode: "UM-709",
      textSize: "large",
      colorVision: "default",
      questionFrequency: "once",
      appPurpose: "Memory Recording",
      created_at: new Date().toISOString(),
    };
    const defaultGuardian: DBUser = {
      id: "user-guardian-456",
      role: "guardian",
      paired_user_id: "user-elderly-123",
      name: "이지영 (자녀)",
      email: "jiyoung@eeum.com",
      phone: "010-1234-5678",
      textSize: "medium",
      colorVision: "default",
      questionFrequency: "once",
      created_at: new Date().toISOString(),
    };
    defaultUser.paired_user_id = "user-guardian-456";

    setLocalStorageItem(MOCK_KEYS.USERS, [defaultUser, defaultGuardian]);
    setLocalStorageItem(MOCK_KEYS.CURRENT_USER, defaultUser);
  }

  if (!getLocalStorageItem(MOCK_KEYS.QUESTIONS, null)) {
    const initialQuestions: DBQuestionHistory[] = [
      {
        id: "q-1",
        user_id: "user-elderly-123",
        question_text: "어릴 적 마당이 있던 집에서 가장 좋아했던 놀이는 무엇이었나요?",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: "answered",
        shared: true,
      },
      {
        id: "q-2",
        user_id: "user-elderly-123",
        question_text: "학창 시절 소풍 가던 날 아침의 설렘이나 준비했던 도시락 반찬이 기억나시나요?",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        status: "answered",
        shared: true,
      },
      {
        id: "q-3",
        user_id: "user-elderly-123",
        question_text: "첫 직장에 첫 출근하던 날, 어떤 옷을 입고 어떤 마음으로 집을 나서셨나요?",
        created_at: new Date().toISOString(),
        status: "pending",
        shared: true,
      }
    ];
    setLocalStorageItem(MOCK_KEYS.QUESTIONS, initialQuestions);
  }

  if (!getLocalStorageItem(MOCK_KEYS.ANSWERS, null)) {
    const initialAnswers: DBAnswer[] = [
      {
        id: "a-1-elderly",
        user_id: "user-elderly-123",
        question_id: "q-1",
        question_text: "어릴 적 마당이 있던 집에서 가장 좋아했던 놀이는 무엇이었나요?",
        answer_text: "우리 집 마당에 감나무가 한 그루 있었는데, 가을만 되면 동네 아이들이 다 몰려와서 감나무 밑에서 술래잡기를 하고 놀았지. 내가 술래를 많이 했는데, 다들 감나무 뒤에 숨어서 찾기가 쉬웠어. 깔깔거리며 웃던 소리가 아직도 생생해.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        event_date: "1955-10-15",
        is_private: false,
        by_guardian: false,
      },
      {
        id: "a-1-guardian",
        user_id: "user-guardian-456",
        question_id: "q-1",
        question_text: "어릴 적 마당이 있던 집에서 가장 좋아했던 놀이는 무엇이었나요?",
        answer_text: "엄마가 어릴 때 마당에 큰 감나무가 있는 한옥에 사셨다고 들었어요. 이모들이랑 삼촌들이랑 감나무 홍시 따 먹으려고 기다리던 추억을 이야기해 주실 때 제일 표정이 밝으셨어요.",
        created_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
        event_date: "1955-10-15",
        is_private: false,
        by_guardian: true,
      },
      {
        id: "a-2-elderly",
        user_id: "user-elderly-123",
        question_id: "q-2",
        question_text: "학창 시절 소풍 가던 날 아침의 설렘이나 준비했던 도시락 반찬이 기억나시나요?",
        answer_text: "소풍 가기 전날 밤은 너무 설레서 잠을 못 잤어. 엄마가 새벽 일찍 일어나셔서 고소한 참기름 냄새를 풍기며 분홍 소시지에 계란 옷 입혀서 도시락을 싸 주셨지. 소풍 가서 친구들이랑 돗자리 깔고 나누어 먹던 그 맛은 평생 못 잊어.",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        event_date: "1964-05-20",
        is_private: false,
        by_guardian: false,
      }
    ];
    setLocalStorageItem(MOCK_KEYS.ANSWERS, initialAnswers);
  }

  if (!getLocalStorageItem(MOCK_KEYS.NARRATIVES, null)) {
    const initialNarratives: DBNarrative[] = [
      {
        id: "n-1",
        user_id: "user-elderly-123",
        title: "감나무 마당의 술래잡기",
        summary: "1950년대 중반, 마당에 서 있던 커다란 감나무 뒤로 숨어 술래잡기 놀이를 하며 동네 아이들과 뛰놀던 시절을 회상합니다.",
        content: "김순자 어르신은 1950년대 가을날, 집 앞마당에 있던 커다란 감나무 주변에서 친구들과 술래잡기를 하며 유년 시절을 보냈습니다. 동네 아이들이 모두 모여 깔깔거리며 웃던 소리가 마당 가득 울려 퍼지곤 했습니다. 자녀 이지영 님 역시 어머니가 어린 시절 마당에 감나무가 있던 기와집에서 살며 친구들과 홍시를 나눠 먹던 추억을 들려주셨던 것을 기억하고 있습니다. 두 사람의 기억 속에 감나무 마당은 따스한 나눔과 천진난만한 웃음이 가득한 장소로 깊이 자리 잡고 있습니다.",
        event_date: "1955-10-15",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "n-2",
        user_id: "user-elderly-123",
        title: "설레던 소풍날 분홍 소시지 김밥",
        summary: "1960년대 학창 시절, 어머니가 새벽부터 풍기시던 고소한 참기름 냄새와 노란 계란 옷을 입힌 분홍 소시지 도시락을 안고 나섰던 소풍길을 추억합니다.",
        content: "1964년 봄, 소풍을 앞둔 여고생 김순자는 전날 밤부터 설레어 쉽게 잠들지 못했습니다. 새벽바람을 가르며 부엌에서 퍼져나오던 참기름의 고소한 향기는 소풍 아침의 신호탄이었습니다. 얇게 채 썬 시금치와 노란 단무지만 단출하게 들어간 김밥이었지만 어머니의 사랑이 깃들어 꿀맛 같았습니다. 계란을 입힌 분홍 소시지가 도시락 한구석을 장식할 때면 말할 수 없는 행복을 느꼈습니다.",
        event_date: "1964-05-20",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      }
    ];
    setLocalStorageItem(MOCK_KEYS.NARRATIVES, initialNarratives);
  }
};

if (isMockMode()) {
  seedMockDatabase();
}

// Database Service Interface
export const supabaseService = {
  getCurrentUser: async (): Promise<DBUser | null> => {
    // 1. Check local/in-memory store first for role toggle persistence
    const storedUser = getLocalStorageItem<DBUser | null>(MOCK_KEYS.CURRENT_USER, null);
    if (storedUser) return storedUser;

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          const { data } = await client.from("users").select("*").eq("id", user.id).single();
          if (data) return data as DBUser;
        }
      } catch (err) {
        console.warn("Supabase auth getUser fallback:", err);
      }
    }
    return null;
  },

  setCurrentUser: async (user: DBUser): Promise<void> => {
    // Always persist to LocalStorage/In-Memory store for fast role toggle
    setLocalStorageItem(MOCK_KEYS.CURRENT_USER, user);
    const users = getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
    if (!users.some((u) => u.id === user.id)) {
      users.push(user);
      setLocalStorageItem(MOCK_KEYS.USERS, users);
    }

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        await client.from("users").upsert(user);
      } catch (err) {
        console.warn("Supabase setCurrentUser fallback warning:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("eeum_user_changed"));
    }
  },

  getAllUsers: async (): Promise<DBUser[]> => {
    if (isMockMode()) {
      return getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
    }
    const client = getSupabaseClient()!;
    const { data } = await client.from("users").select("*");
    return (data as DBUser[]) || [];
  },

  getQuestions: async (userId: string): Promise<DBQuestionHistory[]> => {
    if (isMockMode()) {
      const q = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      return q.filter((x) => x.user_id === userId || x.user_id === "user-elderly-123");
    }
    const client = getSupabaseClient()!;
    const { data } = await client.from("questions_history").select("*").eq("user_id", userId);
    return (data as DBQuestionHistory[]) || [];
  },

  addQuestion: async (question: DBQuestionHistory): Promise<void> => {
    if (isMockMode()) {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      questions.push(question);
      setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
      return;
    }
    const client = getSupabaseClient()!;
    await client.from("questions_history").insert(question);
  },

  getQuestionById: async (questionId: string): Promise<DBQuestionHistory | null> => {
    if (!questionId) return null;
    if (isMockMode()) {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      return questions.find((q) => q.id === questionId) || null;
    }
    try {
      const client = getSupabaseClient()!;
      const { data } = await client
        .from("questions_history")
        .select("*")
        .eq("id", questionId)
        .single();
      return (data as DBQuestionHistory) || null;
    } catch {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      return questions.find((q) => q.id === questionId) || null;
    }
  },

  updateQuestionStatus: async (questionId: string, status: "pending" | "answered"): Promise<void> => {
    // Always update Local/In-Memory fallback store
    const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx !== -1) {
      questions[idx].status = status;
      setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
    }

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        await client.from("questions_history").update({ status }).eq("id", questionId);
      } catch (err) {
        console.warn("Supabase updateQuestionStatus warning:", err);
      }
    }
  },

  saveQuestionHistory: async (qHistory: DBQuestionHistory): Promise<void> => {
    if (isMockMode()) {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      const idx = questions.findIndex((q) => q.id === qHistory.id);
      if (idx !== -1) {
        questions[idx] = qHistory;
      } else {
        questions.unshift(qHistory);
      }
      setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
      return;
    }
    const client = getSupabaseClient()!;
    await client.from("questions_history").upsert(qHistory);
  },

  getAnswers: async (userId: string): Promise<DBAnswer[]> => {
    if (isMockMode()) {
      const answers = getLocalStorageItem<DBAnswer[]>(MOCK_KEYS.ANSWERS, []);
      const users = getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
      const me = users.find((u) => u.id === userId);

      if (me && me.role === "guardian" && me.paired_user_id) {
        return answers.filter(
          (a) => (a.user_id === userId || a.user_id === me.paired_user_id) && !a.is_private
        );
      }
      return answers.filter((a) => a.user_id === userId || a.user_id === "user-elderly-123");
    }
    const client = getSupabaseClient()!;
    const { data } = await client.from("answers").select("*").eq("user_id", userId);
    return (data as DBAnswer[]) || [];
  },

  saveAnswer: async (answer: DBAnswer): Promise<void> => {
    if (isMockMode()) {
      console.log("   [Mock DB] Saving Answer to Local/In-Memory store:", answer.id);
      const answers = getLocalStorageItem<DBAnswer[]>(MOCK_KEYS.ANSWERS, []);
      const idx = answers.findIndex((a) => a.id === answer.id);
      if (idx !== -1) {
        answers[idx] = answer;
      } else {
        answers.push(answer);
      }
      setLocalStorageItem(MOCK_KEYS.ANSWERS, answers);
      return;
    }
    console.log("   [Real Supabase] Saving Answer to Table 'answers':", answer.id);
    const client = getSupabaseClient()!;
    const { error } = await client.from("answers").upsert(answer);
    if (error) {
      console.error("Supabase saveAnswer error:", error);
    }
  },

  getNarratives: async (userId: string): Promise<DBNarrative[]> => {
    if (isMockMode()) {
      const narratives = getLocalStorageItem<DBNarrative[]>(MOCK_KEYS.NARRATIVES, []);
      return narratives.filter((n) => n.user_id === userId || n.user_id === "user-elderly-123");
    }
    const client = getSupabaseClient()!;
    const { data } = await client.from("narratives").select("*").eq("user_id", userId);
    if (!data) return [];
    return data.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      event_date: row.event_date,
      created_at: row.created_at,
      mergedAnswers: row.merged_answers
    }));
  },

  saveNarrative: async (narrative: DBNarrative): Promise<void> => {
    if (isMockMode()) {
      console.log("   [Mock DB] Saving Narrative to Local/In-Memory store:", narrative.id);
      const narratives = getLocalStorageItem<DBNarrative[]>(MOCK_KEYS.NARRATIVES, []);
      const idx = narratives.findIndex((n) => n.id === narrative.id);
      if (idx !== -1) {
        narratives[idx] = narrative;
      } else {
        narratives.push(narrative);
      }
      setLocalStorageItem(MOCK_KEYS.NARRATIVES, narratives);
      return;
    }
    console.log("   [Real Supabase] Saving Narrative to Table 'narratives':", narrative.id);
    const client = getSupabaseClient()!;
    
    const dbPayload = {
      id: narrative.id,
      user_id: narrative.user_id,
      title: narrative.title,
      summary: narrative.summary,
      content: narrative.content,
      event_date: narrative.event_date,
      created_at: narrative.created_at,
      merged_answers: narrative.mergedAnswers
    };

    const { error } = await client.from("narratives").upsert(dbPayload);
    if (error) {
      console.error("Supabase saveNarrative error:", error);
    }
  },

  resetMockData: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_KEYS.USERS);
      localStorage.removeItem(MOCK_KEYS.ANSWERS);
      localStorage.removeItem(MOCK_KEYS.QUESTIONS);
      localStorage.removeItem(MOCK_KEYS.NARRATIVES);
      localStorage.removeItem(MOCK_KEYS.CURRENT_USER);
    }
  },

  addMockGuardianNarrative: async (userId: string): Promise<DBNarrative> => {
    const newNarrative: DBNarrative = {
      id: `n-guardian-${Date.now()}`,
      user_id: userId,
      title: "자녀가 회상한 1978년 가을 소풍 이야기",
      summary: "[세대 연결] 자녀의 추가 회상이 마인드맵에 결합되었습니다.",
      content: "어머니가 싸주셨던 김밥에 참기름 냄새가 솔솔 풍겼던 가을 소풍날이 아직도 눈에 선합니다.",
      event_date: "1978-10-15",
      created_at: new Date().toISOString(),
      chapterTag: "shared",
      mergedAnswers: [
        {
          question: "1978년 가을 소풍날 기억이 떠오르시나요?",
          userText: "마당에서 김밥 싸 들고 들판으로 나갔던 기억이 난단다.",
          guardianText: "엄마가 싸준 김밥 참기름 냄새가 너무 좋았어요!",
          differences: ["서로의 소중한 기억이 동일한 사건 아래 아름답게 연결되었습니다."]
        }
      ]
    };
    await supabaseService.saveNarrative(newNarrative);
    return newNarrative;
  },

  saveDailyDiary: async (diary: DBDailyDiary): Promise<void> => {
    // Always store in Local/In-Memory fallback store first
    const diaries = getLocalStorageItem<DBDailyDiary[]>(MOCK_KEYS.DAILY_DIARIES, []);
    const idx = diaries.findIndex((d) => d.id === diary.id);
    if (idx !== -1) {
      diaries[idx] = diary;
    } else {
      diaries.unshift(diary);
    }
    setLocalStorageItem(MOCK_KEYS.DAILY_DIARIES, diaries);

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        await client.from("daily_diaries").upsert(diary);
      } catch (err) {
        console.warn("Supabase saveDailyDiary warning (falling back to memory):", err);
      }
    }
  },

  getRecentDailyDiaries: async (userId: string): Promise<DBDailyDiary[]> => {
    const localDiaries = getLocalStorageItem<DBDailyDiary[]>(MOCK_KEYS.DAILY_DIARIES, []);
    const filteredLocal = localDiaries.filter((d) => d.user_id === userId || d.user_id === "user-elderly-123");

    if (isMockMode()) {
      return filteredLocal;
    }
    try {
      const client = getSupabaseClient()!;
      const { data, error } = await client
        .from("daily_diaries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !data) return filteredLocal;
      return data as DBDailyDiary[];
    } catch (err) {
      return filteredLocal;
    }
  },
};
