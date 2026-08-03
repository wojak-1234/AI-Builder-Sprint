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
  PROPOSED_QUESTIONS: "eeum_mock_proposed_questions",
  NARRATIVES: "eeum_mock_narratives",
  DAILY_DIARIES: "eeum_mock_daily_diaries",
  CURRENT_USER: "eeum_mock_curr_user",
};

const DEMO_DATE_OFFSET_KEY = "eeum_demo_date_offset";

export const getVirtualDateOffset = (): number => {
  return getLocalStorageItem<number>(DEMO_DATE_OFFSET_KEY, 0);
};

export const setVirtualDateOffset = (days: number): void => {
  setLocalStorageItem(DEMO_DATE_OFFSET_KEY, days);
};

export const skipOneDay = (): number => {
  const curr = getVirtualDateOffset();
  const next = curr + 1;
  setVirtualDateOffset(next);
  return next;
};

export const resetVirtualDate = (): void => {
  setVirtualDateOffset(0);
};

export const getVirtualTodayString = (): string => {
  const offset = getVirtualDateOffset();
  const d = new Date(Date.now() + offset * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
        question_text: "학창 시절이나 유년 시절 가장 기억에 남는 정겨운 추억이나 장소는 어디인가요?",
        created_at: new Date().toISOString(),
        status: "pending",
        shared: true,
      }
    ];
    setLocalStorageItem(MOCK_KEYS.QUESTIONS, initialQuestions);
  }

  if (!getLocalStorageItem(MOCK_KEYS.ANSWERS, null)) {
    setLocalStorageItem(MOCK_KEYS.ANSWERS, []);
  }

  if (!getLocalStorageItem(MOCK_KEYS.NARRATIVES, null)) {
    setLocalStorageItem(MOCK_KEYS.NARRATIVES, []);
  }

  if (!getLocalStorageItem(MOCK_KEYS.DAILY_DIARIES, null)) {
    setLocalStorageItem(MOCK_KEYS.DAILY_DIARIES, []);
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
          if (data) {
            const row = data as any;
            return {
              ...row,
              userCode: row.user_code,
              textSize: row.text_size,
              colorVision: row.color_vision,
              questionFrequency: row.question_frequency,
              appPurpose: row.app_purpose
            } as DBUser;
          }
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
        const dbPayload = {
          ...user,
          user_code: user.userCode,
          text_size: user.textSize,
          color_vision: user.colorVision,
          question_frequency: user.questionFrequency,
          app_purpose: user.appPurpose
        };
        delete dbPayload.userCode;
        delete dbPayload.textSize;
        delete dbPayload.colorVision;
        delete dbPayload.questionFrequency;
        delete dbPayload.appPurpose;
        await client.from("users").upsert(dbPayload);
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
      const filtered = q.filter((x) => x.user_id === userId || x.user_id === "user-elderly-123" || x.shared);
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    const client = getSupabaseClient()!;
    // Scoped strictly to this elder's own row — every question is written with
    // user_id = the elder's id regardless of who authored it, so this is already
    // correct for both self and paired-guardian callers (they both resolve to the
    // same elderlyId before calling). Do NOT OR in a hardcoded id or a bare
    // shared.eq.true here — that previously leaked every family's shared questions
    // (and one specific demo user's data) to every caller.
    const { data } = await client
      .from("questions_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as DBQuestionHistory[]) || [];
  },

  addQuestion: async (question: DBQuestionHistory): Promise<void> => {
    const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
    const existingIdx = questions.findIndex(
      (q) => q.id === question.id || (q.question_text && question.question_text && q.question_text.trim() === question.question_text.trim())
    );

    if (existingIdx !== -1) {
      questions[existingIdx] = { ...questions[existingIdx], status: question.status };
      setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
    } else {
      questions.unshift(question);
      setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
    }

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        await client.from("questions_history").upsert(question);
      } catch (err) {
        console.warn("Supabase addQuestion warning:", err);
      }
    }
  },

  getQuestionById: async (questionId: string): Promise<DBQuestionHistory | null> => {
    if (!questionId) return null;
    if (isMockMode()) {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      const proposed = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);
      return questions.find((q) => q.id === questionId) || proposed.find((q) => q.id === questionId) || null;
    }
    try {
      const client = getSupabaseClient()!;
      const { data } = await client
        .from("questions_history")
        .select("*")
        .eq("id", questionId)
        .single();
      if (data) return data as DBQuestionHistory;

      const { data: proposedData } = await client
        .from("custom_proposed_questions")
        .select("*")
        .eq("id", questionId)
        .single();
      return (proposedData as DBQuestionHistory) || null;
    } catch {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      const proposed = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);
      return questions.find((q) => q.id === questionId) || proposed.find((q) => q.id === questionId) || null;
    }
  },

  updateQuestionStatus: async (questionId: string, status: "pending" | "answered", questionText?: string): Promise<void> => {
    // 1. Update Local/In-Memory questions
    const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
    let updatedQ = false;
    questions.forEach((q) => {
      if (q.id === questionId || (questionText && q.question_text.trim() === questionText.trim())) {
        q.status = status;
        updatedQ = true;
      }
    });
    if (updatedQ) setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);

    // 2. Update Local/In-Memory proposed questions
    const proposed = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);
    let updatedP = false;
    proposed.forEach((q) => {
      if (q.id === questionId || (questionText && q.question_text.trim() === questionText.trim())) {
        q.status = status;
        updatedP = true;
      }
    });
    if (updatedP) setLocalStorageItem(MOCK_KEYS.PROPOSED_QUESTIONS, proposed);

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        await client.from("questions_history").update({ status }).eq("id", questionId);
        await client.from("custom_proposed_questions").update({ status }).eq("id", questionId);
        if (questionText) {
          await client.from("questions_history").update({ status }).eq("question_text", questionText.trim());
          await client.from("custom_proposed_questions").update({ status }).eq("question_text", questionText.trim());
        }
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

  getCustomProposedQuestions: async (userId: string): Promise<DBQuestionHistory[]> => {
    const localProposed = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);

    if (isMockMode()) {
      const uniqueMap = new Map<string, DBQuestionHistory>();
      localProposed.forEach((q) => {
        if (q.user_id === userId || q.user_id === "user-elderly-123" || q.shared) {
          uniqueMap.set(q.id, q);
        }
      });
      return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const client = getSupabaseClient()!;
    const uniqueMap = new Map<string, DBQuestionHistory>();

    // 1. Primary Source: custom_proposed_questions table (Highest Priority)
    try {
      const { data, error } = await client
        .from("custom_proposed_questions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        (data as DBQuestionHistory[]).forEach((q) => uniqueMap.set(q.id, q));
      }
    } catch {
      // Fallback
    }

    // 2. Secondary Source: questions_history table (Only add if ID is NOT already in custom_proposed_questions)
    try {
      const { data: qhData } = await client
        .from("questions_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (qhData && qhData.length > 0) {
        const customQh = (qhData as DBQuestionHistory[]).filter((q) => q.id.startsWith("q-custom-") || q.created_by);
        customQh.forEach((q) => {
          if (!uniqueMap.has(q.id)) {
            uniqueMap.set(q.id, q);
          }
        });
      }
    } catch {
      // Fallback
    }

    // 3. Fallback: LocalStorage (Only add if ID is NOT present in DB items)
    localProposed.forEach((q) => {
      if (q.user_id === userId || q.user_id === "user-elderly-123" || q.shared) {
        if (!uniqueMap.has(q.id)) {
          uniqueMap.set(q.id, q);
        }
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  saveCustomProposedQuestion: async (qHistory: DBQuestionHistory): Promise<void> => {
    // Save only to PROPOSED_QUESTIONS (single source of truth).
    const proposed = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);
    const pIdx = proposed.findIndex((q) => q.id === qHistory.id);
    if (pIdx !== -1) {
      proposed[pIdx] = qHistory;
    } else {
      proposed.unshift(qHistory);
    }
    setLocalStorageItem(MOCK_KEYS.PROPOSED_QUESTIONS, proposed);

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        const qhPayload = {
          id: qHistory.id,
          user_id: qHistory.user_id,
          question_text: qHistory.question_text,
          created_at: qHistory.created_at,
          status: qHistory.status || "pending",
          shared: Boolean(qHistory.shared),
          custom_image_url: qHistory.custom_image_url,
        };
        // Update both custom_proposed_questions and questions_history with updated question_text
        await client.from("custom_proposed_questions").upsert(qHistory);
        await client.from("questions_history").upsert(qhPayload);

        // Sync question_text on answers table if existing answers reference this question_id
        if (qHistory.id) {
          await client
            .from("answers")
            .update({ question_text: qHistory.question_text })
            .eq("question_id", qHistory.id);
        }
      } catch (err) {
        console.warn("Supabase custom_proposed_questions save warning:", err);
      }
    }
  },

  updateCustomProposedQuestionStatus: async (questionId: string, status: "pending" | "answered"): Promise<void> => {
    const list = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);
    list.forEach((q) => {
      if (q.id === questionId) {
        q.status = status;
      }
    });
    setLocalStorageItem(MOCK_KEYS.PROPOSED_QUESTIONS, list);

    if (!isMockMode()) {
      try {
        const client = getSupabaseClient()!;
        await client.from("questions_history").update({ status }).eq("id", questionId);
        await client.from("custom_proposed_questions").update({ status }).eq("id", questionId);
      } catch (err) {
        console.warn("Supabase custom_proposed_questions update warning:", err);
      }
    }
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
      return answers.filter((a) => !a.is_private || a.user_id === userId || a.user_id === "user-elderly-123");
    }
    const client = getSupabaseClient()!;
    // Scoped strictly to this elder's own row (see getQuestions above for why this is
    // correct for both self and guardian callers). The previous is_private.eq.false OR
    // clause leaked every non-private answer from every family; that's not this elder's
    // to see.
    const { data } = await client
      .from("answers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as DBAnswer[]) || [];
  },

  saveAnswer: async (answer: DBAnswer): Promise<void> => {
    if (isMockMode()) {
      const answers = getLocalStorageItem<DBAnswer[]>(MOCK_KEYS.ANSWERS, []);
      let idx = answers.findIndex((a) => a.id === answer.id);

      // Deduplication: If ID doesn't match directly, check for existing answer for the same question & role
      if (idx === -1) {
        idx = answers.findIndex(
          (a) =>
            ((a.question_id && answer.question_id && a.question_id !== "q-default" && answer.question_id !== "q-default" && a.question_id === answer.question_id) ||
              (a.question_text && answer.question_text && a.question_text.trim() === answer.question_text.trim())) &&
            Boolean(a.by_guardian) === Boolean(answer.by_guardian)
        );
      }

      if (idx !== -1) {
        answers[idx] = { ...answer, id: answers[idx].id };
      } else {
        answers.push(answer);
      }
      setLocalStorageItem(MOCK_KEYS.ANSWERS, answers);
      return;
    }
    const client = getSupabaseClient()!;

    // Clean payload for Supabase database table schema (answers table)
    const payload: any = {
      id: answer.id,
      user_id: answer.user_id,
      question_id: answer.question_id || `q-${answer.id}`,
      question_text: answer.question_text || "회상 기록",
      answer_text: answer.answer_text,
      created_at: answer.created_at || new Date().toISOString(),
      event_date: answer.event_date || new Date().toISOString().substring(0, 10),
      is_private: Boolean(answer.is_private),
      by_guardian: Boolean(answer.by_guardian),
    };
    if (answer.media_url) payload.media_url = answer.media_url;
    if (answer.voice_url) payload.voice_url = answer.voice_url;

    // Ensure questions_history row exists first to avoid Foreign Key constraint error (code 23503)
    try {
      const questionsList = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      const proposedList = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.PROPOSED_QUESTIONS, []);
      const existingQ =
        questionsList.find((q) => q.id === payload.question_id || (q.question_text && payload.question_text && q.question_text.trim() === payload.question_text.trim())) ||
        proposedList.find((q) => q.id === payload.question_id || (q.question_text && payload.question_text && q.question_text.trim() === payload.question_text.trim()));

      const qhPayload: any = {
        id: payload.question_id,
        user_id: payload.user_id,
        question_text: payload.question_text,
        created_at: payload.created_at,
        status: existingQ ? existingQ.status : (payload.question_id.startsWith("q-custom-") ? "pending" : "answered"),
        shared: true,
      };
      if (answer.memory_zone) qhPayload.memory_zone = answer.memory_zone;

      let { error: qhError } = await client.from("questions_history").upsert(qhPayload);

      // Fallback retry if questions_history lacks optional columns (code PGRST204)
      if (qhError && qhError.code === "PGRST204") {
        console.warn("Supabase questions_history schema missing optional columns (PGRST204). Retrying with core payload...");
        const coreQhPayload = {
          id: payload.question_id,
          user_id: payload.user_id,
          question_text: payload.question_text,
          created_at: payload.created_at,
          status: "answered",
        };
        const retryQh = await client.from("questions_history").upsert(coreQhPayload);
        qhError = retryQh.error;
      }

      if (qhError) {
        console.warn("Supabase questions_history pre-upsert warning:", JSON.stringify(qhError, null, 2));
      }
    } catch (qErr) {
      console.warn("Supabase questions_history pre-upsert catch warning:", qErr);
    }

    let { error } = await client.from("answers").upsert(payload);

    // Fallback retry if Supabase DB table lacks media_url/voice_url columns (code PGRST204)
    if (error && error.code === "PGRST204") {
      console.warn("Supabase answers table schema missing optional columns (PGRST204). Retrying with core payload...");
      const corePayload = {
        id: answer.id,
        user_id: answer.user_id,
        question_id: answer.question_id || `q-${answer.id}`,
        question_text: answer.question_text || "회상 기록",
        answer_text: answer.answer_text,
        created_at: answer.created_at || new Date().toISOString(),
        event_date: answer.event_date || new Date().toISOString().substring(0, 10),
        is_private: Boolean(answer.is_private),
        by_guardian: Boolean(answer.by_guardian),
      };
      const retry = await client.from("answers").upsert(corePayload);
      error = retry.error;
    }

    if (error) {
      console.error("Supabase saveAnswer error:", JSON.stringify(error, null, 2));
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
      mergedAnswers: row.merged_answers,
      chapterTag: row.chapter_tag
    }));
  },

  saveNarrative: async (narrative: DBNarrative): Promise<void> => {
    // Always store in Local/In-Memory fallback store first
    const narratives = getLocalStorageItem<DBNarrative[]>(MOCK_KEYS.NARRATIVES, []);
    let idx = narratives.findIndex((n) => n.id === narrative.id);

    // Deduplication: Match by user_id and event_date year if exact ID isn't found
    if (idx === -1) {
      const targetYear = (narrative.event_date || "1960").substring(0, 4);
      idx = narratives.findIndex(
        (n) => n.user_id === narrative.user_id && (n.event_date || "").substring(0, 4) === targetYear
      );
    }

    if (idx !== -1) {
      narratives[idx] = { ...narrative, id: narratives[idx].id };
    } else {
      narratives.push(narrative);
    }
    setLocalStorageItem(MOCK_KEYS.NARRATIVES, narratives);

    if (isMockMode()) {
      return;
    }

    try {
      const client = getSupabaseClient()!;
      
      const dbPayload = {
        id: narrative.id,
        user_id: narrative.user_id,
        title: narrative.title,
        summary: narrative.summary,
        content: narrative.content,
        event_date: narrative.event_date,
        created_at: narrative.created_at,
        merged_answers: narrative.mergedAnswers,
        chapter_tag: narrative.chapterTag
      };

      let { error } = await client.from("narratives").upsert(dbPayload);

      // Fallback retry if remote Supabase schema is missing merged_answers or chapter_tag (code PGRST204)
      if (error && error.code === "PGRST204") {
        console.warn("Supabase narratives table schema missing optional columns (PGRST204). Retrying with core payload...");
        const corePayload = {
          id: narrative.id,
          user_id: narrative.user_id,
          title: narrative.title,
          summary: narrative.summary,
          content: narrative.content,
          event_date: narrative.event_date,
          created_at: narrative.created_at,
        };
        const retry = await client.from("narratives").upsert(corePayload);
        error = retry.error;
      }

      if (error) {
        console.error("Supabase saveNarrative error:", JSON.stringify(error, null, 2));
      }
    } catch (err) {
      console.warn("Supabase saveNarrative exception (fallback to local memory):", err);
    }
  },

  resetMockData: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_KEYS.USERS);
      localStorage.removeItem(MOCK_KEYS.ANSWERS);
      localStorage.removeItem(MOCK_KEYS.QUESTIONS);
      localStorage.removeItem(MOCK_KEYS.NARRATIVES);
      localStorage.removeItem(MOCK_KEYS.DAILY_DIARIES);
      localStorage.removeItem(MOCK_KEYS.CURRENT_USER);
      seedMockDatabase();
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
    } catch (_err) {
      return filteredLocal;
    }
  },

  getVirtualDateOffset,
  skipOneDay,
  resetVirtualDate,
  getVirtualTodayString,
};
