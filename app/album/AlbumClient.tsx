"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBAnswer, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { ArrowLeft, Image as ImageIcon, Calendar, Tag, BookOpen, X, Heart, Sparkles, User, Layers, Filter } from "lucide-react";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { normalizeTimePeriod } from "@/services/upstage-service";

type AlbumItem = {
  id: string;
  type: "ocr" | "diary" | "answer";
  title: string;
  answerText: string;
  imageUrl: string;
  date: string;
  byGuardian: boolean;
  tags: string[];
  memoryZone?: string;
};

// Rich default sample album items for photo gallery demonstration
const SAMPLE_ALBUM_ITEMS: AlbumItem[] = [
  {
    id: "sample-alb-1",
    type: "ocr",
    title: "1972년 마당에서 치른 선우의 첫 돌잔치",
    answerText: "1972년 8월 15일, 무더운 여름날 우리 집 마당에서 친척들과 온 동네 사람들이 모여 선우 돌잔치를 치렀다. 대야에 따뜻한 물을 받아 씻기고 색색의 돌옷을 입혔을 때 온 마당에 웃음소리가 가득했다.",
    imageUrl: "/testdata/ocrtest1.jpg",
    date: "1972-08-15",
    byGuardian: false,
    tags: ["인물:선우", "장소:마당", "행사:돌잔치", "시기:1970년대"],
    memoryZone: "sharedIndependentMemory",
  },
  {
    id: "sample-alb-2",
    type: "ocr",
    title: "1978년 가을, 마당에서 키우던 바둑이와 산책하던 날",
    answerText: "가을 들판에 벼가 노랗게 익어갈 무렵, 집 마당에서 키우던 털이 까만 바둑이가 나를 따라 강가로 뛰어놀던 기억이 난다. 바둑이가 꼬리를 칠 때마다 참 마음이 포근했다.",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop",
    date: "1978-10-04",
    byGuardian: false,
    tags: ["동물:바둑이", "장소:들판", "시기:1970년대", "감정:행복"],
    memoryZone: "soloPatientOnly",
  },
  {
    id: "sample-alb-3",
    type: "answer",
    title: "1982년 봄, 도시락에 분홍 소시지를 싸 가던 소풍날",
    answerText: "보자기 싸서 어깨에 메고 갔던 봄소풍날. 어머니가 특별히 참기름을 듬뿍 바른 분홍 소시지와 달걀지단을 넣어 만든 소풍 김밥 냄새가 온 학교 운동장에 은은하게 펴졌었다.",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
    date: "1982-05-12",
    byGuardian: true,
    tags: ["음식:분홍소시지", "장소:소풍길", "인물:어머니", "행사:봄소풍", "시기:1980년대"],
    memoryZone: "inheritedStory",
  },
  {
    id: "sample-alb-4",
    type: "diary",
    title: "고향 기와집 마당 감나무 아래에서의 햇살",
    answerText: "오늘 마당을 청소하다가 어릴 적 고향 집 감나무 아래에서 언니들과 감을 줏어 먹던 시절이 떠올랐다. 감꽃을 실에 꿰어 목걸이를 만들던 그날의 햇살이 여전히 따뜻하다.",
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop",
    date: "1964-09-20",
    byGuardian: false,
    tags: ["장소:고향기와집", "사물:감나무", "인물:언니들", "감각:따스한햇살", "시기:1960년대"],
    memoryZone: "sharedIndependentMemory",
  },
];

