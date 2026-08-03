"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBAnswer, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { ExtractedEntity, EntityType } from "@/lib/analytics/mindmap-analyzer";
import { ArrowLeft, BookOpen, Tag, ArrowUpDown, Layers, Hash, ChevronDown, ChevronUp, LayoutGrid, User, Users, MapPin, Clock, CalendarDays, PawPrint, Leaf, Camera } from "lucide-react";

type NarrativeClientProps = {
  initialUser: DBUser | null;
  initialNarratives: any[];
};

// 5 Key Category Definitions (+ All)
const CATEGORIES = [
  { id: "all", label: "전체", icon: LayoutGrid },
  { id: "person", label: "인물", icon: User },
  { id: "place", label: "장소", icon: MapPin },
  { id: "time", label: "시간", icon: Clock },
  { id: "event", label: "행사/계기", icon: CalendarDays },
  { id: "animal", label: "동물", icon: PawPrint },
] as const;

type VisualCategoryType = typeof CATEGORIES[number]["id"];
type CategoryType = VisualCategoryType | "other";
type SortOption = "frequency" | "latest" | "alphabetical";

export default function NarrativeClient({
  initialUser,
}: NarrativeClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<DBUser | null>(initialUser);
  const [answers, setAnswers] = useState<DBAnswer[]>([]);
  const [diaries, setDiaries] = useState<DBDailyDiary[]>([]);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);

  // 3-Column State Management
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("frequency");
  const [loading, setLoading] = useState(true);

  // Mobile Accordion Toggle States (collapsed by default on mobile for fast card viewing)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  // Lightbox state for full-screen image view
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

      // Extract real entity categories using Agent 1 (ocrExtractorAgent)
      const agentEntities = await ocrExtractorAgent.extractFromAnswers(answerList);
      setExtractedEntities(agentEntities);
    } catch (err) {
      console.error("Error loading categorized answer cards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Classify answer/diary items into ALL matching visual categories.
  // If an item contains a time entity (1980s), an event entity (picnic), or a person entity (mother),
  // it gets classified into ALL of those categories so it appears under every relevant tab.
  const classifyCategories = (text: string, questionText: string = "", entities: ExtractedEntity[] = []): CategoryType[] => {
    const combined = (text + " " + questionText).toLowerCase();
    const cats = new Set<CategoryType>();

    // 1. Agent 1 Extracted Entity Matching (Multi-label)
    if (entities && entities.length > 0) {
      entities.forEach((e) => {
        if (e.type === "person") cats.add("person");
        if (e.type === "place") cats.add("place");
        if (e.type === "time_period") cats.add("time");
        if (e.type === "occasion" || e.type === "event" || e.type === "activity") cats.add("event");
        if (e.type === "animal") cats.add("animal");
      });
    }

    // 2. Keyword-based matching (Supplementary)
    if (combined.includes("어머니") || combined.includes("엄마") || combined.includes("아버지") || combined.includes("아빠") || combined.includes("선생님") || combined.includes("친구") || combined.includes("지영") || combined.includes("이모") || combined.includes("삼촌") || combined.includes("할머니") || combined.includes("할아버지") || combined.includes("아들") || combined.includes("딸") || combined.includes("남편") || combined.includes("아내")) {
      cats.add("person");
    }
    if (combined.includes("고향") || combined.includes("학교") || combined.includes("마을") || combined.includes("동네") || combined.includes("부산") || combined.includes("경주") || combined.includes("서울") || combined.includes("마당") || combined.includes("들판") || combined.includes("남한산성") || combined.includes("집")) {
      cats.add("place");
    }
    if (/19[5-9]\d|20[0-2]\d/.test(combined) || combined.includes("년대") || combined.includes("년도") || combined.includes("어릴") || combined.includes("학창") || combined.includes("세월") || combined.includes("여름") || combined.includes("겨울") || combined.includes("아침") || combined.includes("새벽")) {
      cats.add("time");
    }
    if (combined.includes("입학") || combined.includes("결혼") || combined.includes("소풍") || combined.includes("운동회") || combined.includes("장날") || combined.includes("잔치") || combined.includes("돌잔치") || combined.includes("재롱잔치") || combined.includes("명절") || combined.includes("행사") || combined.includes("출근")) {
      cats.add("event");
    }
    if (combined.includes("바둑") || combined.includes("강아지") || combined.includes("고양이") || combined.includes("새") || combined.includes("동물")) {
      cats.add("animal");
    }

    if (cats.size === 0) {
      cats.add("other");
    }

    return Array.from(cats);
  };

  // Category-to-entity-type mapping: tags should match the currently active view category
  const CATEGORY_ENTITY_TYPES: Record<CategoryType, EntityType[]> = {
    all:    ["person","place","time_period","occasion","event","activity","animal","food","object","sensory","emotion"],
    person: ["person"],
    place:  ["place"],
    time:   ["time_period"],
    event:  ["occasion","event","activity"],
    animal: ["animal"],
    other:  ["object","food","sensory","emotion"],
  };

  // Extract detailed sub-tags using Agent 1 entity values, restricted to the active Category view
  const extractTags = (text: string, questionText: string = "", activeCat: CategoryType, entities: ExtractedEntity[] = []): string[] => {
    const combined = (text + " " + questionText).toLowerCase();
    const tags: string[] = [];

    // Include Agent-1 entity values matching the active category
    const allowedTypes = CATEGORY_ENTITY_TYPES[activeCat] ?? CATEGORY_ENTITY_TYPES.all;
    if (entities && entities.length > 0) {
      entities.forEach((ent) => {
        if (allowedTypes.includes(ent.type) && ent.value && !tags.includes(ent.value)) {
          tags.push(ent.value);
        }
      });
    }

    const addIfIncludes = (keyword: string, tagLabel: string, forCategories?: CategoryType[]) => {
      if (forCategories && !forCategories.includes(activeCat)) return;
      if (combined.includes(keyword.toLowerCase()) && !tags.includes(tagLabel)) {
        tags.push(tagLabel);
      }
    };

    // Dynamic decade tag extraction (e.g. 1978 -> 1970년대) — for time or all category
    if (activeCat === "time" || activeCat === "all") {
      const yearMatch = combined.match(/19([5-9]\d)/);
      if (yearMatch) {
        const decade = `19${yearMatch[1][0]}0년대`;
        if (!tags.includes(decade)) {
          tags.push(decade);
        }
      }
    }

    // Person tags
    addIfIncludes("어머니", "어머니", ["person", "all"]);
    addIfIncludes("엄마", "어머니", ["person", "all"]);
    addIfIncludes("아버지", "아버지", ["person", "all"]);
    addIfIncludes("아빠", "아버지", ["person", "all"]);
    addIfIncludes("지영", "지영이", ["person", "all"]);
    addIfIncludes("선생님", "선생님", ["person", "all"]);
    addIfIncludes("친구", "친구들", ["person", "all"]);

    // Place tags
    addIfIncludes("부산", "부산시", ["place", "all"]);
    addIfIncludes("경주", "경주시", ["place", "all"]);
    addIfIncludes("서울", "서울시", ["place", "all"]);
    addIfIncludes("고향", "고향마을", ["place", "all"]);
    addIfIncludes("학교", "모교", ["place", "all"]);
    addIfIncludes("집", "우리집", ["place", "all"]);

    // Time tags
    addIfIncludes("여름", "여름날", ["time", "all"]);
    addIfIncludes("겨울", "겨울철", ["time", "all"]);

    // Event tags
    addIfIncludes("입학", "입학과 졸업", ["event", "all"]);
    addIfIncludes("결혼", "결혼식", ["event", "all"]);
    addIfIncludes("소풍", "봄소풍", ["event", "all"]);
    addIfIncludes("운동회", "운동회", ["event", "all"]);
    addIfIncludes("명절", "명절 모임", ["event", "all"]);

    // Food/sensory
    addIfIncludes("찌개", "된장찌개", ["other", "all"]);
    addIfIncludes("밥", "따뜻한 밥상", ["other", "all"]);
    addIfIncludes("김밥", "소풍 김밥", ["other", "all"]);
    addIfIncludes("냄새", "은은한 향기", ["other", "all"]);
    addIfIncludes("햇살", "따스한 햇살", ["other", "all"]);
    addIfIncludes("편지", "손편지", ["other", "all"]);
    addIfIncludes("사진", "빛바랜 사진", ["other", "all"]);
    addIfIncludes("기쁘", "행복했던 순간", ["other", "all"]);
    addIfIncludes("그립", "아련한 그리움", ["other", "all"]);

    // Animal tags
    addIfIncludes("강아지", "강아지 바둑이", ["animal", "all"]);
    addIfIncludes("고양이", "시골 고양이", ["animal", "all"]);

    if (tags.length === 0) {
      switch (activeCat) {
        case "person": tags.push("가족과 이웃"); break;
        case "place": tags.push("추억의 장소"); break;
        case "time": tags.push("지나온 세월"); break;
        case "event": tags.push("특별한 기억"); break;
        case "animal": tags.push("친근한 동물"); break;
        default: tags.push("소소한 일상"); break;
      }
    }

    return tags;
  };

  // Group answers by question for single container card view in /narrative
  const answerGroupsMap = new Map<string, DBAnswer[]>();
  answers.forEach((a) => {
    const key = (a.question_text || "").trim() || (a.question_id && a.question_id !== "q-default" ? a.question_id : a.id);
    if (!answerGroupsMap.has(key)) {
      answerGroupsMap.set(key, []);
    }
    answerGroupsMap.get(key)!.push(a);
  });

  const groupedAnswerCards = Array.from(answerGroupsMap.values()).map((ansList) => {
    const sorted = [...ansList].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const firstAns = sorted[0];
    const elderlyAns = sorted.find((a) => !a.by_guardian);
    const guardianAns = sorted.find((a) => a.by_guardian);

    const parts: string[] = [];
    if (elderlyAns) parts.push(`[어르신] ${elderlyAns.answer_text}`);
    if (guardianAns) parts.push(`[보호자] ${guardianAns.answer_text}`);
    const combinedContent = parts.join("\n\n") || firstAns.answer_text;

    // Filter Agent-extracted entities associated with this answer group
    const groupAnswerIds = new Set(ansList.map((a) => a.id));
    const cardEntities = extractedEntities.filter((e) => e.sourceAnswerId && groupAnswerIds.has(e.sourceAnswerId));

    const cats = classifyCategories(combinedContent, firstAns.question_text, cardEntities);

    const isShared = firstAns.memory_zone !== "soloPatientOnly" || Boolean(elderlyAns || guardianAns);

    return {
      id: firstAns.id,
      type: "answer" as const,
      categories: cats,
      combinedContent,
      firstAns,
      cardEntities,
      elderlyAnswerText: elderlyAns?.answer_text,
      guardianAnswerText: guardianAns?.answer_text,
      photoUrl: elderlyAns?.media_url || guardianAns?.media_url || undefined as string | undefined,
      date: firstAns.created_at.substring(0, 10),
      byGuardian: firstAns.by_guardian,
      isShared,
      authorLabel: elderlyAns && guardianAns ? "세대 연결 공통 답변" : guardianAns ? "보호자 기록" : "어르신 기록",
      authorIcon: elderlyAns && guardianAns ? Users : User,
    };
  });

  // Build All Normalized Card Data with dynamic tag evaluation based on selectedCategory
  const allRawCards = [
    ...groupedAnswerCards,
    ...diaries.map((d) => {
      const cats = classifyCategories(d.content);
      return {
        id: d.id,
        type: "diary" as const,
        categories: cats,
        combinedContent: d.content,
        firstAns: { question_text: "오늘의 일상 일기" },
        cardEntities: [] as ExtractedEntity[],
        elderlyAnswerText: d.content,
        guardianAnswerText: undefined as string | undefined,
        photoUrl: d.photo_url as string | undefined,
        date: d.event_date || d.created_at.substring(0, 10),
        byGuardian: false,
        isShared: false,
        authorLabel: "어르신(본인) 직접 일기",
        authorIcon: User,
      };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Category Filtered Subset: cards belong if selectedCategory === 'all' OR c.categories includes selectedCategory
  const categoryFilteredRawCards = selectedCategory === "all"
    ? allRawCards
    : allRawCards.filter((c) => c.categories.includes(selectedCategory));

  // Dynamically compute tags & normalized card structure for the current category view
  const categoryCards = categoryFilteredRawCards.map((c) => {
    const tags = extractTags(c.combinedContent, c.firstAns.question_text, selectedCategory, c.cardEntities);
    if (c.isShared && !tags.includes("공통 질문")) {
      tags.unshift("공통 질문");
    }
    return {
      ...c,
      category: selectedCategory,
      tags,
      title: c.firstAns.question_text,
      content: c.combinedContent,
    };
  });

  // Calculate 2nd Column Tag Statistics & Frequencies
  type TagStat = {
    tag: string;
    count: number;
    latestDate: string;
  };

  const tagStatMap = new Map<string, TagStat>();
  categoryCards.forEach((card) => {
    card.tags.forEach((t) => {
      const existing = tagStatMap.get(t);
      if (existing) {
        existing.count += 1;
        if (card.date > existing.latestDate) {
          existing.latestDate = card.date;
        }
      } else {
        tagStatMap.set(t, {
          tag: t,
          count: 1,
          latestDate: card.date,
        });
      }
    });
  });

  // Sort Tag List based on sortOption
  const tagList = Array.from(tagStatMap.values()).sort((a, b) => {
    if (sortOption === "frequency") {
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag, "ko");
    } else if (sortOption === "latest") {
      if (b.latestDate !== a.latestDate) return b.latestDate.localeCompare(a.latestDate);
      return b.count - a.count;
    } else {
      return a.tag.localeCompare(b.tag, "ko");
    }
  });

  // Column 3 Final Filtered Cards (Category + Tag filter)
  const finalCards = selectedTag
    ? categoryCards.filter((c) => c.tags.includes(selectedTag))
    : categoryCards;

  const currentCategoryDef = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-4 sm:px-8 py-8 relative transition-colors duration-300">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between mb-6 border-b border-border pb-4">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm font-serif"
        >
          <ArrowLeft size={16} />
          서랍으로
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/album")}
            className="flex items-center gap-1.5 text-xs font-serif font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <Camera size={13} />
            추억 사진첩 보기
          </button>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Title Header Banner */}
      <div className="w-full max-w-7xl mx-auto mb-6 text-left">
        <div className="stamp-badge mb-2">
          <BookOpen size={13} className="text-primary" />
          <span>3단 서화 분류 체계</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-foreground tracking-tight">
          {user?.role === "guardian" ? "어르신의 3단 카테고리 추억 보관함" : "소중한 회상 서첩 (3단 컬럼)"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-serif leading-relaxed">
          카테고리 → 태그 → 추억 카드 순서로 정돈된 3단 회상 서첩입니다.
        </p>
      </div>

      {/* Main 3-Column Desktop Layout */}
      <main className="w-full max-w-7xl mx-auto flex-1 flex flex-col md:flex-row gap-6 items-start pb-12">
        
        {/* ================= COLUMN 1: Category Sidebar (w-52) ================= */}
        <aside className="w-full md:w-56 shrink-0 bg-secondary/40 rounded-3xl border border-border/80 p-4 flex flex-col gap-2.5 shadow-2xs">
          <div 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="flex items-center justify-between border-b border-border/50 pb-2 cursor-pointer md:cursor-default select-none"
          >
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-primary" />
              <h2 className="text-xs font-serif font-bold text-foreground">1열 · 카테고리 ({CATEGORIES.length})</h2>
            </div>

            {/* Mobile Toggle Button */}
            <div className="flex items-center gap-1 md:hidden">
              <span className="text-[11px] font-serif font-bold text-primary px-2 py-0.5 rounded-lg bg-primary/10 inline-flex items-center gap-1">
                <currentCategoryDef.icon size={11} />
                {currentCategoryDef.label}
              </span>
              {isCategoryOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </div>
          </div>

          <div className={`${isCategoryOpen ? "flex" : "hidden md:flex"} flex-col gap-1.5 w-full`}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === "all"
                ? allRawCards.length
                : allRawCards.filter((c) => c.categories.includes(cat.id)).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedTag(null); // Reset sub-tag filter on category change
                    setIsCategoryOpen(false); // Collapse on selection on mobile
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-serif font-bold border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-101"
                      : "bg-background/80 text-foreground border-border/60 hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <cat.icon size={14} />
                    <span>{cat.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ================= COLUMN 2: Sub-sidebar Tag List & Sort (w-64) ================= */}
        <aside className="w-full md:w-64 shrink-0 bg-secondary/30 rounded-3xl border border-border/80 p-4 flex flex-col gap-3.5 shadow-2xs md:min-h-[480px]">
          {/* Column Header & Sort Options Dropdown */}
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div 
              onClick={() => setIsTagOpen(!isTagOpen)}
              className="flex items-center gap-1.5 cursor-pointer md:cursor-default select-none flex-1 pr-2"
            >
              <Hash size={14} className="text-primary shrink-0" />
              <h2 className="text-xs font-serif font-bold text-foreground truncate">
                2열 · {currentCategoryDef.label} 태그 ({tagList.length})
              </h2>

              {/* Mobile Toggle Button */}
              <div className="flex items-center gap-1 md:hidden ml-auto shrink-0">
                <span className="text-[11px] font-serif font-bold text-primary px-1.5 py-0.5 rounded-lg bg-primary/10 truncate max-w-[80px]">
                  {selectedTag ? `#${selectedTag}` : "전체"}
                </span>
                {isTagOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </div>

            {/* Sort Option Selector */}
            <div className="relative flex items-center gap-1 shrink-0">
              <ArrowUpDown size={12} className="text-muted-foreground" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="text-[11px] font-serif font-bold bg-background border border-border/80 rounded-xl px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="frequency">빈도순</option>
                <option value="latest">최신순</option>
                <option value="alphabetical">가나다순</option>
              </select>
            </div>
          </div>

          {/* Tag List */}
          <div className={`${isTagOpen ? "flex" : "hidden md:flex"} flex-col gap-1.5 w-full overflow-y-auto max-h-[600px] pr-1 scrollbar-thin`}>
            {/* Show All Tags Button */}
            <button
              onClick={() => {
                setSelectedTag(null);
                setIsTagOpen(false); // Collapse on selection on mobile
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-serif font-bold border transition-all flex items-center justify-between cursor-pointer ${
                selectedTag === null
                  ? "bg-primary/90 text-primary-foreground border-primary shadow-2xs"
                  : "bg-background/60 text-muted-foreground border-border/60 hover:bg-muted/50"
              }`}
            >
              <span>카테고리 전체 보기</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                selectedTag === null ? "bg-white/20 text-white" : "bg-muted/80 text-muted-foreground"
              }`}>
                {categoryCards.length}
              </span>
            </button>

            {tagList.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-serif">
                등록된 세부 태그가 없습니다.
              </div>
            ) : (
              tagList.map((stat) => {
                const isSelected = selectedTag === stat.tag;

                return (
                  <button
                    key={stat.tag}
                    onClick={() => {
                      setSelectedTag(stat.tag);
                      setIsTagOpen(false); // Collapse on selection on mobile
                    }}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-serif font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                        : "bg-background/90 text-foreground border-border/70 hover:bg-muted/60"
                    }`}
                  >
                    <span className="truncate pr-2"># {stat.tag}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono shrink-0 ${
                      isSelected ? "bg-white/25 text-white" : "bg-primary/10 text-primary dark:text-primary-foreground"
                    }`}>
                      {stat.count}회
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ================= COLUMN 3: Main Cards Viewer Area (flex-1) ================= */}
        <section className="flex-1 min-w-0 w-full flex flex-col gap-4">
          {/* Filter Status Header */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 flex items-center justify-between text-xs font-serif">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground inline-flex items-center gap-1">
                <currentCategoryDef.icon size={13} />
                <span>{currentCategoryDef.label}</span>
              </span>
              {selectedTag && (
                <>
                  <span className="text-muted-foreground">&gt;</span>
                  <span className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary dark:text-primary-foreground font-bold border border-primary/30">
                    #{selectedTag}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">필터링 결과:</span>
              <span className="font-mono font-bold text-primary">{finalCards.length}개</span>
            </div>

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                태그 해제
              </button>
            )}
          </div>

          {/* Cards List Display */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground font-serif text-sm">
              추억 카드를 정성스레 펼치는 중입니다...
            </div>
          ) : finalCards.length === 0 ? (
            <div className="p-12 rounded-3xl bg-secondary/50 border border-border text-center flex flex-col items-center gap-2.5 my-4">
              <Tag size={32} className="text-muted-foreground" />
              <h3 className="text-base font-serif font-bold">선택하신 조건에 해당하는 추억 카드가 없습니다.</h3>
              <p className="text-xs text-muted-foreground font-serif">
                다른 태그나 카테고리를 선택해보세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4.5 w-full">
              {finalCards.map((card) => {
                const catDef = CATEGORIES.find((c) => c.id === card.category) || { id: "other", label: "일상", icon: Leaf };
                const isSharedCard = card.isShared;

                return (
                  <div
                    key={card.id}
                    className={`p-6 sm:p-7 rounded-3xl transition-all text-left flex flex-col gap-3.5 ${
                      isSharedCard
                        ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-secondary border-2 border-amber-500/40 dark:from-amber-950/30 dark:via-amber-900/10 dark:to-secondary dark:border-amber-500/40 shadow-sm ring-1 ring-amber-500/20"
                        : "bg-secondary border border-border/80 hover:border-primary/40 shadow-xs"
                    }`}
                  >
                    {/* Card Header Line 1: Question Kind, Category, Author & Date */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Shared Card Badge */}
                        {isSharedCard && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-serif font-bold border border-amber-500/30">
                            <Users size={11} />
                            공통 질문
                          </span>
                        )}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background border border-border/80 text-xs font-serif font-bold text-foreground shadow-2xs">
                          <catDef.icon size={13} />
                          <span>{catDef.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground shrink-0 ml-auto">
                        {/* Author Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-serif ${
                          card.byGuardian
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                        } inline-flex items-center gap-1`}>
                          <card.authorIcon size={11} />
                          {card.authorLabel}
                        </span>
                        <span className="font-mono">{card.date}</span>
                      </div>
                    </div>

                    {/* Card Header Line 2 (Below): Detail Tags */}
                    {card.tags.filter((t) => t !== "공통 질문").length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap -mt-1">
                        {card.tags
                          .filter((t) => t !== "공통 질문")
                          .map((t) => (
                            <span
                              key={t}
                              onClick={() => setSelectedTag(t)}
                              className="px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 text-[11px] font-serif cursor-pointer transition-colors border border-border/40 font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Question / Title */}
                    <h3 className="text-base sm:text-lg font-serif font-bold text-foreground leading-snug tracking-tight">
                      &ldquo;{card.title}&rdquo;
                    </h3>

                    {/* Photo if exists — click to open full-screen lightbox */}
                    {card.photoUrl && (
                      <div
                        className="rounded-2xl overflow-hidden max-h-60 border border-border my-1 shadow-2xs cursor-zoom-in relative group"
                        onClick={() => setLightboxSrc(card.photoUrl!)}
                        title="클릭하면 전체 화면으로 볼 수 있어요"
                      >
                        <img src={card.photoUrl} alt="Diary attachment" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-serif font-bold bg-black/50 px-3 py-1 rounded-full">전체 보기</span>
                        </div>
                      </div>
                    )}

                    {/* Content: Dual Answer Boxes for Shared / Grouped Questions inside ONE Container */}
                    {card.isShared || card.guardianAnswerText ? (
                      <div className="flex flex-col gap-3 w-full my-1">
                        {/* 어르신의 기억 */}
                        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col gap-1.5 text-left">
                          <span className="text-xs font-serif font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <User size={12} className="text-amber-600 dark:text-amber-400" />
                            어르신(본인)의 기억
                          </span>
                          <p className="text-xs sm:text-sm font-serif text-amber-950 dark:text-amber-100 leading-relaxed italic select-text whitespace-pre-wrap">
                            {card.elderlyAnswerText ? `“${card.elderlyAnswerText}”` : "아직 어르신의 기록이 작성되지 않았습니다."}
                          </p>
                        </div>

                        {/* 보호자의 기억 */}
                        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col gap-1.5 text-left">
                          <span className="text-xs font-serif font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <User size={12} className="text-amber-600 dark:text-amber-400" />
                            보호자(자녀)의 기억
                          </span>
                          <p className="text-xs sm:text-sm font-serif text-amber-950 dark:text-amber-100 leading-relaxed italic select-text whitespace-pre-wrap">
                            {card.guardianAnswerText ? `“${card.guardianAnswerText}”` : "아직 보호자의 기록이 작성되지 않았습니다."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base font-serif text-foreground/95 leading-relaxed bg-background/80 p-4.5 rounded-2xl border border-border/60 select-text whitespace-pre-wrap">
                        {card.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Lightbox: full-screen image overlay */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <img
            src={lightboxSrc}
            alt="전체 화면 추억 사진"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/50 font-serif pointer-events-none">화면을 클릭하면 닫혀요</p>
        </div>
      )}
    </div>
  );
}
