"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBDailyDiary, DBUser } from "@/services/supabase-service";
import { ArrowLeft, Mic, MicOff, Image as ImageIcon, X, RefreshCw, Check, Keyboard, RotateCcw } from "lucide-react";

export default function DailyDiaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<DBUser | null>(null);
  const [answerType, setAnswerType] = useState<"text" | "voice" | "ocr" | null>(null);

  const [textAnswer, setTextAnswer] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
    let finalContent = "";
    if (answerType === "text") finalContent = textAnswer;
    if (answerType === "voice") finalContent = voiceText;
    if (answerType === "ocr") finalContent = photoPreview ? "(오늘의 풍경/음식 사진 기록)" : "";

    if (!finalContent.trim() && !photoPreview) {
      alert("오늘 일상 기록을 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);
      const userId = user?.id || "user-elderly-123";

      const newDiary: DBDailyDiary = {
        id: `d-${Date.now()}`,
        user_id: userId,
        content: finalContent.trim() || "(오늘의 일상 기록)",
        photo_url: photoPreview || undefined,
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

        {/* Input Selector or Input Area - Unified 2-Step Flow with /journal */}
        <div className="flex-1 flex flex-col justify-center">
          {!answerType ? (
            <div className="flex flex-col gap-4 w-full">
              <h3 className="text-base font-serif font-bold text-zinc-500 dark:text-zinc-400 text-left mb-2 select-none">
                일상 일기를 채울 방식을 선택해 주세요
              </h3>

              {/* Text Option */}
              <button
                onClick={() => setAnswerType("text")}
                className="flex items-start gap-4 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left cursor-pointer active:scale-98 shadow-sm"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-foreground">키보드로 쓰기 (직접 입력)</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    오늘 다녀오신 곳이나 드신 음식을 한 글자씩 또박또박 적어 내려갑니다.
                  </p>
                </div>
              </button>

              {/* Voice Option */}
              <button
                onClick={() => setAnswerType("voice")}
                className="flex items-start gap-4 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left cursor-pointer active:scale-98 shadow-sm"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mic size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-foreground">음성으로 적기 (말씀으로 기록)</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    마이크에 오늘 하루 이야기를 도런도런 말씀해 주시면 글씨로 옮깁니다.
                  </p>
                </div>
              </button>

              {/* Photo Option */}
              <button
                onClick={() => {
                  setAnswerType("ocr");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left cursor-pointer active:scale-98 shadow-sm"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-amber-500 shrink-0">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-foreground">오늘의 음식/풍경 사진 올리기</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    오늘 드신 음식이나 산책길에 찍은 풍경 사진을 올려 기록합니다.
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full text-left">
              {/* Back to selection button */}
              <button
                onClick={() => {
                  setAnswerType(null);
                  setIsRecording(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-serif cursor-pointer w-fit"
              >
                <RotateCcw size={12} />
                다른 방식으로 다시 선택하기
              </button>

              {/* Text Input Mode */}
              {answerType === "text" && (
                <div className="flex flex-col gap-4">
                  <TextArea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    label="소소한 일상 일기 직접 입력"
                    placeholder="예) 오늘 점심으로 따뜻한 된장찌개를 맛있게 먹었다. 오후에는 햇살을 받으며 동네 산책길을 걸었다."
                    className="min-h-[160px] text-base"
                  />
                </div>
              )}

              {/* Voice Input Mode */}
              {answerType === "voice" && (
                <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mic size={28} className={isRecording ? "animate-pulse text-red-500" : ""} />
                  </div>
                  <p className="text-sm font-serif font-bold">
                    {isRecording ? "말씀을 듣고 글씨로 옮기는 중입니다..." : "버튼을 누르고 오늘 하루 이야기를 편안히 말씀해 주세요."}
                  </p>
                  <Button
                    variant={isRecording ? "secondary" : "primary"}
                    onClick={toggleRecording}
                    className="w-full py-3"
                  >
                    {isRecording ? "녹음 마침 (완료)" : "🎙️ 음성 녹음 시작하기"}
                  </Button>

                  {voiceText && (
                    <div className="w-full p-4 rounded-xl bg-muted/30 border border-border text-left text-sm font-serif leading-relaxed">
                      &ldquo;{voiceText}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* Photo Input Mode */}
              {answerType === "ocr" && (
                <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center gap-4 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {!photoPreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-primary/40 rounded-2xl hover:border-primary transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/10"
                    >
                      <ImageIcon size={32} className="text-primary" />
                      <span className="text-sm font-serif font-bold">오늘의 풍경/음식 사진 선택하기</span>
                    </button>
                  ) : (
                    <div className="relative w-full rounded-xl overflow-hidden border border-border">
                      <img src={photoPreview} alt="Uploaded photo" className="max-h-60 object-cover w-full" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Success Message */}
              {savedSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check size={16} />
                  <span>오늘의 일기가 서첩에 고이 보관되었습니다! 홈으로 이동합니다...</span>
                </div>
              )}

              {/* Submit Button */}
              <Button variant="primary" onClick={handleSubmit} disabled={loading} className="w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <RefreshCw size={16} className="animate-spin" /> 서첩에 보관하는 중...
                  </span>
                ) : (
                  "서첩에 보관하기 ✦"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
