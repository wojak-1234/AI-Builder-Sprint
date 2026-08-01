import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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
};

export type DBQuestionHistory = {
  id: string;
  user_id: string;
  question_text: string;
  created_at: string;
  status: "pending" | "answered";
  shared: boolean;
};

export type MergedPerspective = {
  question: string;
  userText?: string;
  guardianText?: string;
  differences?: string[];
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

// Check if we are running in the browser and env variables are missing
const isBrowser = typeof window !== "undefined";
const useMock = !supabaseUrl || !supabaseAnonKey;

// Real Supabase Client (only instantiated if env vars are present)
export const supabase = !useMock ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (useMock && isBrowser) {
  console.warn("Supabase credentials missing. Falling back to LocalStorage Mock Database.");
}

// In-Memory/LocalStorage Database helper for Mock Mode
const MOCK_KEYS = {
  USERS: "eeum_mock_users",
  ANSWERS: "eeum_mock_answers",
  QUESTIONS: "eeum_mock_questions",
  NARRATIVES: "eeum_mock_narratives",
  CURRENT_USER: "eeum_mock_curr_user",
};

const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isBrowser) return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (isBrowser) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Seed initial data if mock database is empty
const seedMockDatabase = () => {
  if (!isBrowser) return;

  if (!localStorage.getItem(MOCK_KEYS.USERS)) {
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
    // Pair them back
    defaultUser.paired_user_id = "user-guardian-456";

    setLocalStorageItem(MOCK_KEYS.USERS, [defaultUser, defaultGuardian]);
    setLocalStorageItem(MOCK_KEYS.CURRENT_USER, defaultUser);
  }

  if (!localStorage.getItem(MOCK_KEYS.QUESTIONS)) {
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

  if (!localStorage.getItem(MOCK_KEYS.ANSWERS)) {
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
        answer_text: "어머니가 옛날에 마당 넓은 기와집에 사셨다고 자주 말씀하셨어요. 특히 그 마당에 큰 감나무가 있었는데, 가을에 홍시를 따서 동네 친구들이랑 나눠 먹는 게 낙이었다고 하셨던 기억이 납니다.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        event_date: "1955-10-15",
        is_private: false,
        by_guardian: true,
      },
      {
        id: "a-2-elderly",
        user_id: "user-elderly-123",
        question_id: "q-2",
        question_text: "학창 시절 소풍 가던 날 아침의 설렘이나 준비했던 도시락 반찬이 기억나시나요?",
        answer_text: "소풍날 아침엔 새벽같이 눈이 떠졌지. 어머니가 부엌에서 솔솔 참기름 냄새 풍기며 김밥을 말아주시던 게 최고였어. 요즘 김밥이랑 다르게 단무지랑 시금치만 들었어도 꿀맛이었단다. 분홍 소시지도 한 장 구워 얹어주시면 온 세상을 얻은 것 같았어.",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        event_date: "1964-05-20",
        is_private: false,
        by_guardian: false,
      }
    ];
    setLocalStorageItem(MOCK_KEYS.ANSWERS, initialAnswers);
  }

  if (!localStorage.getItem(MOCK_KEYS.NARRATIVES)) {
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

// Run mock seeding on browser load
if (useMock) {
  seedMockDatabase();
}

// Database Service Interface
export const supabaseService = {
  getCurrentUser: async (): Promise<DBUser | null> => {
    if (useMock) {
      return getLocalStorageItem<DBUser | null>(MOCK_KEYS.CURRENT_USER, null);
    }
    // Real Supabase integration
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return null;
    const { data } = await supabase!.from("users").select("*").eq("id", user.id).single();
    return data as DBUser;
  },

  setCurrentUser: async (user: DBUser): Promise<void> => {
    if (useMock) {
      setLocalStorageItem(MOCK_KEYS.CURRENT_USER, user);
      const users = getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
      if (!users.some((u) => u.id === user.id)) {
        users.push(user);
        setLocalStorageItem(MOCK_KEYS.USERS, users);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("eeum_user_changed"));
      }
      return;
    }
    await supabase!.from("users").upsert(user);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("eeum_user_changed"));
    }
  },

  getAllUsers: async (): Promise<DBUser[]> => {
    if (useMock) {
      return getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
    }
    const { data } = await supabase!.from("users").select("*");
    return (data as DBUser[]) || [];
  },

  getQuestions: async (userId: string): Promise<DBQuestionHistory[]> => {
    if (useMock) {
      const q = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      return q.filter((x) => x.user_id === userId || x.user_id === "user-elderly-123");
    }
    const { data } = await supabase!.from("questions_history").select("*").eq("user_id", userId);
    return (data as DBQuestionHistory[]) || [];
  },

  addQuestion: async (question: DBQuestionHistory): Promise<void> => {
    if (useMock) {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      questions.push(question);
      setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
      return;
    }
    await supabase!.from("questions_history").insert(question);
  },

  updateQuestionStatus: async (questionId: string, status: "pending" | "answered"): Promise<void> => {
    if (useMock) {
      const questions = getLocalStorageItem<DBQuestionHistory[]>(MOCK_KEYS.QUESTIONS, []);
      const idx = questions.findIndex((q) => q.id === questionId);
      if (idx !== -1) {
        questions[idx].status = status;
        setLocalStorageItem(MOCK_KEYS.QUESTIONS, questions);
      }
      return;
    }
    await supabase!.from("questions_history").update({ status }).eq("id", questionId);
  },

  getAnswers: async (userId: string): Promise<DBAnswer[]> => {
    if (useMock) {
      const answers = getLocalStorageItem<DBAnswer[]>(MOCK_KEYS.ANSWERS, []);
      // If client is guardian, fetch answers of the paired patient + guardian's answers
      const users = getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
      const me = users.find((u) => u.id === userId);
      if (me && me.role === "guardian" && me.paired_user_id) {
        return answers.filter(
          (a) => a.user_id === userId || a.user_id === me.paired_user_id
        );
      }
      if (me && me.role === "self" && me.paired_user_id) {
        // Patient can see paired guardian's answers (unless marked private)
        return answers.filter(
          (a) => a.user_id === userId || (a.user_id === me.paired_user_id && !a.is_private)
        );
      }
      return answers.filter((a) => a.user_id === userId);
    }
    const { data } = await supabase!.from("answers").select("*").eq("user_id", userId);
    return (data as DBAnswer[]) || [];
  },

  saveAnswer: async (answer: DBAnswer): Promise<void> => {
    if (useMock) {
      const answers = getLocalStorageItem<DBAnswer[]>(MOCK_KEYS.ANSWERS, []);
      answers.push(answer);
      setLocalStorageItem(MOCK_KEYS.ANSWERS, answers);
      return;
    }
    await supabase!.from("answers").insert(answer);
  },

  getNarratives: async (userId: string): Promise<DBNarrative[]> => {
    if (useMock) {
      const narratives = getLocalStorageItem<DBNarrative[]>(MOCK_KEYS.NARRATIVES, []);
      // If user is guardian, fetch narratives of their paired user too
      const users = getLocalStorageItem<DBUser[]>(MOCK_KEYS.USERS, []);
      const me = users.find((u) => u.id === userId);
      if (me && me.role === "guardian" && me.paired_user_id) {
        return narratives.filter((n) => n.user_id === me.paired_user_id || n.user_id === userId);
      }
      return narratives.filter((n) => n.user_id === userId);
    }
    const { data } = await supabase!.from("narratives").select("*").eq("user_id", userId);
    return (data as DBNarrative[]) || [];
  },

  saveNarrative: async (narrative: DBNarrative): Promise<void> => {
    if (useMock) {
      const narratives = getLocalStorageItem<DBNarrative[]>(MOCK_KEYS.NARRATIVES, []);
      narratives.push(narrative);
      setLocalStorageItem(MOCK_KEYS.NARRATIVES, narratives);
      return;
    }
    await supabase!.from("narratives").insert(narrative);
  },

  resetMockData: (): void => {
    if (useMock && isBrowser) {
      localStorage.removeItem(MOCK_KEYS.USERS);
      localStorage.removeItem(MOCK_KEYS.QUESTIONS);
      localStorage.removeItem(MOCK_KEYS.ANSWERS);
      localStorage.removeItem(MOCK_KEYS.NARRATIVES);
      localStorage.removeItem(MOCK_KEYS.CURRENT_USER);
      seedMockDatabase();
    }
  }
};
