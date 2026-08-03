"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBUser, DBQuestionHistory } from "@/services/supabase-service";
import { upstageService } from "@/services/upstage-service";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { questionGeneratorAgent } from "@/lib/agents/question-generator-agent";
import { ArrowLeft, Mic, MicOff, Image as ImageIcon, X, RefreshCw, Check, Keyboard, Sparkles, RotateCcw, Edit3 } from "lucide-react";

export default function CustomTopicPage() {
  const router = useRouter();
  const [user, setUser] = useState<DBUser | null>(null);
  const [inputType, setInputType] = useState<"text" | "voice" | "ocr" | null>(null);

  const [textHint, setTextHint] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [hasProposedToday, setHasProposedToday] = useState(false);
  const [todayProposedQuestion, setTodayProposedQuestion] = useState<string | null>(null);
  const [todayProposedQObj, setTodayProposedQObj] = useState<DBQuestionHistory | null>(null);
  const [isEditingProposed, setIsEditingProposed] = useState(false);
  const [editedQuestionText, setEditedQuestionText] = useState("");

  useEffect(() => {
    async function initUser() {
      const currUser = await supabaseService.getCurrentUser();
      if (currUser && currUser.role === "self") {
        // Topic proposal is exclusive to guardians
        router.replace("/home");
        return;
      }
      setUser(currUser);

      // Check if a custom topic was already proposed today
      const elderlyId = currUser?.role === "self" ? currUser.id : currUser?.paired_user_id || "user-elderly-123";
      const customProposed = await supabaseService.getCustomProposedQuestions(elderlyId);
      const todayStr = new Date().toISOString().substring(0, 10);
      const todayQ = customProposed.find((q) => {
        const dateStr = new Date(q.created_at).toISOString().substring(0, 10);
        return dateStr === todayStr;
      });

      if (todayQ) {
        // Daily restriction temporarily disabled per user request
        // setHasProposedToday(true);
        setTodayProposedQuestion(todayQ.question_text);
        setTodayProposedQObj(todayQ);
        setEditedQuestionText(todayQ.question_text);
      }
    }
    initUser();
  }, [router]);

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

  // Image File selection — convert to base64 DataURL immediately so it persists across page navigations
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setOcrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Save edited custom question handler
  const handleSaveEditedQuestion = async () => {
    if (!editedQuestionText.trim()) {
      setError("질문 문구를 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const elderlyId = user?.role === "self" ? user.id : user?.paired_user_id || "user-elderly-123";
      const qId = todayProposedQObj?.id || `q-custom-${Date.now()}`;
      const role = user?.role || "guardian";

      const updatedQ: DBQuestionHistory = {
        id: qId,
        user_id: elderlyId,
        question_text: editedQuestionText.trim(),
        created_at: todayProposedQObj?.created_at || new Date().toISOString(),
        status: todayProposedQObj?.status || "pending",
        shared: true,
        created_by: role,
        custom_image_url: todayProposedQObj?.custom_image_url,
      };

      await supabaseService.saveCustomProposedQuestion(updatedQ);

      setTodayProposedQuestion(editedQuestionText.trim());
      setTodayProposedQObj(updatedQ);
      setIsEditingProposed(false);
      router.push("/home");
    } catch (err: any) {
      console.error("Error updating custom topic question:", err);
      setError(err.message || "질문 문구 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    // Daily 1-per-day restriction temporarily disabled per user request
    // if (hasProposedToday) {
    //   setError("대화 주제 제안은 하루에 1회만 가능합니다.");
    //   return;
    // }

    let rawInputText = "";
    if (inputType === "text") rawInputText = textHint;
    if (inputType === "voice") rawInputText = voiceText;

    if (inputType !== "ocr" && !rawInputText.trim()) {
      setError("추억 힌트나 이야기를 입력해 주세요.");
      return;
    }
    if (inputType === "ocr" && !ocrFile) {
      setError("스캔할 옛 사진이나 편지 이미지를 선택해 주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = user?.id || "user-elderly-123";
      const role = user?.role || "self";
      let extractedEntities: any[] = [];
      let photoContextStr = "";

      if (inputType === "ocr" && ocrFile) {
        setLoadingMsg("옛 사진 속 글씨와 맥락을 파악하고 있어요...");
        let ocrText = "";
        try {
          const formData = new FormData();
          formData.append("file", ocrFile);
          const ocrRes = await fetch("/api/ocr", {
            method: "POST",
            body: formData,
          });
          const ocrJson = await ocrRes.json();
          if (ocrJson.success && ocrJson.data?.text) {
            ocrText = ocrJson.data.text.trim();
            if (Array.isArray(ocrJson.data.entities)) {
              extractedEntities = ocrJson.data.entities;
            }
          }
        } catch (e) {
          console.error("OCR API error:", e);
        }

        // Combine photo description with OCR text if both exist
        const descText = photoDescription.trim();
        if (descText && ocrText) {
          photoContextStr = `[사진 설명] ${descText}\n[지면 글씨] ${ocrText}`;
        } else if (descText) {
          photoContextStr = `[사진 설명] ${descText}`;
        } else if (ocrText) {
          photoContextStr = ocrText;
        } else {
          photoContextStr = "옛 앨범 사진 및 편지 스캔본 기록";
        }

        rawInputText = photoContextStr;
      }

      setLoadingMsg("제시해주신 상황 및 사진 맥락을 바탕으로 부가설명 없는 회상 질문을 다듬고 있어요...");
      
      let generatedQText = "";
      let isShared = role === "guardian";

      try {
        const customRes = await fetch("/api/questions/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            textHint: rawInputText,
            creatorRole: role,
          }),
        });
        const customJson = await customRes.json();
        if (customJson.success && customJson.qtext) {
          generatedQText = customJson.qtext;
          isShared = customJson.shared ?? isShared;
        }
      } catch (e) {
        console.error("API /api/questions/custom error:", e);
      }

      if (!generatedQText) {
        const generated = await questionGeneratorAgent.generateCustomTopicQuestion(
          rawInputText,
          extractedEntities,
          role
        );
        generatedQText = generated.question;
      }

      const elderlyId = user?.role === "self" ? userId : user?.paired_user_id || "user-elderly-123";
      const qId = `q-custom-${Date.now()}`;

      // ocrPreview is already a base64 DataURL (set during handleFileChange)
      // Use it directly regardless of inputType — image is optional for all input modes
      const customImgDataUrl: string | undefined = ocrPreview || undefined;

      // Save custom question as a NEW item to custom_proposed_questions table with status "pending"
      await supabaseService.saveCustomProposedQuestion({
        id: qId,
        user_id: elderlyId,
        question_text: generatedQText,
        created_at: new Date().toISOString(),
        status: "pending",
        shared: isShared,
        created_by: role,
        custom_image_url: customImgDataUrl,
      });

      router.push("/home");
    } catch (err: any) {
      console.error("Error creating custom topic:", err);
      setError(err.message || "주제 질문 생성 중 오류가 발생했습니다.");
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
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm font-serif"
        >
          <ArrowLeft size={16} />
          서랍으로
        </button>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <span className="text-muted-foreground font-serif text-xs block select-none">
            추억 주제 제안
          </span>
        </div>
      </header>

      {/* Main Interface - Unified with /journal */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-between gap-6">
        {/* Hero Topic Banner */}
        <div className="p-7 sm:p-8 rounded-3xl hero-remembrance-card text-left select-text relative flex flex-col gap-3">
          <div className="stamp-badge w-fit">
            <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
            <span>어르신 맞춤 대화 주제 (보호자 전용)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-950 dark:text-amber-100 leading-relaxed tracking-tight">
            &ldquo;간직해둔 이야기나 사진을 올려주시면 다정한 질문으로 다듬어 드립니다.&rdquo;
          </h2>
        </div>

        {/* Input Selector or Input Area */}
        <div className="flex-1 flex flex-col justify-center">
          {hasProposedToday && !isEditingProposed ? (
            <div className="p-7 rounded-3xl bg-amber-100/90 dark:bg-amber-950/50 border-2 border-amber-300/90 dark:border-amber-700/60 flex flex-col gap-4 text-left shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-serif font-bold border border-amber-400/40">
                  <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                  오늘의 대화 주제 제안 완료
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-serif font-bold">1/1회 완료</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold text-amber-950 dark:text-amber-100 leading-relaxed select-text">
                  &ldquo;{todayProposedQuestion}&rdquo;
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 font-serif leading-normal mt-1">
                  제안하신 주제는 어르신 홈 화면에 표시되며, 언제든 문구를 수정할 수 있습니다.
                </p>
              </div>

              {error && <p className="text-xs text-red-500 font-serif">{error}</p>}

              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProposed(true);
                    setEditedQuestionText(todayProposedQuestion || "");
                  }}
                  className="w-full py-2.5 px-4 text-xs font-serif font-bold bg-amber-500/20 text-amber-950 dark:text-amber-100 hover:bg-amber-500/30 rounded-xl border border-amber-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={14} /> 제안한 질문 문구 수정하기
                </button>

                <button
                  type="button"
                  onClick={() => setHasProposedToday(false)}
                  className="w-full py-2.5 px-4 text-xs font-serif font-bold text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} /> 새로운 힌트로 다시 제안하기
                </button>

                <Button variant="primary" onClick={() => router.push("/home")} className="w-full py-3 text-sm mt-1">
                  서랍 홈으로 돌아가기
                </Button>
              </div>
            </div>
          ) : isEditingProposed ? (
            <div className="p-7 rounded-3xl bg-background border-2 border-primary/30 flex flex-col gap-4 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-serif font-bold border border-primary/20">
                  <Edit3 size={13} />
                  제안 질문 문구 수정
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingProposed(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-serif cursor-pointer"
                >
                  취소
                </button>
              </div>

              <TextArea
                value={editedQuestionText}
                onChange={(e) => setEditedQuestionText(e.target.value)}
                label="어르신께 제시할 대화 질문 다듬기"
                placeholder="예) 어머니, 1978년 마당에서 키우던 바둑이와의 추억이 생각나시나요?"
                className="min-h-[140px] text-base"
              />

              {error && <p className="text-xs text-red-500 font-serif">{error}</p>}

              <div className="flex items-center gap-2 mt-2">
                <Button variant="secondary" onClick={() => setIsEditingProposed(false)} className="w-1/3 py-3 text-sm">
                  취소
                </Button>
                <Button variant="primary" onClick={handleSaveEditedQuestion} disabled={loading} className="w-2/3 py-3 text-sm">
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : "수정 완료 및 저장"}
                </Button>
              </div>
            </div>
          ) : !inputType ? (
            <div className="flex flex-col gap-4 w-full">
              <h3 className="text-base font-serif font-bold text-muted-foreground text-left mb-1 select-none">
                추억 주제를 제안할 방식을 선택해 주세요
              </h3>

              {/* 2-Column Grid for Input Options */}
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                {/* Text Option Tile */}
                <div
                  onClick={() => setInputType("text")}
                  className="tile-card p-5 flex flex-col justify-between gap-4 cursor-pointer group text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      단어 / 키워드
                    </span>
                    <Keyboard size={20} className="text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                      키보드로 쓰기
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 font-sans leading-relaxed">
                      장소, 인물 단어 입력
                    </p>
                  </div>
                  <span className="text-xs font-serif font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    선택하기 &rarr;
                  </span>
                </div>

                {/* Voice Option Tile */}
                <div
                  onClick={() => setInputType("voice")}
                  className="tile-card p-5 flex flex-col justify-between gap-4 cursor-pointer group text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      말씀 힌트
                    </span>
                    <Mic size={20} className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                      음성으로 말하기
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 font-sans leading-relaxed">
                      이야기를 말씀으로 소리내기
                    </p>
                  </div>
                  <span className="text-xs font-serif font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    선택하기 &rarr;
                  </span>
                </div>

                {/* Photo Option Tile - Span 2 columns */}
                <div
                  onClick={() => {
                    setInputType("ocr");
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="col-span-2 tile-card p-5 flex items-center justify-between cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                        옛 앨범 사진 / 편지 스캔하여 올리기
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-sans leading-relaxed">
                        흑백 사진이나 편지글을 스캔하여 맞춤 질문을 추출합니다.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-serif font-bold text-primary group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full text-left">
              {/* Back to selection button */}
              <button
                onClick={() => {
                  setInputType(null);
                  setIsRecording(false);
                  setPhotoDescription("");
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-serif cursor-pointer w-fit"
              >
                <RotateCcw size={12} />
                다른 방식으로 다시 선택하기
              </button>

              {/* Text Input Mode */}
              {inputType === "text" && (
                <div className="flex flex-col gap-4">
                  <TextArea
                    value={textHint}
                    onChange={(e) => setTextHint(e.target.value)}
                    label="추억 단어/이야기 힌트 입력"
                    placeholder="예) 1978년 가을 마당에서 키우던 바둑이 이야기, 혹은 초등학교 입학식 소풍날"
                    className="min-h-[160px] text-base"
                  />
                </div>
              )}

              {/* Voice Input Mode */}
              {inputType === "voice" && (
                <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mic size={28} className={isRecording ? "animate-pulse text-red-500" : ""} />
                  </div>
                  <p className="text-sm font-serif font-bold">
                    {isRecording ? "말씀을 듣고 힌트로 다듬는 중입니다..." : "버튼을 누르고 추억 힌트를 편안히 말씀해 주세요."}
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
              {inputType === "ocr" && (
                <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center gap-4 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!ocrPreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-primary/40 rounded-2xl hover:border-primary transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/10"
                    >
                      <ImageIcon size={32} className="text-amber-500" />
                      <span className="text-sm font-serif font-bold">옛 앨범 사진/편지 선택하기</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4 w-full text-left">
                      <div className="relative w-full rounded-xl overflow-hidden border border-border">
                        <img src={ocrPreview} alt="Uploaded photo" className="max-h-60 object-cover w-full" />
                        <button
                          type="button"
                          onClick={() => {
                            setOcrFile(null);
                            setOcrPreview(null);
                            setPhotoDescription("");
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Optional Photo Description Text Input */}
                      <TextArea
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        label="사진 설명 / 추억 메모 덧붙이기 (선택)"
                        placeholder="예) 1975년 가을 남한산성 소풍날, 당시 친했던 동창들과 찍은 사진입니다."
                        className="min-h-[100px] text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 font-serif">{error}</p>
              )}

              {/* Submit Button */}
              <Button variant="primary" onClick={handleSubmit} disabled={loading} className="w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <RefreshCw size={16} className="animate-spin" /> {loadingMsg || "질문으로 다듬는 중..."}
                  </span>
                ) : (
                  "회상 질문 만들기 ✦"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
