"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { ArrowLeft, Sun, Mic, MicOff, Image as ImageIcon, X, RefreshCw, Check, Sparkles, Utensils } from "lucide-react";

export default function DailyDiaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<DBUser | null>(null);
  const [content, setContent] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function initUser() {
      const currUser = await supabaseService.getCurrentUser();
      setUser(currUser);
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
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!content.trim() && !photoUrl) {
      alert("오늘 어떤 일이 있으셨는지 글, 음성 또는 사진으로 남겨 주세요.");
      return;
    }

    try {
      setLoading(true);
      const userId = user?.id || "user-elderly-123";

      const newDiary: DBDailyDiary = {
        id: `d-${Date.now()}`,
        user_id: userId,
        content: content.trim() || "(오늘의 사진 및 음성 기록)",
        photo_url: photoUrl || undefined,
        created_at: new Date().toISOString(),
        event_date: new Date().toISOString().substring(0, 10),
      };

      await supabaseService.saveDailyDiary(newDiary);

      // Trigger question generator probability engine recalculation
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      setSavedSuccess(true);
      await new Promise((r) => setTimeout(r, 800));

      router.push("/home");
    } catch (err) {
      console.error("Error saving daily diary:", err);
      alert("일기 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300 select-none">
      {/* Header Bar */}
      <header className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-1 text-sm font-serif font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>홈으로</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-amber-500" />
            <h1 className="text-base font-serif font-bold text-foreground">오늘의 일상 일기</h1>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Daily Single Topic Prompt Container */}
        <div className="w-full p-6 rounded-2xl bg-secondary border border-border text-left shadow-sm flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-serif font-bold w-fit border border-amber-500/20">
            <Utensils size={13} className="text-amber-500" />
            오늘의 하루 이야기 주제
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-snug">
            &ldquo;오늘 어떤 일이 있으셨고, 특별히 맛있게 드신 음식이 있으신가요?&rdquo;
          </h2>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            어르신의 오늘 하루 소소한 풍경과 음식을 적어주시면, AI가 이 기록을 바탕으로 유년 시절의 추억과 다정하게 이어지는 회상 질문을 만들어 드립니다.
          </p>
        </div>

        {/* Input Form Section */}
        <div className="w-full p-6 rounded-2xl bg-background border border-border shadow-sm flex flex-col gap-5 text-left">
          {/* Format Selection Buttons */}
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <span className="text-xs font-serif font-bold text-muted-foreground mr-1">편하신 방법으로 기록하기:</span>
            
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isRecording
                  ? "bg-red-500 text-white border-red-500 animate-pulse shadow-sm"
                  : "bg-muted/40 border-border text-foreground hover:bg-muted"
              }`}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} className="text-primary" />}
              <span>{isRecording ? "음성 녹음 중..." : "음성으로 말하기"}</span>
            </button>

            {/* Photo Input Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-serif font-bold border border-border bg-muted/40 text-foreground hover:bg-muted flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ImageIcon size={14} className="text-amber-500" />
              <span>사진 올리기</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Image Preview if uploaded */}
          {photoUrl && (
            <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/20 p-2 flex flex-col items-center">
              <img src={photoUrl} alt="Daily photo preview" className="max-h-56 object-cover rounded-lg w-full" />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Text Area */}
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            label="오늘 하루 일기 작성"
            placeholder="예) 오늘 점심으로 따뜻한 된장찌개를 맛있게 먹었다. 오후에는 햇살을 받으며 동네 산책길을 한 바퀴 걸었다."
            className="min-h-[160px] text-base"
          />

          {/* Success Status */}
          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check size={16} />
              <span>오늘의 일기가 서첩에 고이 보관되었습니다! 홈으로 이동합니다...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => router.push("/home")} disabled={loading} className="flex-1">
              취소
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw size={15} className="animate-spin" /> 보관하는 중...
                </span>
              ) : (
                "일기 보관하기"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
