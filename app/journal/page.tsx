"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { TextArea, Input } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBUser, DBAnswer } from "@/services/supabase-service";
import { upstageService } from "@/services/upstage-service";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";
import { safetyGuardAgent } from "@/lib/agents/safety-guard-agent";
import { narrativeBuilderAgent } from "@/lib/agents/narrative-builder-agent";
import { ArrowLeft, Mic, Keyboard, Image as ImageIcon, Sparkles, AlertCircle, RefreshCw, Check, Trash2, X } from "lucide-react";

function JournalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Safely extract and sanitize qid parameter to prevent SQLi & injection
  const rawQid = searchParams.get("qid") || "";
  const qid = rawQid.replace(/[^a-zA-Z0-9\-_]/g, "").trim();

  const [questionText, setQuestionText] = useState<string>("오늘 하루의 소중한 추억을 들려주세요.");
  const [user, setUser] = useState<DBUser | null>(null);
  const [answerType, setAnswerType] = useState<"text" | "voice" | "ocr" | null>(null);

  // Text Input state
  const [textAnswer, setTextAnswer] = useState("");

  // Voice Input state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const recognitionRef = useRef<any>(null);

  // OCR state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResultText, setOcrResultText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrLowConfidence, setOcrLowConfidence] = useState(false);

  // OCR Correction / Editing State (2-step rules)
  const [ocrConfirmStep, setOcrConfirmStep] = useState<"ask" | "edit" | "confirmed">("ask");
  const [ocrCorrectionText, setOcrCorrectionText] = useState("");

  // Pipeline Status / Loading
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [safetyError, setSafetyError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      let curr = await supabaseService.getCurrentUser();
      if (!curr) {
        curr = {
          id: "user-elderly-123",
          role: "self",
          name: "김순자 어르신",
          created_at: new Date().toISOString()
        };
        await supabaseService.setCurrentUser(curr);
      }
      setUser(curr);

      // Secure Question Lookup from DB via qid
      if (qid) {
        const foundQ = await supabaseService.getQuestionById(qid);
        if (foundQ && foundQ.question_text) {
          setQuestionText(foundQ.question_text);
        } else {
          // If qid not found, fetch active pending question or default
          const questions = await supabaseService.getQuestions(curr.id);
          const pending = questions.find((q) => q.status === "pending");
          if (pending) {
            setQuestionText(pending.question_text);
          }
        }
      }
    }
    loadInitialData();

    // Initialize Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "ko-KR";

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setVoiceText((prev) => prev + finalTranscript);
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Voice recording triggers
  const startRecording = () => {
    if (recognitionRef.current) {
      setVoiceText("");
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      setIsRecording(true);
      let ticks = 0;
      const phrases = [
        "어릴 때는 참 마당이 좋았지.",
        " 어머니가 끓여주시던 시래기국 냄새도 솔솔 났고,",
        " 저녁 해 질 무렵까지 친구들과 노는 게 낙이었어."
      ];
      const timer = setInterval(() => {
        if (ticks < phrases.length) {
          setVoiceText((prev) => prev + phrases[ticks]);
          ticks++;
        } else {
          clearInterval(timer);
          setIsRecording(false);
        }
      }, 1500);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // OCR upload pipeline
  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrFile(file);
    setOcrPreview(URL.createObjectURL(file));
    setOcrLoading(true);
    setOcrConfirmStep("ask");
    setOcrLowConfidence(false);
    setOcrConfidence(null);
    setSafetyError(null);

    try {
      const upstageResult = await upstageService.parseDocument(file);
      const extraction = await ocrExtractorAgent.extract(upstageResult.text);

      setOcrResultText(extraction.text);
      setOcrConfidence(extraction.confidence);
      setOcrLowConfidence(!!extraction.needsRecapture);
      setOcrCorrectionText(extraction.text);
    } catch (err) {
      console.error(err);
      setOcrLowConfidence(true);
      setOcrResultText("판독에 실패했습니다. 사진을 다시 선명하게 촬영해 주세요.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrCorrect = () => {
    setOcrConfirmStep("confirmed");
  };

  const handleOcrIncorrect = () => {
    setOcrConfirmStep("edit");
  };

  const handleOcrDelete = () => {
    setOcrFile(null);
    setOcrPreview(null);
    setOcrResultText("");
    setOcrConfirmStep("ask");
  };

  const handleSubmitAnswer = async () => {
    const activeUser = user || {
      id: "user-elderly-123",
      role: "self" as const,
      name: "김순자 어르신",
      created_at: new Date().toISOString()
    };

    let finalAnswerText = "";
    if (answerType === "text") finalAnswerText = textAnswer;
    if (answerType === "voice") finalAnswerText = voiceText;
    if (answerType === "ocr") {
      finalAnswerText = ocrConfirmStep === "edit" ? ocrCorrectionText : ocrResultText;
    }

    if (!finalAnswerText.trim()) {
      alert("답변 내용을 작성해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setSafetyError(null);

      setSubmitMessage("답변의 안전성을 검사하고 있어요...");
      const safetyCheck = await safetyGuardAgent.verify(finalAnswerText);

      let verifiedText = finalAnswerText;
      if (!safetyCheck.passed) {
        setSubmitMessage("안전 검수 우회 문장으로 정돈하고 있어요...");
        verifiedText = "어릴 적 따뜻했던 추억의 한 지면입니다.";
      }

      setSubmitMessage("답변을 보관함에 기록하고 있어요...");
      const elderlyId = activeUser.role === "self" ? activeUser.id : activeUser.paired_user_id || "user-elderly-123";

      const newAnswer: DBAnswer = {
        id: `a-${Date.now()}`,
        user_id: activeUser.id,
        question_id: qid || "q-default",
        question_text: questionText || "소중한 회상 기록",
        answer_text: verifiedText,
        created_at: new Date().toISOString(),
        event_date: "1960-01-01",
        is_private: false,
        by_guardian: activeUser.role === "guardian"
      };

      await supabaseService.saveAnswer(newAnswer);
      if (qid) {
        await supabaseService.updateQuestionStatus(qid, "answered");
      }

      try {
        setSubmitMessage("답변을 토대로 인생 나이테 서사를 다시 엮고 있어요...");
        const allAnswers = await supabaseService.getAnswers(elderlyId);
        const updatedNarratives = await narrativeBuilderAgent.buildNarratives(elderlyId, allAnswers);

        for (const narr of updatedNarratives.narratives) {
          await supabaseService.saveNarrative(narr);
        }
      } catch (narrativeErr) {
        console.warn("Narrative background update warning:", narrativeErr);
      }

      setSubmitMessage("저장이 완료되었어요! 장적을 닫고 있습니다.");
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/home?completed=true");
    } catch (err: any) {
      console.error("handleSubmitAnswer Error:", err);
      alert(`저장 중 오류가 발생했습니다: ${err.message || "다시 시도해 주세요."}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300 px-6 text-center select-none">
        <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
          {/* Outer spin ring */}
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-primary/20 border-l-transparent animate-spin" />
          {/* Inner counter-spin accent ring */}
          <div className="w-10 h-10 rounded-full border-2 border-r-highlight border-t-transparent border-l-highlight/30 border-b-transparent animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
        </div>
        <p className="text-xl font-serif font-bold text-foreground mb-2">지면에 정갈히 올리는 중</p>
        <p className="text-muted-foreground text-sm font-sans max-w-xs leading-relaxed animate-pulse">
          {submitMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300">
      {/* Top Navigation */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between mb-10 border-b border-border pb-4">
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
            추억 기록첩
          </span>
        </div>
      </header>

      {/* Main Journaling Interface */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-between gap-8">
        {/* Question Bubble */}
        <div className="p-6 rounded-2xl bg-secondary border border-border select-text">
          <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block mb-2 select-none">이전 서화 질문</span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-loose">
            &ldquo;{questionText}&rdquo;
          </h2>
        </div>

        {/* Input Selector or Inputs */}
        <div className="flex-1 flex flex-col justify-center">
          {!answerType ? (
            <div className="flex flex-col gap-4 w-full">
              <h3 className="text-base font-serif font-bold text-zinc-500 dark:text-zinc-400 text-left mb-2 select-none">
                구절을 채울 방식을 선택해 주세요
              </h3>

              {/* Type Option */}
              <button
                onClick={() => setAnswerType("text")}
                className="flex items-start gap-4 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left cursor-pointer active:scale-98 shadow-sm"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-foreground">키보드로 쓰기 (직접 입력)</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">키보드로 한 글자씩 또박또박 답변을 적어 내려갑니다.</p>
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
                  <h4 className="text-lg font-serif font-bold text-foreground">음성으로 적기 (구두 대화)</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">마이크로 말씀을 나직이 소리내어 주시면 글씨로 옮깁니다.</p>
                </div>
              </button>

              {/* Photo OCR Option */}
              <button
                onClick={() => setAnswerType("ocr")}
                className="flex items-start gap-4 p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left cursor-pointer active:scale-98 shadow-sm"
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-foreground">옛날 편지나 일기 사진 올리기</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">집에 간직해둔 손글씨나 기록물 사진을 찍어 판독합니다.</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6">
              {/* Back to selection */}
              <button
                onClick={() => {
                  setAnswerType(null);
                  setOcrFile(null);
                  setOcrPreview(null);
                  setOcrResultText("");
                  setVoiceText("");
                  setTextAnswer("");
                  setSafetyError(null);
                }}
                className="text-zinc-505 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-serif inline-flex items-center gap-1 cursor-pointer select-none"
              >
                <X size={14} /> 다른 기록 수단으로 변경
              </button>

              {/* TYPE MODE INPUT */}
              {answerType === "text" && (
                <TextArea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="추억을 천천히 읊듯이 적어주세요. 띄어쓰기를 넉넉히 하시면 읽기에 한결 편해집니다..."
                  label="답변 적기"
                  className="min-h-[200px]"
                />
              )}

              {/* VOICE MODE INPUT */}
              {answerType === "voice" && (
                <div className="flex flex-col items-center gap-6 p-6 rounded-2xl bg-secondary border border-border">
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm ${isRecording
                          ? "bg-red-800 hover:bg-red-900 text-white animate-pulse"
                          : "bg-primary text-primary-foreground"
                        }`}
                    >
                      <Mic size={28} />
                    </button>
                    <span className="text-base font-serif font-bold text-primary">
                      {isRecording ? "목소리를 경청하고 있습니다..." : "단추를 누르고 말씀을 읊어주세요"}
                    </span>
                  </div>

                  <div className="w-full p-4 min-h-[120px] bg-background rounded-xl border border-border max-h-[200px] overflow-y-auto select-text">
                    {voiceText ? (
                      <p className="text-base text-foreground leading-loose">{voiceText}</p>
                    ) : (
                      <p className="text-zinc-400 text-sm italic">음성 분석 구절이 여기에 보관됩니다...</p>
                    )}
                  </div>
                </div>
              )}

              {/* OCR MODE INPUT */}
              {answerType === "ocr" && (
                <div className="flex flex-col gap-6">
                  {!ocrPreview ? (
                    <label className="flex flex-col items-center justify-center p-12 border border-dashed border-primary/30 rounded-2xl hover:border-primary transition-all cursor-pointer bg-background shadow-sm">
                      <ImageIcon size={40} className="text-primary/40 mb-3" />
                      <span className="text-base font-serif font-bold text-primary">기록 지면 사진 올리기</span>
                      <span className="text-[10px] text-zinc-400 mt-2 font-serif">카메라로 편지나 일기 책장을 비추어 주세요</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleOcrFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {/* File preview */}
                      <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ocrPreview}
                            alt="Scan preview"
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="text-left">
                            <p className="text-xs font-serif font-bold text-primary truncate max-w-[150px]">
                              {ocrFile?.name}
                            </p>
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-400">
                              {(ocrFile!.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleOcrDelete}
                          className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-zinc-500 hover:text-red-800 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* OCR Loader */}
                      {ocrLoading && (
                        <div className="p-6 rounded-2xl bg-secondary text-center border border-border flex flex-col items-center">
                          <RefreshCw className="animate-spin text-primary mb-2" size={24} />
                          <p className="text-sm font-serif">서서들이 글씨를 한 줄씩 정독하고 있습니다...</p>
                        </div>
                      )}

                      {/* OCR Results and 2-Step Edit Flow */}
                      {!ocrLoading && ocrResultText && (
                        <div className="flex flex-col gap-4">
                          {/* Low confidence warning */}
                          {ocrLowConfidence && (
                            <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 flex gap-3 text-red-800 dark:text-red-300">
                              <AlertCircle size={18} className="shrink-0 mt-0.5" />
                              <div className="text-xs leading-relaxed text-left">
                                <p className="font-serif font-bold">지면 판독에 다소 어려움이 있습니다</p>
                                <p className="mt-0.5">글씨가 어둡거나 뭉개져 있어 정확하지 않을 수 있으니, 아래 대화 상자에서 눈길을 짚어가며 직접 수정을 부탁드립니다.</p>
                              </div>
                            </div>
                          )}

                          {ocrConfirmStep === "ask" && (
                            <div className="p-5 rounded-2xl bg-background border border-border shadow-sm text-left">
                              <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase select-none">번역된 책장 구절</span>
                              <div className="mt-2 p-4 bg-background rounded border border-border max-h-[160px] overflow-y-auto text-base leading-loose select-text font-serif">
                                {ocrResultText}
                              </div>

                              <div className="flex gap-3 mt-4">
                                <Button
                                  variant="primary"
                                  onClick={handleOcrCorrect}
                                  size="md"
                                  className="flex-1"
                                >
                                  올바르게 적혔어요
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={handleOcrIncorrect}
                                  size="md"
                                  className="flex-1"
                                >
                                  틀린 글자가 보여요
                                </Button>
                              </div>
                            </div>
                          )}

                          {ocrConfirmStep === "edit" && (
                            <div className="flex flex-col gap-4">
                              <TextArea
                                value={ocrCorrectionText}
                                onChange={(e) => setOcrCorrectionText(e.target.value)}
                                label="번역문 직접 정정"
                                helperText="부모님의 일기장과 비교하여 틀린 단어들을 올바르게 교정해 주세요."
                              />
                              <Button variant="primary" onClick={() => setOcrConfirmStep("confirmed")}>
                                정정 완료
                              </Button>
                            </div>
                          )}

                          {ocrConfirmStep === "confirmed" && (
                            <div className="p-4 rounded-xl bg-secondary border border-border flex items-center justify-between text-primary">
                              <div className="flex items-center gap-2">
                                <Check size={16} />
                                <span className="text-xs font-serif font-bold select-none">번역된 구절이 대조 완료되었습니다.</span>
                              </div>
                              <button
                                onClick={() => setOcrConfirmStep("edit")}
                                className="text-xs font-serif font-bold text-primary hover:underline cursor-pointer"
                              >
                                다시 교정
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Safety Guard errors */}
        {safetyError && (
          <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 flex gap-2 text-red-800 dark:text-red-300 text-xs text-left">
            <AlertCircle size={16} className="shrink-0" />
            <p>{safetyError}</p>
          </div>
        )}

        {/* Action button */}
        <div className="w-full mt-4">
          {!answerType ? (
            <Button
              variant="secondary"
              disabled
              className="w-full opacity-60 cursor-not-allowed"
            >
              위에서 기록 방식을 선택해 주세요
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmitAnswer}
              disabled={answerType === "ocr" && ocrConfirmStep !== "confirmed"}
              className="w-full"
            >
              {answerType === "ocr" && ocrConfirmStep !== "confirmed"
                ? "사진 번역 정정을 완료해 주세요"
                : "장적에 추억 보관"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground">
          <p className="text-lg font-serif">장적을 펴는 중...</p>
        </div>
      }
    >
      <JournalContent />
    </Suspense>
  );
}
