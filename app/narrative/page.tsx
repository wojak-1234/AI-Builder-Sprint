"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBNarrative, DBUser } from "@/services/supabase-service";
import { ArrowLeft, BookOpen, Users, Calendar, HelpCircle, Activity } from "lucide-react";

export default function NarrativePage() {
  const router = useRouter();
  const [user, setUser] = useState<DBUser | null>(null);
  const [narratives, setNarratives] = useState<DBNarrative[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<DBNarrative | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const curr = await supabaseService.getCurrentUser();
        setUser(curr);

        const elderlyId = curr?.role === "self" ? curr.id : curr?.paired_user_id || "user-elderly-123";
        const list = await supabaseService.getNarratives(elderlyId);

        const sorted = [...list].sort((a, b) => a.event_date.localeCompare(b.event_date));
        setNarratives(sorted);

        if (sorted.length > 0) {
          setSelectedNarrative(sorted[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300">
        <Activity className="animate-spin text-primary mb-4" size={40} />
        <p className="text-lg font-serif">연대기를 책장에 펼치는 중입니다...</p>
      </div>
    );
  }

  const svgCenter = 200;
  const getRingRadius = (dateStr: string) => {
    const year = parseInt(dateStr.substring(0, 4)) || 1960;
    if (year < 1960) return 150; // 1950s
    if (year < 1970) return 110; // 1960s
    if (year < 1980) return 70;  // 1970s
    return 30;                  // 1980s+
  };

  const getCoordinates = (index: number, dateStr: string) => {
    const radius = getRingRadius(dateStr);
    const angleInRadians = (index * 75 + 45) * (Math.PI / 180);
    const x = svgCenter + radius * Math.cos(angleInRadians);
    const y = svgCenter + radius * Math.sin(angleInRadians);
    return { x, y };
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300">
      {/* Top margins decorative line */}
      <div className="absolute top-0 left-[5%] w-[1px] h-full bg-primary/5 pointer-events-none hidden md:block" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-12 border-b border-border pb-4 z-10">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer text-sm font-serif"
        >
          <ArrowLeft size={16} />
          서랍으로
        </button>
        <div className="flex items-center gap-6">
          <ThemeSwitcher />
          <div className="text-right">
            <span className="text-zinc-500 font-serif font-bold text-xs uppercase tracking-widest block">
              {user?.role === "self" ? "김순자 어르신" : "이지영 보호자"}
            </span>
            <span className="text-xs text-primary font-serif block mt-0.5">기억 나이테 박물첩</span>
          </div>
        </div>
      </header>

      {/* Main Layout - Split grid for wide screen, vertical layout for mobile */}
      <main className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 z-10 items-stretch">

        {/* Left Section: Matte Wood Rings SVG (Concentric Rings) */}
        <section className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-2xl bg-secondary border border-border shadow-sm min-h-[380px] transition-colors duration-300">
          <h2 className="text-xl font-serif font-bold text-primary mb-6 flex items-center gap-2 select-none">
            <BookOpen size={18} />
            기억 나이테 인쇄
          </h2>

          <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
            {/* Legend Labels */}
            <div className="absolute top-0 left-0 flex flex-col gap-1 text-[10px] font-serif font-bold text-zinc-500 select-none">
              <div>• 1950년대 (외경)</div>
              <div>• 1960년대 (중경)</div>
              <div>• 1970년대 (내경)</div>
              <div>• 1980년대 (심지)</div>
            </div>

            <svg viewBox="0 0 400 400" className="w-full h-full select-none">
              {/* Concentric circles (Wood Rings as minimal ink pen lines) */}
              <circle cx="200" cy="200" r="150" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="3 3" />
              <circle cx="200" cy="200" r="110" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="3 3" />
              <circle cx="200" cy="200" r="70" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="3 3" />
              <circle cx="200" cy="200" r="30" fill="none" className="pen-line" strokeWidth="0.8" />

              {/* Center point */}
              <circle cx="200" cy="200" r="4" className="fill-primary" />

              {/* Timber grains cracks */}
              <line x1="200" y1="200" x2="200" y2="50" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />
              <line x1="200" y1="200" x2="350" y2="200" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />
              <line x1="200" y1="200" x2="90" y2="310" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />

              {/* Dynamic narrative nodes */}
              {narratives.map((narr, idx) => {
                const { x, y } = getCoordinates(idx, narr.event_date);
                const isSelected = selectedNarrative?.id === narr.id;

                return (
                  <g key={narr.id} className="cursor-pointer" onClick={() => setSelectedNarrative(narr)}>
                    {/* Ring selector indicator */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="1.2"
                      />
                    )}
                    {/* Inner point */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      className={`transition-all duration-200 ${isSelected ? "fill-primary" : "fill-highlight"}`}
                    />
                    {/* Year tag */}
                    <text
                      x={x + 10}
                      y={y + 4}
                      className="fill-primary font-semibold"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="var(--font-noto-serif-kr)"
                    >
                      {narr.event_date.substring(0, 4)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-zinc-500 text-[11px] font-serif text-center leading-relaxed mt-6 max-w-[240px] select-none">
            * 한 장의 책장에 짚어지는 원 무늬는 부모님이 살아오신 연대를 가리키며, 갈색 점은 회상 기록이 위치한 시점입니다.
          </p>
        </section>

        {/* Right Section: Museum Catalog Detail Layout */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {selectedNarrative ? (
            <div className="flex-1 p-8 rounded-2xl bg-background border border-border shadow-sm flex flex-col justify-between select-text transition-colors duration-300">
              <div className="flex flex-col gap-6 text-left">

                {/* Chapter Meta */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase select-none">
                      보관 기록 제 {narratives.indexOf(selectedNarrative) + 1}장
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1.5 leading-snug">
                      {selectedNarrative.title}
                    </h1>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary text-primary text-xs font-serif font-bold select-none border border-border">
                    <Calendar size={11} />
                    {selectedNarrative.event_date.substring(0, 4)}년경
                  </div>
                </div>

                {/* Chapter Narrative Text */}
                <div className="prose prose-zinc max-w-none">
                  <p className="text-base sm:text-lg leading-loose text-muted-foreground whitespace-pre-line font-sans">
                    {selectedNarrative.content}
                  </p>
                </div>

                {/* Perspective Merging Card Layout */}
                {selectedNarrative.mergedAnswers && selectedNarrative.mergedAnswers.length > 0 && (
                  <div className="mt-8 flex flex-col gap-5 border-t border-border pt-8">
                    <h3 className="text-sm font-serif font-bold text-primary flex items-center gap-1.5 select-none">
                      <Users size={15} />
                      동일 기억의 가족 간 대조지면
                    </h3>

                    {selectedNarrative.mergedAnswers.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-4 p-5 rounded-xl bg-secondary/40 border border-border">
                        {/* Question title */}
                        <div className="flex gap-2 text-xs text-zinc-550 dark:text-zinc-400 font-serif leading-relaxed text-left select-none">
                          <HelpCircle size={14} className="text-highlight shrink-0 mt-0.5" />
                          <span className="font-bold">{item.question}</span>
                        </div>

                        {/* Side by side cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* User card */}
                          {item.userText && (
                            <div className="p-4 rounded bg-background border border-border text-left">
                              <span className="text-[10px] text-primary font-serif font-bold tracking-widest block uppercase select-none">
                                어르신의 기억 구술
                              </span>
                              <p className="text-sm text-muted-foreground mt-2 leading-loose font-sans">
                                &ldquo;{item.userText}&rdquo;
                              </p>
                            </div>
                          )}

                          {item.guardianText && (
                            <div className="p-4 rounded bg-background border border-border text-left">
                              <span className="text-[10px] text-highlight font-serif font-bold tracking-widest block uppercase select-none">
                                자녀의 청취 기억
                              </span>
                              <p className="text-sm text-muted-foreground mt-2 leading-loose font-sans">
                                &ldquo;{item.guardianText}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Facts Tagging (no right/wrong judgment) */}
                        {item.differences && item.differences.length > 0 && (
                          <div className="mt-2 border-t border-border pt-3 text-xs text-zinc-550 dark:text-zinc-400 leading-loose">
                            <span className="font-serif font-bold text-zinc-600 dark:text-zinc-350 block mb-1 select-none">기억 기록 비교 사료 :</span>
                            <ul className="list-disc list-inside flex flex-col gap-1 text-left font-sans pl-1">
                              {item.differences.map((diff, dIdx) => (
                                <li key={dIdx} className="text-zinc-550 dark:text-zinc-400">{diff}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 rounded-2xl bg-background border border-border text-center flex flex-col items-center justify-center min-h-[380px]">
              <BookOpen size={40} className="text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-muted-foreground font-serif">장적에 꽂힌 첫 이야기가 아직 없습니다.</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-serif">오늘의 회상 서화를 마친 뒤 나이테가 수놓아집니다.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
