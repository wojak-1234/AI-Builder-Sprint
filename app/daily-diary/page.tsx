"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { ArrowLeft, Mic, MicOff, Image as ImageIcon, X, RefreshCw, Check, Keyboard, RotateCcw, Sun } from "lucide-react";

export default function DailyDiaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<DBUser | null>(null);
  const [answerType, setAnswerType] = useState<"text" | "voice" | "ocr" | null>(null);

  const [textAnswer, setTextAnswer] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [existingDiaryId, setExistingDiaryId] = useState<string | null>(null);
  const [existingDiaryCreatedAt, setExistingDiaryCreatedAt] = useState<string | null>(null);
  const [dynamicPrompt, setDynamicPrompt] = useState<string>("오늘 어떤 일이 있으셨고, 특별히 맛있게 드신 음식이 있으신가요?");

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function initUser() {
      const currUser = await supabaseService.getCurrentUser();
      setUser(currUser);
      const elderlyId = currUser?.role === "self" ? currUser.id : currUser?.paired_user_id || "user-elderly-123";
      const diaries = await supabaseService.getRecentDailyDiaries(elderlyId);
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayDiary = diaries.find((d) => (d.event_date || d.created_at.slice(0, 10)) === todayStr);

      if (todayDiary) {
        setTextAnswer(todayDiary.content);
        setExistingDiaryId(todayDiary.id);
        setExistingDiaryCreatedAt(todayDiary.created_at);
        if (todayDiary.photo_url) setPhotoPreview(todayDiary.photo_url);
        setAnswerType("text"); // Direct edit mode for today's diary
      }

      // Fetch dynamic personalized prompt using LLM
      const allAnswers = await supabaseService.getAnswers(elderlyId);
      const prompt = await questionGeneratorAgent.generateDynamicDailyDiaryPrompt(allAnswers, diaries);
      if (prompt) {
        setDynamicPrompt(prompt);
      }
    }
    initUser();
  }, []);

  // Web Speech API Voice STT Setup
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("현재 브라우저는 음성 입력을 지원하지 않습니다. Chrome/Safari 브라우저를 이용해 주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        setTextAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setVoiceText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // Image Upload handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    let finalContent = [textAnswer, voiceText].filter(Boolean).join(" ").trim();
    if (!finalContent && photoPreview) {
      finalContent = "(오늘의 풍경/음식 사진 기록)";
    }

    if (!finalContent && !photoPreview) {
      alert("오늘 일상 기록을 입력해 주세요.");
      return;
    }

    const userId = user?.id || "user-elderly-123";
    const rateLimitKey = `eeum_last_edit_time_diary_${userId}`;

    // Rate Limiting Check (3 minutes cooldown = 180,000 ms per edit)
    if (typeof window !== "undefined") {
      const lastEditTimeStr = localStorage.getItem(rateLimitKey);
      if (lastEditTimeStr) {
        const lastEditTime = parseInt(lastEditTimeStr, 10);
        const elapsed = Date.now() - lastEditTime;
        const cooldown = 180000;
        if (elapsed < cooldown) {
          const remainingSec = Math.ceil((cooldown - elapsed) / 1000);
          const mins = Math.floor(remainingSec / 60);
          const secs = remainingSec % 60;
          const timeStr = mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;
          alert(`일기 수정은 3분에 1회만 가능합니다.\n(${timeStr} 후 다시 시도해 주세요)`);
          return;
        }
      }
    }

    try {
      setLoading(true);

      const newDiary: DBDailyDiary = {
        id: existingDiaryId || `d-${Date.now()}`,
        user_id: userId,
        content: finalContent.trim() || "(오늘의 일상 기록)",
        photo_url: photoPreview || undefined,
        created_at: existingDiaryCreatedAt || new Date().toISOString(),
        event_date: new Date().toISOString().substring(0, 10),
      };

      await supabaseService.saveDailyDiary(newDiary);

      // Trigger question generator probability engine recalculation with LLM
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      // Record rate limit timestamp
      if (typeof window !== "undefined") {
        localStorage.setItem(rateLimitKey, Date.now().toString());
      }

      setSavedSuccess(true);
      await new Promise((r) => setTimeout(r, 600));

      router.push("/home");
    } catch (err) {
      console.error("Error saving daily diary:", err);
      alert("일기 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300 select-none">
      {/* Top Navigation - Unified with /journal */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between mb-8 border-b border-border pb-4">
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
            일상 일기 서첩
          </span>
        </div>
      </header>

      {/* Main Interface - Expanded Unified Editor View */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col gap-5">
        {/* Hero Topic Banner */}
        <div className="p-6 sm:p-7 rounded-3xl hero-remembrance-card text-left select-text relative flex flex-col gap-2.5">
          <div className="stamp-badge w-fit">
            <Sun size={13} className="text-amber-600 dark:text-amber-400" />
            <span>오늘의 일상 이야기 주제</span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-black text-amber-950 dark:text-amber-100 leading-relaxed tracking-tight">
            &ldquo;{dynamicPrompt}&rdquo;
          </h2>
        </div>

        {/* Unified Spacious Daily Editor Card */}
        <div className="flex-1 flex flex-col gap-4 bg-background border border-border rounded-3xl p-5 sm:p-6 shadow-sm text-left">
          {/* Main Text Editor Area (Expanded Full Height) */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-serif font-bold text-muted-foreground flex items-center justify-between">
              <span>오늘의 소소한 일상 일기 (자유 기록)</span>
              {textAnswer.length > 0 && (
                <span className="text-[11px] text-primary">{textAnswer.length}자 작성 중</span>
              )}
            </label>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="오늘 어떤 일이나 식사, 마주친 풍경이 있으셨나요? 여기에 편안히 적어보세요..."
              className="w-full flex-1 min-h-[280px] sm:min-h-[320px] p-4 rounded-2xl bg-muted/20 border border-border/70 focus:border-primary focus:ring-1 focus:ring-primary text-base sm:text-lg font-serif leading-relaxed text-foreground placeholder:text-muted-foreground/60 resize-none outline-none transition-all"
            />
          </div>

          {/* Photo Attachment Preview (If attached) */}
          {photoPreview && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-border/80 bg-black/5 dark:bg-white/5 p-2">
              <div className="relative w-full max-h-56 rounded-xl overflow-hidden">
                <img src={photoPreview} alt="Attached photo" className="w-full h-full object-cover max-h-56" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/75 text-white flex items-center justify-center cursor-pointer hover:bg-black transition-colors"
                  title="사진 삭제"
                >
                  <X size={15} />
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground font-serif block mt-1 px-1">
                📸 오늘의 사진이 함께 첨부되었습니다.
              </span>
            </div>
          )}

          {/* Voice STT Transcript Banner (If recording) */}
          {isRecording && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 animate-pulse">
              <Mic size={16} className="text-red-500 shrink-0" />
              <span>말씀을 듣고 일기에 담는 중입니다... ({voiceText.slice(-25) || "말씀을 시작해 보세요"})</span>
            </div>
          )}

          {/* Editor Action Toolbar (Photo & Voice buttons) */}
          <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 text-foreground font-serif text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ImageIcon size={16} className="text-primary" />
              <span>{photoPreview ? "사진 변경하기" : "사진 첨부하기"}</span>
            </button>

            {/* Voice Recording Button */}
            <button
              type="button"
              onClick={() => {
                setAnswerType("voice");
                toggleRecording();
              }}
              className={`py-2.5 px-3 rounded-xl border text-xs font-serif font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isRecording
                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 animate-pulse"
                  : "border-border bg-muted/20 hover:bg-muted/50 text-foreground"
              }`}
            >
              <Mic size={16} className={isRecording ? "text-red-500" : "text-amber-600 dark:text-amber-400"} />
              <span>{isRecording ? "녹음 마침" : "음성 받아적기"}</span>
            </button>
          </div>

          {/* Saved Success Message */}
          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check size={16} />
              <span>오늘의 일기가 서첩에 고이 보관되었습니다! 홈으로 이동합니다...</span>
            </div>
          )}

          {/* Submit Button */}
          <Button variant="primary" onClick={handleSubmit} disabled={loading} className="w-full py-3.5 text-base mt-1 shadow-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw size={16} className="animate-spin" /> 서첩에 보관하는 중...
              </span>
            ) : (
              "서첩에 일기 보관하기 ✦"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
