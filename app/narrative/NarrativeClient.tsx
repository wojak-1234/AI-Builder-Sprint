"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBAnswer, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { ArrowLeft, BookOpen, Calendar, User, MessageSquare, Tag, Filter, CheckCircle2 } from "lucide-react";

type NarrativeClientProps = {
  initialUser: DBUser | null;
  initialNarratives: any[];
};

// 11 Category Definitions
const CATEGORIES = [
  { id: "all", label: "전체", icon: "✨" },
  { id: "person", label: "인물", icon: "👤" },
  { id: "place", label: "장소", icon: "📍" },
  { id: "time", label: "시간", icon: "⏳" },
  { id: "event", label: "사건", icon: "📜" },
  { id: "food", label: "음식", icon: "🍱" },
  { id: "sensory", label: "감각", icon: "🌸" },
  { id: "animal", label: "동물", icon: "🐕" },
  { id: "object", label: "사물", icon: "📦" },
  { id: "emotion", label: "감정", icon: "💕" },
  { id: "other", label: "기타", icon: "🌿" },
] as const;

type CategoryType = typeof CATEGORIES[number]["id"];

export default function NarrativeClient({
  initialUser,
}: NarrativeClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<DBUser | null>(initialUser);
  const [answers, setAnswers] = useState<DBAnswer[]>([]);
  const [diaries, setDiaries] = useState<DBDailyDiary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [loading, setLoading] = useState(true);

  // Load answers and daily diaries for categorized card display
  const loadData = async () => {
    try {
      setLoading(true);
      const curr = await supabaseService.getCurrentUser();
      setUser(curr);

      const elderlyId =
        curr?.role === "self" ? curr.id : curr?.paired_user_id || "user-elderly-123";

      const [answerList, diaryList] = await Promise.all([
        supabaseService.getAnswers(elderlyId),
        supabaseService.getRecentDailyDiaries(elderlyId),
      ]);

      setAnswers(answerList);
      setDiaries(diaryList);
    } catch (err) {
      console.error("Error loading categorized answer cards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Classify answer/diary items into 11 categories based on text keywords
  const classifyItem = (text: string, questionText: string = ""): CategoryType => {
    const combined = (text + " " + questionText).toLowerCase();
    if (combined.includes("어머니") || combined.includes("아버지") || combined.includes("선생님") || combined.includes("친구") || combined.includes("지영")) return "person";
    if (combined.includes("고향") || combined.includes("학교") || combined.includes("마을") || combined.includes("집") || combined.includes("동네")) return "place";
    if (combined.includes("19") || combined.includes("년") || combined.includes("어릴") || combined.includes("여름") || combined.includes("겨울")) return "time";
    if (combined.includes("입학") || combined.includes("결혼") || combined.includes("소풍") || combined.includes("운동회") || combined.includes("장날")) return "event";
    if (combined.includes("찌개") || combined.includes("밥") || combined.includes("음식") || combined.includes("국") || combined.includes("사탕") || combined.includes("김밥")) return "food";
    if (combined.includes("냄새") || combined.includes("소리") || combined.includes("햇살") || combined.includes("바람") || combined.includes("따뜻")) return "sensory";
    if (combined.includes("바둑") || combined.includes("강아지") || combined.includes("고양이") || combined.includes("새")) return "animal";
    if (combined.includes("편지") || combined.includes("사진") || combined.includes("가방") || combined.includes("자전거") || combined.includes("시계")) return "object";
    if (combined.includes("기쁘") || combined.includes("그립") || combined.includes("슬프") || combined.includes("좋았") || combined.includes("행복")) return "emotion";
    return "other";
  };

  // Filtered Cards
  const allCards = [
    ...answers.map((a) => ({
      id: a.id,
      type: "answer" as const,
      category: classifyItem(a.answer_text, a.question_text),
      title: a.question_text,
      content: a.answer_text,
      photoUrl: undefined as string | undefined,
      date: a.created_at.substring(0, 10),
      byGuardian: a.by_guardian,
    })),
    ...diaries.map((d) => ({
      id: d.id,
      type: "diary" as const,
      category: classifyItem(d.content),
      title: "오늘의 일상 일기",
      content: d.content,
      photoUrl: d.photo_url as string | undefined,
      date: d.event_date || d.created_at.substring(0, 10),
      byGuardian: false,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filteredCards = selectedCategory === "all"
    ? allCards
    : allCards.filter((c) => c.category === selectedCategory);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-6 py-10 relative transition-colors duration-300">
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between mb-8 border-b border-border pb-4">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer text-sm font-serif"
        >
          <ArrowLeft size={16} />
          서랍으로
        </button>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <span className="text-zinc-500 font-serif text-xs block select-none">
            11-카테고리 추억 보관함
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col gap-6">
        {/* Title Section */}
        <div className="text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-serif font-bold mb-2">
            <BookOpen size={13} />
            추억 서화 보관함
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {user?.role === "guardian" ? "어르신의 11-카테고리 추억 카드 뷰어" : "어르신의 소중한 회상 기록 서첩"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-serif">
            인물, 장소, 사건별 카테고리 태그로 정돈된 회상 답변 카드입니다.
          </p>
        </div>

        {/* 11 Category Filter Chips */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 w-max">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === "all"
                ? allCards.length
                : allCards.filter((c) => c.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-102"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Viewer List */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground font-serif text-sm">
            추억 카드를 정성스레 펼치는 중입니다...
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-10 rounded-2xl bg-secondary/50 border border-border text-center flex flex-col items-center gap-2 my-6">
            <Tag size={28} className="text-muted-foreground" />
            <h3 className="text-base font-serif font-bold">해당 카테고리에 보관된 추억 카드가 없습니다.</h3>
            <p className="text-xs text-muted-foreground font-serif">
              어르신과 함께 소소한 일상이나 추억을 채워보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {filteredCards.map((card) => {
              const catDef = CATEGORIES.find((c) => c.id === card.category) || CATEGORIES[10];

              return (
                <div
                  key={card.id}
                  className="p-6 rounded-2xl bg-secondary/70 border border-border hover:border-primary/40 transition-all text-left flex flex-col gap-3 shadow-xs"
                >
                  {/* Card Header: Category & Date */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-serif font-bold text-foreground">
                      <span>{catDef.icon}</span>
                      <span>{catDef.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground">
                      {card.byGuardian && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                          보호자 기록
                        </span>
                      )}
                      <span>{card.date}</span>
                    </div>
                  </div>

                  {/* Question / Title */}
                  <h3 className="text-base sm:text-lg font-serif font-bold text-foreground leading-snug">
                    &ldquo;{card.title}&rdquo;
                  </h3>

                  {/* Photo if exists */}
                  {card.photoUrl && (
                    <div className="rounded-xl overflow-hidden max-h-56 border border-border my-1">
                      <img src={card.photoUrl} alt="Diary attachment" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm font-serif text-foreground/90 leading-relaxed bg-background/60 p-4 rounded-xl border border-border/50 select-text whitespace-pre-wrap">
                    {card.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
