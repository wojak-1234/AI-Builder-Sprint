"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import CompletionModal from "@/components/CompletionModal";
import CalendarWidget from "@/components/CalendarWidget";
import DayDetailModal from "@/components/DayDetailModal";
import { supabaseService, DBUser, DBQuestionHistory, DBAnswer, DBDailyDiary } from "@/services/supabase-service";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { BookOpen, User, Users, RotateCcw, MessageSquarePlus, Activity, Flame, Lightbulb, Edit3, Sun, ArrowRight, FastForward, Image as ImageIcon, X, Maximize2, Check, Clock, CheckCircle2 } from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<DBUser | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<DBQuestionHistory | null>(null);
  const [customProposedQuestions, setCustomProposedQuestions] = useState<DBQuestionHistory[]>([]);
  const [answers, setAnswers] = useState<DBAnswer[]>([]);
  const [recentDiaries, setRecentDiaries] = useState<DBDailyDiary[]>([]);
  const [dailyDiaryPrompt, setDailyDiaryPrompt] = useState<string>("오늘 어떤 일이 있으셨고, 특별히 드신 음식이 있으신가요?");
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Calendar Selection Modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayAnswers, setSelectedDayAnswers] = useState<DBAnswer[]>([]);

  // Fullscreen photo viewer state
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

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

        // Fetch dynamic personalized daily diary prompt
        const dPrompt = await questionGeneratorAgent.generateDynamicDailyDiaryPrompt(allAnswers, diaries);
        if (dPrompt) {
          setDailyDiaryPrompt(dPrompt);
        }

        // 1. Fetch Daily Mission Question (questions_history) using Virtual Today String
        const questions = await supabaseService.getQuestions(elderlyId);
        const virtualTodayStr = supabaseService.getVirtualTodayString();

        // Deterministic per-user-per-day id: makes "today's auto question" idempotent so
        // concurrent/repeated loads (two tabs, fast reloads, etc.) can never create duplicates —
        // addQuestion() upserts by id instead of inserting a new row every time.
        const autoQId = `q-auto-${elderlyId}-${virtualTodayStr}`;

        // Rule: A NEW daily reminiscence question MUST be generated & set for EVERY DAY
        // Prefer the deterministic id match; fall back to date-parsing for legacy random-id rows.
        let todayQ = questions.find((q) => q.id === autoQId) || questions.find((q) => {
          const qDate = toLocalDateString(q.created_at);
          const isCustom = q.id.startsWith("q-custom-") || q.created_by;
          return qDate === virtualTodayStr && !isCustom;
        });

        // If no question exists specifically for virtualTodayStr, ALWAYS generate a fresh new curated question via server API!
        if (!todayQ) {
          try {
            const apiRes = await fetch("/api/questions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: elderlyId, isShared: true }),
            });
            const apiJson = await apiRes.json();
            if (apiJson.success && apiJson.questions && apiJson.questions.length > 0) {
              // Server can't access localStorage/virtualDate, so we save with correct virtual date here on client
              const offsetDays = supabaseService.getVirtualDateOffset();
              const virtualNow = new Date(Date.now() + offsetDays * 86400000).toISOString();

              const autoQ: DBQuestionHistory = {
                id: autoQId,
                user_id: elderlyId,
                question_text: apiJson.questions[0],
                created_at: virtualNow,
                status: "pending",
                shared: true,
                memory_zone: apiJson.memoryZone || "sharedIndependentMemory",
              };
              await supabaseService.addQuestion(autoQ);
              todayQ = autoQ;
            }
          } catch (apiErr) {
            console.error("Error generating question via server API:", apiErr);
          }
        }

        setTodayQuestion(todayQ || null);

        // 2. Fetch Custom Proposed Questions from dedicated table (custom_proposed_questions)
        const customProposed = await supabaseService.getCustomProposedQuestions(elderlyId);
        setCustomProposedQuestions(customProposed);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper function to convert ISO string or Date into local YYYY-MM-DD
  const toLocalDateString = (isoOrDateStr?: string | Date): string => {
    if (!isoOrDateStr) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    const dateObj = typeof isoOrDateStr === "string" ? new Date(isoOrDateStr) : isoOrDateStr;
    if (isNaN(dateObj.getTime())) {
      return String(isoOrDateStr).slice(0, 10);
    }
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Calculate Streak (Consecutive active days)
  const calculateStreak = (answersList: DBAnswer[], diariesList: DBDailyDiary[]) => {
    const datesSet = new Set<string>();
    answersList.forEach((a) => datesSet.add(toLocalDateString(a.created_at)));
    diariesList.forEach((d) => datesSet.add(toLocalDateString(d.created_at)));

    if (datesSet.size === 0) return 0;

    const todayStr = toLocalDateString(new Date());
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterdayStr = toLocalDateString(yesterdayDate);

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
      const key = toLocalDateString(checkDate);
      if (datesSet.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak(answers, recentDiaries);

  const handleRoleToggle = async () => {
    const currentRole = user?.role || "self";
    const newRole = currentRole === "self" ? "guardian" : "self";
    const newUser: DBUser = {
      id: newRole === "self" ? "user-elderly-123" : "user-guardian-456",
      role: newRole,
      name: newRole === "self" ? "김순자 어르신" : "이지영 (자녀)",
      paired_user_id: newRole === "self" ? "user-guardian-456" : "user-elderly-123",
      created_at: user?.created_at || new Date().toISOString()
    };
    await supabaseService.setCurrentUser(newUser);
    setUser(newUser);
    window.location.reload();
  };

  const handleResetData = () => {
    supabaseService.resetMockData();
    window.location.reload();
  };

  const handleSkipOneDay = () => {
    supabaseService.skipOneDay();
    const nextVirtualToday = supabaseService.getVirtualTodayString();
    alert(`[Judge/Demo] 시스템 날짜가 하루 앞으로 진행되었습니다\n(현재 가상 데모 날짜: ${nextVirtualToday})`);
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
        <div className="flex items-center gap-1.5">
          {/* Judge/Demo Skip Day Button */}
          <button
            onClick={handleSkipOneDay}
            title="[Judge/Demo] 하루 지나기 (+1일 Skip)"
            className="px-2 py-1.5 rounded-lg bg-highlight/10 border border-highlight/40 hover:bg-highlight/20 text-highlight text-xs font-serif font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
          >
            <FastForward size={13} className="text-highlight animate-pulse" />
            <span>하루 Skip</span>
          </button>
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
          <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-serif font-bold shadow-sm">
            <Flame size={13} className="fill-destructive text-destructive animate-bounce" />
            <span>{currentStreak}일 연속 회상 중</span>
          </div>
        </div>

        {/* Role-based UI rendering */}
        {(() => {
          const isGuardian = user?.role === "guardian";

          // Lookup both elderly and guardian answers for todayQuestion
          const elderlyAnswer = answers.find(
            (a) => (a.question_id === todayQuestion?.id || a.question_text === todayQuestion?.question_text) && !a.by_guardian
          );
          const guardianAnswer = answers.find(
            (a) => (a.question_id === todayQuestion?.id || a.question_text === todayQuestion?.question_text) && a.by_guardian
          );

          // Calculate whether ALL active containers on home have been answered by current user
          const rawActiveQs: DBQuestionHistory[] = [];
          if (todayQuestion) rawActiveQs.push(todayQuestion);
          if (customProposedQuestions && customProposedQuestions.length > 0) {
            rawActiveQs.push(...customProposedQuestions);
          }

          const virtualTodayStr = supabaseService.getVirtualTodayString();
          const allActiveQs = rawActiveQs.filter((qItem) => {
            const eAns = answers.find(
              (a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && !a.by_guardian
            );
            const gAns = answers.find(
              (a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && a.by_guardian
            );

            const isBothAnswered = Boolean(eAns && gAns);
            if (isBothAnswered) {
              const latestAnsDateStr = eAns!.created_at > gAns!.created_at
                ? toLocalDateString(eAns!.created_at)
                : toLocalDateString(gAns!.created_at);
              const qDate = toLocalDateString(qItem.created_at);
              const lastCompletedDate = latestAnsDateStr > qDate ? latestAnsDateStr : qDate;

              if (lastCompletedDate < virtualTodayStr) {
                return false;
              }
            }
            return true;
          });

          const isAllQuestionsAnswered = allActiveQs.length > 0 && allActiveQs.every((qItem) => {
            if (isGuardian) {
              return answers.some((a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && a.by_guardian);
            } else {
              return answers.some((a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && !a.by_guardian);
            }
          });

          const todayDiary = recentDiaries.find((d) => {
            const dDate = d.event_date || (d.created_at ? toLocalDateString(d.created_at) : "");
            return dDate === virtualTodayStr;
          });

          const isDiaryCompleted = isGuardian ? true : Boolean(todayDiary);

          // All containers on home page must be answered!
          const isAllContainersCompleted = isAllQuestionsAnswered && isDiaryCompleted;

          const renderCompletionBanner = () => {
            if (!isAllContainersCompleted) return null;
            return (
              <div className="w-full p-5 rounded-2xl bg-success/15 border-2 border-success/30 text-foreground flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="text-left flex flex-col gap-0.5">
                    <h3 className="text-base font-serif font-bold text-foreground">
                      오늘 할 일을 모두 완료했어요!
                    </h3>
                    <p className="text-xs text-muted-foreground font-serif">
                      질문과 일기를 모두 기록하셨습니다.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-serif font-bold shrink-0">
                  완료 100%
                </span>
              </div>
            );
          };

          // Shared Question Card Helper Component (Renders daily question + custom proposed questions)
          const renderUnifiedQuestionCard = () => {
            if (allActiveQs.length === 0) return null;

            return (
              <div className="flex flex-col gap-5 w-full">
                {allActiveQs.map((qItem, idx) => {
                  const elderlyAnswer = answers.find(
                    (a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && !a.by_guardian
                  );
                  const guardianAnswer = answers.find(
                    (a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && a.by_guardian
                  );

                  const isCustomProposed = customProposedQuestions.some((cq) => cq.id === qItem.id || cq.question_text === qItem.question_text);
                  const badgeLabel = isCustomProposed
                    ? (qItem.created_by === "guardian" ? "자녀가 제안한 추가 추억 질문" : "어르신 제안 추가 추억 질문")
                    : (qItem.shared ? "세대 연결 공통 회상 질문" : "오늘의 미션: 회상 구절 적기");

                  // Fallback lookup for custom_image_url in case qItem missing property from server join
                  const matchedCustomProp = customProposedQuestions.find(
                    (cq) => cq.id === qItem.id || (cq.question_text && qItem.question_text && cq.question_text.trim() === qItem.question_text.trim())
                  );
                  const matchedAnswerWithMedia = answers.find(
                    (a) => (a.question_id === qItem.id || (a.question_text && qItem.question_text && a.question_text.trim() === qItem.question_text.trim())) && a.media_url
                  );
                  const displayImageUrl = qItem.custom_image_url || matchedCustomProp?.custom_image_url || matchedAnswerWithMedia?.media_url;

                  return (
                    <div key={qItem.id} className="w-full p-6 sm:p-7 rounded-3xl bg-highlight/10 border-2 border-highlight/35 shadow-sm text-left flex flex-col gap-5">
                      {/* Single Header Badge & Title */}
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-highlight/20 text-highlight text-xs font-serif font-bold border border-highlight/40 shadow-xs">
                          <MessageSquarePlus size={13} className="text-highlight" />
                          {badgeLabel}
                        </div>
                        {qItem.shared && (
                          <span className={`text-[11px] font-serif font-bold ${elderlyAnswer && guardianAnswer ? "text-success" : "text-highlight"}`}>
                            {elderlyAnswer && guardianAnswer ? "세대 매듭 완결" : "세대 매듭 연결 중"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-serif font-bold text-foreground leading-relaxed select-text">
                        &ldquo;{qItem.question_text}&rdquo;
                      </h3>

                      {displayImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFullscreenImage(displayImageUrl)}
                          className="group/photo relative w-full rounded-2xl overflow-hidden border border-highlight/35 shadow-xs max-h-72 flex items-center justify-center bg-black/10 cursor-zoom-in"
                        >
                          <img
                            src={displayImageUrl}
                            alt="첨부된 추억 사진"
                            className="w-full h-full object-cover max-h-72"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/photo:bg-black/30 transition-colors">
                            <Maximize2 size={22} className="text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </button>
                      )}

                      {/* Dual Answer Section Inside the SAME Container (Vertical Stack on Home) */}
                      <div className="flex flex-col gap-3.5 w-full">
                        {/* 1. Elderly Answer Box */}
                        <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                          elderlyAnswer ? "bg-success/10 border-success/30" : "bg-highlight/8 border-highlight/25"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
                              <User size={12} className="text-highlight" />
                              어르신(순자 님)의 기억
                            </span>
                            {elderlyAnswer ? (
                              <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Check size={10} />기록 완료</span>
                            ) : (
                              <span className="text-[10px] bg-highlight/20 text-highlight px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Clock size={10} />기록 대기</span>
                            )}
                          </div>

                          {elderlyAnswer ? (
                            <p className="text-xs font-serif text-foreground leading-relaxed italic line-clamp-3">
                              &ldquo;{elderlyAnswer.answer_text}&rdquo;
                            </p>
                          ) : (
                            <p className="text-xs font-serif text-muted-foreground italic">
                              아직 어르신의 기록이 작성되지 않았습니다.
                            </p>
                          )}

                          {!isGuardian && (
                            <button
                              onClick={() => router.push(`/journal?qid=${qItem.id}`)}
                              className="w-full py-2 px-3 text-xs font-serif font-bold bg-primary text-primary-foreground hover:opacity-95 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs mt-1"
                            >
                              <Edit3 size={13} />
                              {elderlyAnswer ? "어르신 답변 수정하기" : "어르신 답변 기록하기"}
                            </button>
                          )}
                        </div>

                        {/* 2. Guardian Answer Box */}
                        <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                          guardianAnswer ? "bg-success/10 border-success/30" : "bg-highlight/8 border-highlight/25"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
                              <User size={12} className="text-highlight" />
                              보호자(지영 님)의 기억
                            </span>
                            {guardianAnswer ? (
                              <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Check size={10} />기록 완료</span>
                            ) : (
                              <span className="text-[10px] bg-highlight/20 text-highlight px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Clock size={10} />기록 대기</span>
                            )}
                          </div>

                          {guardianAnswer ? (
                            <p className="text-xs font-serif text-foreground leading-relaxed italic line-clamp-3">
                              &ldquo;{guardianAnswer.answer_text}&rdquo;
                            </p>
                          ) : (
                            <p className="text-xs font-serif text-muted-foreground italic">
                              아직 보호자의 기록이 작성되지 않았습니다.
                            </p>
                          )}

                          {isGuardian && (
                            <button
                              onClick={() => router.push(`/journal?qid=${qItem.id}`)}
                              className="w-full py-2 px-3 text-xs font-serif font-bold bg-primary text-primary-foreground hover:opacity-95 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs mt-1"
                            >
                              <Edit3 size={13} />
                              {guardianAnswer ? "보호자 답변 수정하기" : "보호자 답변 기록하기"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Merged Perspective Banner if both answered */}
                      {elderlyAnswer && guardianAnswer && (
                        <div className="p-3 rounded-xl bg-success/15 border border-success/30 text-foreground text-xs font-serif font-bold flex items-center gap-2">
                          <Users size={14} className="text-success shrink-0" />
                          <span>두 사람의 기억이 하나의 따뜻한 세대 매듭으로 통합 연결되었습니다.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          };

          // If Guardian View
          if (isGuardian) {
            return (
              <div className="flex flex-col gap-5 w-full">
                {/* All Containers Completion Banner */}
                {renderCompletionBanner()}

                {/* Unified Shared Question Container Card */}
                {renderUnifiedQuestionCard()}

                {/* Guardian Menu Grid: Custom Topic Proposal & 11-Category Answer Card Viewer (Side-by-side) */}
                <div className="grid grid-cols-2 gap-3.5 w-full">
                  {/* Guardian Menu Card 1: Custom Topic Proposal */}
                  {(() => {
                    const todayStr = toLocalDateString(new Date());
                    const hasProposedToday = customProposedQuestions.some((q) => toLocalDateString(q.created_at) === todayStr);

                    return (
                      <div
                        onClick={() => router.push("/custom-topic")}
                        className="p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all flex flex-col justify-between cursor-pointer group gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-highlight group-hover:scale-105 transition-transform shrink-0">
                            <Lightbulb size={20} />
                          </div>
                          {hasProposedToday && (
                            <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                              <Check size={10} />오늘 제안 완료
                            </span>
                          )}
                        </div>
                        <div className="text-left flex flex-col gap-1">
                          <h4 className="text-sm sm:text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                            어르신께 대화 주제 제안하기
                          </h4>
                          <p className="text-xs text-muted-foreground font-sans leading-normal">
                            {hasProposedToday ? "오늘 대화 주제 제안이 완료되었습니다 (하루 1회)" : "옛 앨범 사진이나 이야기 힌트로 정겨운 질문 다듬기"}
                          </p>
                        </div>
                        <div className="text-right text-primary group-hover:translate-x-1 transition-transform font-bold text-xs inline-flex items-center gap-1 self-end">
                          {hasProposedToday ? "제안 내역 보기" : "바로가기"}
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Guardian Menu Card 2: 11-Category Answer Card Viewer */}
                  <Link href="/narrative" className="group h-full">
                    <div className="h-full p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all flex flex-col justify-between cursor-pointer gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div className="text-left flex flex-col gap-1">
                        <h4 className="text-sm sm:text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          어르신의 추억 보관함
                        </h4>
                        <p className="text-xs text-muted-foreground font-sans leading-normal">
                          인물, 장소, 사건별로 정돈된 어르신의 서사 보관함
                        </p>
                      </div>
                      <div className="text-right text-primary group-hover:translate-x-1 transition-transform font-bold text-xs inline-flex items-center gap-1 self-end">
                        바로가기
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Guardian Menu Card 3: Album Photo Gallery */}
                <Link href="/album" className="group w-full">
                  <div className="w-full p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all flex items-center justify-between cursor-pointer gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center text-highlight group-hover:scale-105 transition-transform shrink-0">
                        <ImageIcon size={20} />
                      </div>
                      <div className="text-left flex flex-col gap-0.5">
                        <h4 className="text-sm sm:text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          어르신의 추억 사진첩 보기
                        </h4>
                        <p className="text-xs text-muted-foreground font-sans leading-normal">
                          모아둔 옛 앨범 사진과 제안 사진들의 모음 갤러리
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-primary group-hover:translate-x-1 transition-transform font-bold text-xs shrink-0 inline-flex items-center gap-1">
                      사진첩 보기
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>

                <CalendarWidget answers={answers} diaries={recentDiaries} onSelectDate={handleSelectDate} />
              </div>
            );
          }

          // Elderly Mode (self): Always show Unified Question Card & Mission 2 Cards + 2-Column Horizontal Menu
          return (
            <div className="flex flex-col gap-5 w-full">
              {/* All Containers Completion Banner */}
              {renderCompletionBanner()}

              {/* Unified Shared Question Container Card (Self mode) */}
              {renderUnifiedQuestionCard()}

              {/* 2. Daily Diary Container Card - Mission 2 (Self mode) */}
              <div className={`w-full p-6 rounded-2xl border-2 shadow-sm text-left relative flex flex-col gap-4 transition-colors ${
                todayDiary ? "bg-success/10 border-success/35" : "bg-highlight/10 border-highlight/35"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-highlight/20 text-highlight text-xs font-serif font-bold border border-highlight/40 shadow-xs">
                    <Sun size={13} className="text-highlight" />
                    오늘의 미션 2: 일상 일기 적기
                  </div>
                  {todayDiary ? (
                    <span className="text-[11px] bg-success/20 text-success px-2 py-0.5 rounded-full font-serif font-bold flex items-center gap-0.5">
                      <Check size={11} />오늘 작성 완료
                    </span>
                  ) : (
                    <span className="text-[11px] bg-highlight/20 text-highlight px-2 py-0.5 rounded-full font-serif font-bold flex items-center gap-0.5">
                      <Clock size={11} />오늘 작성 대기
                    </span>
                  )}
                </div>

                <h4 className="text-base font-serif font-bold text-foreground">
                  {todayDiary ? "오늘의 일상 일기 기록" : dailyDiaryPrompt}
                </h4>

                {todayDiary ? (
                  <div className="p-3.5 rounded-xl bg-success/10 border border-success/25 text-xs font-serif text-foreground italic line-clamp-3 leading-relaxed">
                    &ldquo;{todayDiary.content}&rdquo;
                  </div>
                ) : (
                  <p className="text-xs font-serif text-muted-foreground leading-relaxed italic">
                    오늘 마주친 풍경이나 식사, 대화를 편안하게 기록해보세요.
                  </p>
                )}

                <button
                  onClick={() => router.push("/daily-diary")}
                  className="w-full py-3 text-base font-serif font-bold bg-highlight/80 hover:bg-highlight text-highlight-foreground border border-highlight/50 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Edit3 size={15} className="text-highlight-foreground" />
                  {todayDiary ? "오늘 일기 수정하기" : "오늘 일상 일기 적기"}
                </button>
              </div>

              {/* 3. 2-Column Storage Menu Grid: 11-Category Box + Album Photo Gallery (Self Mode) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {/* Menu 1: 11-Category Box */}
                <Link href="/narrative" className="group w-full">
                  <div className="h-full p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all flex flex-col justify-between cursor-pointer gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div className="text-left flex flex-col gap-1">
                      <h4 className="text-sm sm:text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        내 추억 보관함
                      </h4>
                      <p className="text-xs text-muted-foreground font-sans leading-normal">
                        인물, 장소, 사건별로 정돈된 나의 서사 보관함
                      </p>
                    </div>
                    <div className="text-right text-primary group-hover:translate-x-1 transition-transform font-bold text-xs inline-flex items-center gap-1 self-end">
                      보관함 보기
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>

                {/* Menu 2: Album Photo Gallery */}
                <Link href="/album" className="group w-full">
                  <div className="h-full p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/35 transition-all flex flex-col justify-between cursor-pointer gap-3">
                    <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center text-highlight group-hover:scale-105 transition-transform shrink-0">
                      <ImageIcon size={20} />
                    </div>
                    <div className="text-left flex flex-col gap-1">
                      <h4 className="text-sm sm:text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        추억 사진첩 보기
                      </h4>
                      <p className="text-xs text-muted-foreground font-sans leading-normal">
                        모아둔 옛 앨범 사진과 제안 사진들의 모음 갤러리
                      </p>
                    </div>
                    <div className="text-right text-primary group-hover:translate-x-1 transition-transform font-bold text-xs inline-flex items-center gap-1 self-end">
                      사진첩 보기
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              </div>

              <CalendarWidget answers={answers} diaries={recentDiaries} onSelectDate={handleSelectDate} />
            </div>
          );
        })()}
      </main>

      <footer className="w-full max-w-lg mx-auto text-center mt-12 pb-4">
        <p className="text-[11px] text-muted-foreground font-serif leading-normal select-none">
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

      {/* Fullscreen Photo Viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
          <img
            src={fullscreenImage}
            alt="추억 사진 전체 보기"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
