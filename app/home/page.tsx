"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBUser, DBQuestionHistory } from "@/services/supabase-service";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { BookOpen, User, RotateCcw, MessageSquarePlus, Activity } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<DBUser | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<DBQuestionHistory | null>(null);
  const [loading, setLoading] = useState(true);

  // Load active user and today's question
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Get current user
        let currUser = await supabaseService.getCurrentUser();
        if (!currUser) {
          // Fallback if not set
          currUser = {
            id: "user-elderly-123",
            role: "self",
            name: "김순자 어르신",
            paired_user_id: "user-guardian-456",
            created_at: new Date().toISOString(),
          };
          await supabaseService.setCurrentUser(currUser);
        }
        setUser(currUser);

        // Fetch questions
        const elderlyId = currUser.role === "self" ? currUser.id : currUser.paired_user_id || "user-elderly-123";
        const questions = await supabaseService.getQuestions(elderlyId);
        
        // Find first pending question
        let pendingQ = questions.find((q) => q.status === "pending");
        
        if (!pendingQ) {
          // If no pending question, generate one using question-generator-agent
          const answers = await supabaseService.getAnswers(elderlyId);
          const newQs = await questionGeneratorAgent.generateQuestions([], answers, true);
          if (newQs.length > 0) {
            pendingQ = {
              id: `q-${Date.now()}`,
              user_id: elderlyId,
              question_text: newQs[0].text,
              created_at: new Date().toISOString(),
              status: "pending",
              shared: newQs[0].shared
            };
            await supabaseService.addQuestion(pendingQ);
          }
        }
        
        setTodayQuestion(pendingQ || null);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleRoleToggle = async () => {
    if (!user) return;
    const newRole = user.role === "self" ? "guardian" : "self";
    const newUser: DBUser = {
      id: newRole === "self" ? "user-elderly-123" : "user-guardian-456",
      role: newRole,
      name: newRole === "self" ? "김순자 어르신" : "이지영 (자녀)",
      paired_user_id: newRole === "self" ? "user-guardian-456" : "user-elderly-123",
      created_at: user.created_at
    };
    await supabaseService.setCurrentUser(newUser);
    window.location.reload();
  };

  const handleResetData = () => {
    supabaseService.resetMockData();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300">
        <Activity className="animate-spin text-primary mb-4" size={40} />
        <p className="text-lg font-serif">서랍에서 장적을 꺼내고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300">
      {/* Header bar */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between mb-12 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground font-serif">이음</span>
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-primary leading-tight">{user?.name}</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mt-0.5">
              {user?.role === "self" ? "본인 기록첩" : "보호자 공유첩"}
            </span>
          </div>
        </div>

        {/* System Settings & Toggles */}
        <div className="flex gap-2">
          <ThemeSwitcher />
          <button
            onClick={handleRoleToggle}
            title="역할 전환"
            className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:opacity-90 text-primary transition-all duration-200 cursor-pointer"
          >
            <User size={16} />
          </button>
          <button
            onClick={handleResetData}
            title="데모 데이터 초기화"
            className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-all duration-200 cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </header>

      {/* Main Home Dashboard Layout */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center gap-10">
        {/* Greetings Section */}
        <div className="text-left border-l-2 border-primary/20 pl-4 py-1">
          <span className="text-xs text-highlight font-serif font-bold tracking-widest uppercase block mb-1">매일의 서사</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-relaxed animate-fade-in">
            {user?.role === "self" ? (
              <>
                어서 오세요, 순자 님. <br />
                오늘 되짚어볼 옛 기억의 지면입니다.
              </>
            ) : (
              <>
                반갑습니다, 지영 님. <br />
                어머니의 흘러간 세월을 모아 기록해 주세요.
              </>
            )}
          </h1>
        </div>

        {/* Today's Question Card - Matte Stationery style */}
        {todayQuestion ? (
          <div className="w-full p-8 rounded-2xl bg-secondary border border-border shadow-sm text-left relative transition-colors duration-300">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-serif font-bold mb-6 border border-primary/10">
              <MessageSquarePlus size={12} />
              오늘 적을 구절
            </div>

            {/* Question Text */}
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-loose select-text border-b border-border pb-6 mb-6">
              &ldquo;{todayQuestion.question_text}&rdquo;
            </h3>

            {/* Primary Action Button */}
            <div>
              <button
                onClick={() =>
                  router.push(
                    `/journal?qid=${todayQuestion.id}&qtext=${encodeURIComponent(
                      todayQuestion.question_text
                    )}`
                  )
                }
                className="w-full py-3.5 text-lg font-serif font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
              >
                기록하기
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full p-8 rounded-2xl bg-secondary border border-border text-center">
            <p className="text-muted-foreground font-serif">오늘 하루의 질문이 준비되어 있지 않습니다.</p>
          </div>
        )}

        {/* Read Narratives Card - Matte book-cover link */}
        <Link href="/narrative" className="w-full group">
          <div className="w-full p-6 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all duration-200 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                <BookOpen size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                  인생 나이테 연대기 보기
                </h4>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  지면에 보관된 유년 시절의 회상 서사집
                </p>
              </div>
            </div>
            <span className="text-primary group-hover:translate-x-1 transition-transform text-xl font-bold pr-1">
              &rarr;
            </span>
          </div>
        </Link>
      </main>

      {/* Footer disclaimer */}
      <footer className="w-full max-w-lg mx-auto text-center mt-16 pb-4">
        <p className="text-[11px] text-zinc-400 font-serif leading-normal select-none">
          이음 서첩은 어르신의 평온한 두뇌 인지 자극과 추억 회고만을 돕는 서가입니다. <br />
          정신과 전문의나 의학적인 진찰 및 소견을 강요하지 않는 비상업적 공간입니다.
        </p>
      </footer>
    </div>
  );
}
