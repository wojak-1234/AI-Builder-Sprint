"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBNarrative, DBUser } from "@/services/supabase-service";
import {
  ArrowLeft, BookOpen, Users, Calendar, HelpCircle,
  Activity, PlusCircle, X
} from "lucide-react";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";

type NarrativeClientProps = {
  initialUser: DBUser | null;
  initialNarratives: DBNarrative[];
};

export default function NarrativeClient({
  initialUser,
  initialNarratives,
}: NarrativeClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<DBUser | null>(initialUser);
  const [narratives, setNarratives] = useState<DBNarrative[]>(initialNarratives);
  const [selectedNarrative, setSelectedNarrative] = useState<DBNarrative | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("");

  // Load / re-load narratives (called on mount + on realtime event)
  const loadData = async () => {
    try {
      const curr = await supabaseService.getCurrentUser();
      setUser(curr);
      const elderlyId =
        curr?.role === "self" ? curr.id : curr?.paired_user_id || "user-elderly-123";
      const list = await supabaseService.getNarratives(elderlyId);
      const sorted = [...list].sort((a, b) => a.event_date.localeCompare(b.event_date));
      setNarratives(sorted);

      // Keep selection alive if the selected node still exists
      setSelectedNarrative((prev) =>
        prev ? sorted.find((n) => n.id === prev.id) ?? null : null
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      window.addEventListener("eeum_narratives_updated", loadData);
      return () => window.removeEventListener("eeum_narratives_updated", loadData);
    }
  }, []);

  // Real-time collaboration simulator
  const triggerSimulation = async () => {
    if (simulating) return;
    const alreadyExists = narratives.some((n) => n.title === "1982년 겨울의 눈사람");
    if (alreadyExists) {
      setSimulationStatus("이미 자녀 지영 님의 기억 노드가 연결되어 있습니다.");
      setTimeout(() => setSimulationStatus(""), 3000);
      return;
    }

    const elderlyId =
      user?.role === "self" ? user.id : user?.paired_user_id || "user-elderly-123";

    setSimulating(true);
    setSimulationStatus("자녀 지영 님이 기억을 작성하고 있습니다...");
    setTimeout(async () => {
      setSimulationStatus("기억 전송 중 — 마인드맵 노드를 연결합니다.");
      setTimeout(async () => {
        try {
          const added = await supabaseService.addMockGuardianNarrative(elderlyId);
          setSelectedNarrative(added);
        } catch (err) {
          console.error(err);
        } finally {
          setSimulationStatus("");
          setSimulating(false);
        }
      }, 1200);
    }, 2000);
  };

  const alreadySimulated = narratives.some((n) => n.title === "1982년 겨울의 눈사람");

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-background text-foreground">

      {/* ── Full-screen Mind Map Canvas ─────────────────────── */}
      <div className="absolute inset-0">
        <KnowledgeGraph
          narratives={narratives}
          selectedId={selectedNarrative?.id}
          onSelectNarrative={setSelectedNarrative}
        />
      </div>

      {/* ── Floating Glassmorphism Header ───────────────────── */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-4xl rounded-full px-5 py-2.5 flex items-center justify-between backdrop-blur-md bg-white/20 dark:bg-neutral-900/30 border border-white/20 dark:border-white/10 shadow-lg transition-all duration-300">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1.5 text-foreground/70 hover:text-foreground transition-colors cursor-pointer text-sm font-serif"
        >
          <ArrowLeft size={15} />
          서랍으로
        </button>

        <div className="flex items-center gap-2.5">
          {/* Color legend */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-serif text-foreground/60 mr-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4E6F96] inline-block" />어르신
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#7C9A74] inline-block" />자녀
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#60998B] inline-block" />공동
            </span>
          </div>

          <ThemeSwitcher />

          {/* Simulator trigger */}
          {simulating ? (
            <div className="flex items-center gap-1.5 text-[11px] font-serif text-primary animate-pulse px-3 py-1.5">
              <Activity size={12} className="animate-spin" />
              <span className="hidden sm:inline">{simulationStatus}</span>
            </div>
          ) : (
            <button
              onClick={triggerSimulation}
              disabled={alreadySimulated}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 text-[11px] font-serif font-bold cursor-pointer whitespace-nowrap"
            >
              <PlusCircle size={12} />
              <span className="hidden sm:inline">자녀 기억 실시간 추가</span>
              <span className="sm:hidden">+</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Right-side Detail Panel (slide-in) ──────────────── */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-20 flex flex-col bg-background/95 backdrop-blur-lg border-l border-border shadow-2xl overflow-y-auto transition-transform duration-500 ease-out ${
          selectedNarrative ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedNarrative && (
          <>
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 pt-16 pb-4 border-b border-border shrink-0">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase">
                  보관 기록 제 {narratives.indexOf(selectedNarrative) + 1}장
                </span>
                <h2 className="text-xl font-serif font-bold text-foreground mt-1 leading-snug">
                  {selectedNarrative.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-primary text-[11px] font-serif font-bold border border-border">
                  <Calendar size={10} />
                  {selectedNarrative.event_date.substring(0, 4)}년경
                </span>
                <button
                  onClick={() => setSelectedNarrative(null)}
                  className="p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer"
                  aria-label="닫기"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex flex-col gap-6 px-6 py-6">
              {/* Narrative body */}
              <p className="text-sm leading-loose text-muted-foreground whitespace-pre-line font-sans">
                {selectedNarrative.content}
              </p>

              {/* Merged family perspectives */}
              {selectedNarrative.mergedAnswers && selectedNarrative.mergedAnswers.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-border pt-6">
                  <h3 className="text-xs font-serif font-bold text-primary flex items-center gap-1.5">
                    <Users size={13} />
                    가족 간 기억 대조지면
                  </h3>

                  {selectedNarrative.mergedAnswers.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                      {/* Question */}
                      <div className="flex gap-2 text-[11px] text-muted-foreground font-serif leading-relaxed">
                        <HelpCircle size={12} className="text-highlight shrink-0 mt-0.5" />
                        <span className="font-bold">{item.question}</span>
                      </div>

                      {/* Cards */}
                      <div className="flex flex-col gap-2">
                        {item.userText && (
                          <div className="p-3 rounded-lg bg-background border border-border">
                            <span className="text-[9px] text-[#4E6F96] font-serif font-bold tracking-widest uppercase block mb-1">
                              어르신의 기억
                            </span>
                            <p className="text-[12px] text-muted-foreground leading-loose font-sans">
                              &ldquo;{item.userText}&rdquo;
                            </p>
                          </div>
                        )}
                        {item.guardianText && (
                          <div className="p-3 rounded-lg bg-background border border-border">
                            <span className="text-[9px] text-[#7C9A74] font-serif font-bold tracking-widest uppercase block mb-1">
                              자녀의 기억
                            </span>
                            <p className="text-[12px] text-muted-foreground leading-loose font-sans">
                              &ldquo;{item.guardianText}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Differences */}
                      {item.differences && item.differences.length > 0 && (
                        <div className="border-t border-border pt-2 text-[11px] text-muted-foreground">
                          <span className="font-serif font-bold block mb-1">기억 비교 사료</span>
                          <ul className="list-disc list-inside flex flex-col gap-0.5 pl-1 font-sans">
                            {item.differences.map((d, dIdx) => (
                              <li key={dIdx}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Click-away backdrop for mobile */}
      {selectedNarrative && (
        <div
          className="fixed inset-0 z-10 sm:hidden"
          onClick={() => setSelectedNarrative(null)}
        />
      )}

      {/* Simulation status toast (mobile fallback) */}
      {simulationStatus && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-neutral-900/90 text-white text-[11px] font-serif shadow-lg animate-fade-in flex items-center gap-2">
          <Activity size={11} className="animate-spin" />
          {simulationStatus}
        </div>
      )}
    </div>
  );
}