export default function AlbumClient() {
  const router = useRouter();

  const [user, setUser] = useState<DBUser | null>(null);
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [filterType, setFilterType] = useState<"all" | "ocr" | "diary">("all");
  const [selectedItem, setSelectedItem] = useState<AlbumItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlbumData() {
      try {
        setLoading(true);
        const currUser = await supabaseService.getCurrentUser();
        setUser(currUser);

        const elderlyId =
          currUser?.role === "self"
            ? currUser.id
            : currUser?.paired_user_id || "user-elderly-123";

        const [answers, diaries, customProposed] = await Promise.all([
          supabaseService.getAnswers(elderlyId),
          supabaseService.getRecentDailyDiaries(elderlyId),
          supabaseService.getCustomProposedQuestions(elderlyId),
        ]);

        const fetchedItems: AlbumItem[] = [];

        // Helper to parse AI entities dynamically from user title & description
        const extractAiTags = async (textToParse: string, baseTags: string[]): Promise<string[]> => {
          if (!textToParse.trim()) return baseTags;
          try {
            const res = await ocrExtractorAgent.extract(textToParse);
            const prefixMap: Record<string, string> = {
              person: "인물",
              place: "장소",
              event: "사건",
              occasion: "행사",
              time_period: "시기",
              food: "음식",
              activity: "활동",
              animal: "동물",
              emotion: "감정",
              sensory: "감각",
              object: "사물",
            };

            const dynamicTags = res.entities.map((e) => {
              const prefix = prefixMap[e.type] || "태그";
              const normalizedVal = e.type === "time_period" ? normalizeTimePeriod(e.value) : e.value;
              return `${prefix}:${normalizedVal}`;
            });

            return Array.from(new Set([...baseTags, ...dynamicTags]));
          } catch {
            return baseTags;
          }
        };

        // Add custom proposed questions with photos
        for (const cq of customProposed) {
          if (cq.custom_image_url) {
            const titleAndDesc = `${cq.question_text || ""} ${cq.created_by === "guardian" ? "자녀 대화주제 제안 사진" : "어르신 대화주제 제안 사진"}`;
            const tags = await extractAiTags(titleAndDesc, ["추억사진", cq.created_by === "guardian" ? "자녀제안" : "어르신제안"]);
            fetchedItems.push({
              id: cq.id,
              type: "ocr",
              title: cq.question_text,
              answerText:
                cq.created_by === "guardian"
                  ? "🙋‍♀️ 자녀(보호자)가 제안한 추억 사진 및 대화 주제입니다."
                  : "👴 어르신이 직접 등록하신 추억 사진 및 대화 주제입니다.",
              imageUrl: cq.custom_image_url,
              date: (cq.created_at || new Date().toISOString()).substring(0, 10),
              byGuardian: cq.created_by === "guardian",
              tags,
            });
          }
        }

        // Add real answers with media photos (only if actual media_url exists — no fallback default image)
        for (const a of answers) {
          if (a.media_url) {
            const titleAndAnswer = `${a.question_text || ""} ${a.answer_text || ""}`;
            const tags = await extractAiTags(titleAndAnswer, ["옛사진", a.by_guardian ? "보호자대리" : "본인기록"]);
            fetchedItems.push({
              id: a.id,
              type: "ocr",
              title: a.question_text,
              answerText: a.answer_text,
              imageUrl: a.media_url,
              date: a.created_at.substring(0, 10),
              byGuardian: a.by_guardian,
              tags,
              memoryZone: a.memory_zone,
            });
          }
        }

        // Add real daily diaries with photos
        for (const d of diaries) {
          if (d.photo_url) {
            const titleAndContent = `오늘의 일상 일기 ${d.content || ""}`;
            const tags = await extractAiTags(titleAndContent, ["일상일기", d.mood || "평온함"]);
            fetchedItems.push({
              id: d.id,
              type: "diary",
              title: "오늘의 일상 일기",
              answerText: d.content,
              imageUrl: d.photo_url,
              date: d.event_date || d.created_at.substring(0, 10),
              byGuardian: false,
              tags,
            });
          }
        }

        // Merge fetched real items with rich sample items for complete demonstration
        const combined = [...fetchedItems, ...SAMPLE_ALBUM_ITEMS];
        // Deduplicate by ID
        const uniqueItems = Array.from(
          new Map(combined.map((item) => [item.id, item])).values()
        ).sort((a, b) => b.date.localeCompare(a.date));

        setAlbumItems(uniqueItems);
      } catch (err) {
        console.error("Error loading album data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAlbumData();
  }, []);

  const filteredItems = filterType === "all"
    ? albumItems
    : albumItems.filter((item) => item.type === filterType);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-4 sm:px-8 py-8 relative transition-colors duration-300">
      {/* Page Header */}
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
            onClick={() => router.push("/narrative")}
            className="flex items-center gap-1 text-xs font-serif font-bold text-primary hover:underline cursor-pointer"
          >
            <Layers size={14} />
            3단 보관함 보기
          </button>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Banner */}
      <div className="w-full max-w-7xl mx-auto mb-8 text-left">
        <div className="stamp-badge mb-2">
          <ImageIcon size={13} className="text-primary" />
          <span>빛바랜 추억 갤러리</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-foreground tracking-tight">
          📸 추억 사진첩 (사진별 회상 이야기)
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-serif leading-relaxed">
          사진을 터치하면 그 안에 담긴 이야기가 펼쳐집니다.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="w-full max-w-7xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-serif font-bold transition-all cursor-pointer border ${
              filterType === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-secondary text-foreground border-border/80 hover:bg-muted"
            }`}
          >
            ✨ 전체 사진 ({albumItems.length})
          </button>

          <button
            onClick={() => setFilterType("ocr")}
            className={`px-4 py-2 rounded-2xl text-xs font-serif font-bold transition-all cursor-pointer border ${
              filterType === "ocr"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-secondary text-foreground border-border/80 hover:bg-muted"
            }`}
          >
            📷 옛 앨범 & OCR 사진 ({albumItems.filter((i) => i.type === "ocr").length})
          </button>

          <button
            onClick={() => setFilterType("diary")}
            className={`px-4 py-2 rounded-2xl text-xs font-serif font-bold transition-all cursor-pointer border ${
              filterType === "diary"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-secondary text-foreground border-border/80 hover:bg-muted"
            }`}
          >
            📔 일상 일기 사진 ({albumItems.filter((i) => i.type === "diary").length})
          </button>
        </div>

        <span className="text-xs text-muted-foreground font-serif font-mono">
          총 {filteredItems.length}장의 사진 수집됨
        </span>
      </div>

      {/* Main Photo Gallery Grid */}
      <main className="w-full max-w-7xl mx-auto flex-1 pb-16">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground font-serif text-sm">
            추억 사진첩을 가만히 정돈하고 있습니다...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 rounded-3xl bg-secondary/50 border border-border text-center flex flex-col items-center gap-3">
            <ImageIcon size={36} className="text-muted-foreground" />
            <h3 className="text-base font-serif font-bold">등록된 추억 사진이 없습니다.</h3>
            <p className="text-xs text-muted-foreground font-serif">
              맞춤 주제나 질문 답변 시 사진을 첨부해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group rounded-3xl bg-secondary border border-border/80 hover:border-primary/50 overflow-hidden transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex flex-col"
              >
                {/* Photo Thumbnail Container */}
                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono font-bold">
                      {item.date}
                    </span>
                    {item.byGuardian && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/80 backdrop-blur-xs text-white text-[11px] font-serif font-bold">
                        보호자 대리
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-3 text-left">
                  <div>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      &ldquo;{item.title}&rdquo;
                    </h3>
                    <p className="text-xs text-muted-foreground font-serif line-clamp-3 mt-1.5 leading-relaxed">
                      {item.answerText}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40">
                    {item.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-[10px] font-serif text-muted-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Photo Detail Modal / Lightbox Layer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-background rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Left: Large Photo View */}
            <div className="w-full md:w-1/2 bg-black relative flex items-center justify-center min-h-[260px] md:min-h-[460px]">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className="w-full h-full object-contain max-h-[60vh] md:max-h-full"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 md:hidden p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Right: Associated Story & Answer Details */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between gap-4 text-left overflow-y-auto font-serif">
              <div className="flex flex-col gap-4">
                {/* Header & Date */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                      📅 {selectedItem.date}
                    </span>
                    {selectedItem.byGuardian ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold font-serif border border-amber-500/30">
                        🙋‍♀️ 보호자(자녀) 대리 기록
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-serif border border-emerald-500/30">
                        👴 어르신(본인) 직접 기록
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="hidden md:block p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Question Title */}
                <div>
                  <span className="text-xs text-muted-foreground font-bold block mb-1">연결된 질문 / 제목</span>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    &ldquo;{selectedItem.title}&rdquo;
                  </h2>
                </div>

                {/* Answer / Story Content */}
                <div>
                  <span className="text-xs text-muted-foreground font-bold block mb-1.5">이 사진에 담긴 소중한 회상 수필</span>
                  <div className="p-4 rounded-2xl bg-secondary/60 border border-border/70 text-sm sm:text-base text-foreground/95 leading-relaxed whitespace-pre-wrap">
                    {selectedItem.answerText}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <span className="text-xs text-muted-foreground font-bold block mb-1.5">인물 · 장소 · 사건 엔티티 태그</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedItem.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-xl bg-background border border-border text-xs font-medium text-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-3 border-t border-border/50 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center"
                >
                  확인 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
