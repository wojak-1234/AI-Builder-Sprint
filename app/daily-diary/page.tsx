"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { ArrowLeft, Mic, MicOff, Image as ImageIcon, X, RefreshCw, Check, Sun, Utensils, Keyboard } from "lucide-react";

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
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300">
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

      {/* Main Interface - Unified with /journal */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-between gap-6">
        {/* Question/Topic Bubble - Unified with /journal */}
        <div className="p-6 rounded-2xl bg-secondary border border-border text-left select-text">
          <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block mb-2 select-none">
            오늘의 하루 이야기 주제
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-loose">
            &ldquo;오늘 어떤 일이 있으셨고, 특별히 맛있게 드신 음식이 있으신가요?&rdquo;
          </h2>
        </div>

        {/* Input Form Section - Unified with /journal */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="p-6 rounded-2xl bg-background border border-border shadow-sm flex flex-col gap-5 text-left">
            {/* Format Selection Chips */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-xs font-serif font-bold text-muted-foreground">편하신 기록 수단 선택:</span>
              <div className="flex items-center gap-2">
                {/* Voice Button */}
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
                  <span>{isRecording ? "녹음 중..." : "음성 입력"}</span>
                </button>

                {/* Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-serif font-bold border border-border bg-muted/40 text-foreground hover:bg-muted flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ImageIcon size={14} className="text-amber-500" />
                  <span>사진 첨부</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Photo Preview */}
            {photoUrl && (
              <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/20 p-2 flex flex-col items-center">
                <img src={photoUrl} alt="Daily photo preview" className="max-h-52 object-cover rounded-lg w-full" />
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
              label="소소한 일상 적기"
              placeholder="예) 오늘 점심으로 따뜻한 된장찌개를 맛있게 먹었다. 오후에는 햇살을 받으며 동네 산책길을 한 바퀴 걸었다."
              className="min-h-[160px] text-base"
            />

            {/* Status Messages */}
            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check size={16} />
                <span>오늘 일기가 서첩에 고이 보관되었습니다! 홈으로 이동합니다...</span>
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
                  "서첩에 보관하기 ✦"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
