"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import CompletionModal from "@/components/CompletionModal";
import CalendarWidget from "@/components/CalendarWidget";
import DayDetailModal from "@/components/DayDetailModal";
import CustomTopicModal from "@/components/CustomTopicModal";
import { supabaseService, DBUser, DBQuestionHistory, DBAnswer, DBDailyDiary } from "@/services/supabase-service";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { BookOpen, User, RotateCcw, MessageSquarePlus, Activity, Flame, Sparkles, Edit3, Sun } from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<DBUser | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<DBQuestionHistory | null>(null);
  const [answers, setAnswers] = useState<DBAnswer[]>([]);
  const [recentDiaries, setRecentDiaries] = useState<DBDailyDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Calendar Selection Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayAnswers, setSelectedDayAnswers] = useState<DBAnswer[]>([]);

  useEffect(() => {
    if (searchParams.get("completed") === "true") {
      setShowCompletionModal(true);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setShowCompletionModal(false);
    router.replace("/home");
  };

  // Load active user, today's question, user answers, and recent diaries
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        let currUser = await supabaseService.getCurrentUser();
        if (!currUser) {
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

        const elderlyId = currUser.role === "self" ? currUser.id : currUser.paired_user_id || "user-elderly-123";

        // Load all answers for calendar & streak
        const allAnswers = await supabaseService.getAnswers(elderlyId);
        setAnswers(allAnswers);

        // Load recent daily diaries
        const diaries = await supabaseService.getRecentDailyDiaries(elderlyId);
        setRecentDiaries(diaries);

        // Fetch questions
        const questions = await supabaseService.getQuestions(elderlyId);
        let pendingQ = questions.find((q) => q.status === "pending");

        if (!pendingQ) {
          const newQs = await questionGeneratorAgent.generateQuestions([], allAnswers, true);
          if (newQs.questions && newQs.questions.length > 0) {
            pendingQ = {
              id: `q-${Date.now()}`,
              user_id: elderlyId,
              question_text: newQs.questions[0],
              created_at: new Date().toISOString(),
              status: "pending",
              shared: true
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

  // Calculate Streak (Consecutive active days)
  const calculateStreak = (answersList: DBAnswer[]) => {
    if (answersList.length === 0) return 0;
    const datesSet = new Set(answersList.map((a) => a.created_at.slice(0, 10)));

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    let checkDate: Date | null = null;
    if (datesSet.has(todayStr)) {
      checkDate = new Date();
    } else if (datesSet.has(yesterdayStr)) {
      checkDate = yesterdayDate;
    } else {
      return 0;
    }

    let streak = 0;
    while (checkDate) {
      const key = checkDate.toISOString().slice(0, 10);
      if (datesSet.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak(answers);

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

  const handleSelectDate = (dateStr: string, dayAnswers: DBAnswer[]) => {
    setSelectedDate(dateStr);
    setSelectedDayAnswers(dayAnswers);
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
      <header className="w-full max-w-lg mx-auto flex items-center justify-between mb-8 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-auto relative select-none shrink-0">
            <img
              src="/logo/lightmodenew.jpg"
              alt="이음 로고"
              className="h-full w-auto object-contain block dark:hidden"
            />
            <img
              src="/logo/darkmodenew.jpg"
              alt="이음 로고"
              className="h-full w-auto object-contain hidden dark:block"
            />
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
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center gap-5">
        {/* Compact Greetings & Streak Badge */}
        <div className="flex items-center justify-between border-l-2 border-primary/30 pl-3 py-1 bg-muted/20 rounded-r-xl px-2">
          <div className="text-left">
            <h1 className="text-sm sm:text-base font-serif font-bold text-foreground leading-snug">
              {user?.role === "self" ? (
                <>반갑습니다, <span className="text-primary">순자 님</span>. 오늘의 회상 지면입니다.</>
              ) : (
                <>반갑습니다, <span className="text-primary">지영 님</span>. 어머니의 기록 지면입니다.</>
              )}
            </h1>
          </div>

          {/* Streak Counter Badge */}
          <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-serif font-bold shadow-sm">
            <Flame size={13} className="fill-orange-500 text-orange-500 animate-bounce" />
            <span>{currentStreak}일 연속 회상 중</span>
          </div>
        </div>

        {/* 1. Today's Question Card - Soft Yellow Highlighted Mission 1 */}
        {todayQuestion ? (
          <div className="w-full p-6 rounded-2xl bg-amber-100/80 dark:bg-amber-950/40 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-sm text-left relative transition-all duration-300 flex flex-col gap-4">
            {/* Mission Tag badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-serif font-bold w-fit border border-amber-400/40 shadow-xs">
              <MessageSquarePlus size={13} className="text-amber-600 dark:text-amber-400" />
              📌 오늘의 미션 1: 회상 구절 적기
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-950 dark:text-amber-100 leading-relaxed select-text">
              &ldquo;{todayQuestion.question_text}&rdquo;
            </h3>

            {/* Primary Action Button */}
            <button
              onClick={() => router.push(`/journal?qid=${todayQuestion.id}`)}
              className="w-full py-3 text-base font-serif font-bold bg-primary text-primary-foreground hover:opacity-95 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
            >
              기록하기 ✦
            </button>
          </div>
        ) : (
          <div className="w-full p-6 rounded-2xl bg-amber-100/80 dark:bg-amber-950/40 border-2 border-amber-300/80 dark:border-amber-700/60 text-center">
            <p className="text-amber-900 dark:text-amber-200 font-serif text-sm">오늘 하루의 회상 질문이 준비되어 있습니다.</p>
          </div>
        )}

        {/* 2. Daily Diary Container Card - Soft Yellow Highlighted Mission 2 */}
        <div className="w-full p-6 rounded-2xl bg-amber-100/80 dark:bg-amber-950/40 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-sm text-left relative flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-serif font-bold border border-amber-400/40 shadow-xs">
              <Sun size={13} className="text-amber-600 dark:text-amber-400" />
              📌 오늘의 미션 2: 일상 일기 적기
            </div>
            {recentDiaries.length > 0 && (
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-serif font-bold">
                보관된 일기 {recentDiaries.length}건
              </span>
            )}
          </div>

          <h4 className="text-base font-serif font-bold text-amber-950 dark:text-amber-100">
            오늘 어떤 일이 있으셨고, 특별히 드신 음식이 있으신가요?
          </h4>

          {/* Show recent diary preview if exists */}
          {recentDiaries.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-800/50 text-xs font-serif text-amber-900 dark:text-amber-200 italic truncate">
              &ldquo;{recentDiaries[0].content}&rdquo;
            </div>
          )}

          <button
            onClick={() => router.push("/daily-diary")}
            className="w-full py-3 text-base font-serif font-bold bg-amber-200/90 dark:bg-amber-900/60 hover:bg-amber-300/90 dark:hover:bg-amber-800/80 text-amber-950 dark:text-amber-100 border border-amber-400/50 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <Edit3 size={15} className="text-amber-700 dark:text-amber-300" />
            오늘 일상 일기 적기 ✦
          </button>
        </div>

        {/* 3. Calendar Widget Section */}
        <CalendarWidget answers={answers} onSelectDate={handleSelectDate} />

        {/* 4. Menu Items Stack (Custom Topic + Read Narratives) */}
        <div className="flex flex-col gap-3.5 w-full">
          {/* Menu Item 1: Custom Topic Creation */}
          <div
            onClick={() => setIsCustomModalOpen(true)}
            className="w-full p-6 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all duration-200 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-primary/5 flex items-center justify-center text-highlight group-hover:scale-105 transition-transform duration-300">
                <Sparkles size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                  {user?.role === "guardian" ? "어르신께 대화 주제 제안하기" : "직접 추억 주제 만들기"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  사진이나 텍스트 힌트로 맞춤 회상 질문 다듬기
                </p>
              </div>
            </div>
            <span className="text-primary group-hover:translate-x-1 transition-transform text-xl font-bold pr-1">
              &rarr;
            </span>
          </div>

          {/* Menu Item 2: Read Narratives */}
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
        </div>
      </main>

      <footer className="w-full max-w-lg mx-auto text-center mt-12 pb-4">
        <p className="text-[11px] text-zinc-400 font-serif leading-normal select-none">
          이음 서첩은 어르신의 평온한 두뇌 인지 자극과 추억 회고만을 돕는 서가입니다. <br />
          정신과 전문의나 의학적인 진찰 및 소견을 강요하지 않는 비상업적 공간입니다.
        </p>
      </footer>

      {/* Completion Modal */}
      <CompletionModal isOpen={showCompletionModal} onClose={handleCloseModal} />

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          isOpen={!!selectedDate}
          dateStr={selectedDate}
          answers={selectedDayAnswers}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Custom Topic Creation Modal */}
      <CustomTopicModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        userId={user?.id || "user-elderly-123"}
        creatorRole={user?.role || "self"}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground">
        <Activity className="animate-spin text-primary mb-4" size={40} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
