"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBUser } from "@/services/supabase-service";
import { ArrowLeft, ArrowRight, Check, Scan, Sparkles, User, Users } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "self"; // 'self' or 'guardian'

  // Stepper State
  const [step, setStep] = useState(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState(""); // User only
  const [phone, setPhone] = useState(""); // Guardian only

  // Accessibility
  const [textSize, setTextSize] = useState<"small" | "medium" | "large" | "xl">("medium");
  const [colorVision, setColorVision] = useState<"default" | "daltonism" | "tritanopia" | "contrast">("default");

  // Step 3 (User: AI Settings / Guardian: Link to User)
  const [questionFrequency, setQuestionFrequency] = useState<"once" | "twice" | "three" | "custom">("once");
  const [linkMethod, setLinkMethod] = useState<"code" | "qr">("code");
  const [userCode, setUserCode] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [pairedUserName, setPairedUserName] = useState<string | null>(null);

  // Step 4 (User: App Purpose / Guardian: Shared AI Settings)
  const [appPurpose, setAppPurpose] = useState("Memory Recording");
  const [sharedQuestionFrequency, setSharedQuestionFrequency] = useState<"once" | "twice" | "three" | "custom">("once");

  // Apply changes immediately for live preview
  useEffect(() => {
    // Save a temp user representation to let ThemeProvider dynamically update classes
    const tempUser: Partial<DBUser> = {
      role: role as any,
      name: name || "가입자",
      textSize,
      colorVision,
    };
    localStorage.setItem("eeum_mock_curr_user", JSON.stringify(tempUser));
    window.dispatchEvent(new Event("eeum_user_changed"));
  }, [textSize, colorVision, name, role]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        alert("모든 필수 항목을 입력해 주세요.");
        return;
      }
      if (role === "self" && !dob) {
        alert("생년월일을 입력해 주세요.");
        return;
      }
      if (role === "guardian" && !phone) {
        alert("휴대폰 번호를 입력해 주세요.");
        return;
      }
    }

    if (step === 3 && role === "guardian") {
      if (linkMethod === "code" && !userCode.trim()) {
        alert("연결할 어르신의 6자리 코드를 입력해 주세요.");
        return;
      }
      if (linkMethod === "code" && userCode.trim() !== "UM-709") {
        alert("존재하지 않는 코드입니다. 테스트 코드 'UM-709'를 입력해 주세요.");
        return;
      }
      if (linkMethod === "code") {
        setPairedUserName("김순자 어르신");
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  // Scan QR Code mock
  const handleMockQrScan = () => {
    setQrScanning(true);
    setTimeout(() => {
      setUserCode("UM-709");
      setPairedUserName("김순자 어르신");
      setQrScanning(false);
      setLinkMethod("code");
      alert("QR 코드 분석 완료: '김순자 어르신 (UM-709)' 계정이 감지되었습니다.");
    }, 1500);
  };

  const handleRegisterComplete = async () => {
    try {
      const generatedId = role === "self" ? `user-elderly-${Date.now()}` : `user-guardian-${Date.now()}`;
      
      const newUser: DBUser = {
        id: generatedId,
        role: role as "self" | "guardian",
        name: name,
        email: email,
        password: password,
        dob: role === "self" ? dob : undefined,
        phone: role === "guardian" ? phone : undefined,
        userCode: role === "self" ? `UM-${Math.floor(100 + Math.random() * 900)}` : undefined,
        paired_user_id: role === "guardian" ? "user-elderly-123" : undefined, // Links to seeded user for demo
        textSize,
        colorVision,
        questionFrequency: role === "self" ? questionFrequency : sharedQuestionFrequency,
        appPurpose: role === "self" ? appPurpose : undefined,
        created_at: new Date().toISOString(),
      };

      await supabaseService.setCurrentUser(newUser);
      router.push("/home");
    } catch (err) {
      console.error(err);
      alert("회원가입 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-between min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300">
      {/* Background grids */}
      <div className="absolute top-0 left-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />
      <div className="absolute top-0 right-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />

      {/* Header Navigation */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pb-4 border-b border-border z-10">
        <button
          onClick={() => {
            if (step > 1) handlePrevStep();
            else router.push("/role-selection");
          }}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-sm font-serif"
        >
          <ArrowLeft size={16} />
          {step > 1 ? "이전 단계" : "돌아가기"}
        </button>
        
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <span className="text-zinc-400 font-serif text-xs">
            {role === "self" ? "어르신 가입" : "보호자 가입"} ({step}/4 단계)
          </span>
        </div>
      </header>

      {/* Main Registration Steps Panel */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center my-8 z-10">
        <div className="p-8 rounded-2xl bg-secondary border border-border shadow-sm text-left">
          
          {/* STEP 1: 기본 정보 입력 (Both) */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase mb-1.5">기본 신조</span>
                <h2 className="text-2xl font-serif font-bold text-primary">기본 정보를 알려주세요</h2>
                <p className="text-xs text-muted-foreground mt-1">서첩에 등록할 고유의 성함과 계정 열쇠(암호)를 입력합니다.</p>
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  label={role === "self" ? "성함 혹은 별칭" : "성함"}
                  placeholder={role === "self" ? "예: 김순자" : "예: 이지영"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="이메일 주소"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="비밀번호"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {role === "self" ? (
                  <Input
                    label="생년월일"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                ) : (
                  <Input
                    label="휴대폰 번호"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 2: 화면 맞춤 설정 (Both) */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase mb-1.5">접근성 봉사</span>
                <h2 className="text-2xl font-serif font-bold text-primary">화면을 읽기 편하게 맞춥니다</h2>
                <p className="text-xs text-muted-foreground mt-1">선택 즉시 화면의 글꼴 크기와 대조가 실시간으로 변경됩니다.</p>
              </div>

              {/* Text Sizing */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-serif font-bold text-primary">글씨 크기 선택</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["small", "medium", "large", "xl"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setTextSize(sz)}
                      className={`py-2 px-1 text-sm rounded-lg border text-center font-serif transition-all cursor-pointer ${
                        textSize === sz
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {sz === "small" && "작게 (S)"}
                      {sz === "medium" && "보통 (M)"}
                      {sz === "large" && "크게 (L)"}
                      {sz === "xl" && "매우 크게"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Vision Settings */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-serif font-bold text-primary">색각 지원 모드</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "default", label: "기본 색상 (백묵)" },
                    { key: "contrast", label: "흑백 고대비 (최고 가독)" },
                    { key: "daltonism", label: "적녹 색약 보정" },
                    { key: "tritanopia", label: "청황 색약 보정" }
                  ].map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setColorVision(v.key as any)}
                      className={`p-3 text-xs rounded-xl border text-left font-serif transition-all cursor-pointer ${
                        colorVision === v.key
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: User AI settings OR Guardian Linking */}
          {step === 3 && role === "self" && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase mb-1.5">인공지능 대화</span>
                <h2 className="text-2xl font-serif font-bold text-primary">하루 질문 횟수를 정합니다</h2>
                <p className="text-xs text-muted-foreground mt-1">인지 건강을 돕기 위해 인공지능이 보내는 질문 빈도를 설정합니다.</p>
              </div>

              <div className="flex flex-col gap-3">
                {(["once", "twice", "three", "custom"] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setQuestionFrequency(freq)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                      questionFrequency === freq
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <span className="font-serif">
                      {freq === "once" && "하루에 한 번 (추천)"}
                      {freq === "twice" && "하루에 두 번 (아침/저녁)"}
                      {freq === "three" && "하루에 세 번 (식후 대화)"}
                      {freq === "custom" && "맞춤 일정에 따라"}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        questionFrequency === freq ? "border-primary-foreground bg-primary-foreground text-primary" : "border-border"
                      }`}
                    >
                      {questionFrequency === freq && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && role === "guardian" && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase mb-1.5">가족 연결</span>
                <h2 className="text-2xl font-serif font-bold text-primary">어르신의 서랍에 연결합니다</h2>
                <p className="text-xs text-muted-foreground mt-1">기록을 공유할 어르신의 고유 계정 코드 또는 QR을 등록해 주세요.</p>
              </div>

              {/* Method tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setLinkMethod("code")}
                  className={`flex-1 pb-2.5 text-center font-serif text-sm border-b-2 transition-all cursor-pointer ${
                    linkMethod === "code" ? "border-primary font-bold text-primary" : "border-transparent text-zinc-400"
                  }`}
                >
                  기록코드 입력
                </button>
                <button
                  onClick={() => setLinkMethod("qr")}
                  className={`flex-1 pb-2.5 text-center font-serif text-sm border-b-2 transition-all cursor-pointer ${
                    linkMethod === "qr" ? "border-primary font-bold text-primary" : "border-transparent text-zinc-400"
                  }`}
                >
                  QR 코드 스캔
                </button>
              </div>

              {linkMethod === "code" ? (
                <div className="flex flex-col gap-4">
                  <Input
                    label="어르신 6자리 기록코드"
                    placeholder="예: UM-709"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                    helperText="테스트 연결용 코드인 'UM-709'를 입력하시면 즉시 가상 연결이 승인됩니다."
                  />
                  {pairedUserName && (
                    <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                      <span className="font-serif">확인된 부모님 계정: <strong>{pairedUserName}</strong></span>
                      <Check size={14} className="text-primary font-bold" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl border border-border text-center">
                  <div className="w-40 h-40 border border-primary/20 bg-secondary/50 rounded-lg flex flex-col items-center justify-center relative overflow-hidden select-none">
                    {qrScanning ? (
                      <div className="absolute inset-0 bg-primary/5 flex items-center justify-center animate-pulse">
                        <span className="text-xs font-serif text-primary">스캐너 구동 중...</span>
                      </div>
                    ) : (
                      <>
                        <Scan size={36} className="text-primary/30" />
                        <span className="text-[10px] text-zinc-400 font-serif mt-2">카메라 격자 영역</span>
                      </>
                    )}
                  </div>
                  <Button variant="secondary" onClick={handleMockQrScan} disabled={qrScanning} size="md" className="flex gap-2">
                    <Scan size={14} />
                    카메라로 스캔하기 (모의)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: User App Purpose OR Guardian Shared AI Settings */}
          {step === 4 && role === "self" && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase mb-1.5">서첩 용도</span>
                <h2 className="text-2xl font-serif font-bold text-primary">주로 어떤 이유로 사용하시나요?</h2>
                <p className="text-xs text-muted-foreground mt-1">알려주신 사유에 맞게 인공지능이 서화 질문의 논조를 부드럽게 조정합니다.</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { key: "Memory Recording", title: "옛 기록 보관", desc: "젊은 시절의 손글씨나 일기, 편지를 정갈히 디지털로 보관" },
                  { key: "Memory Recall", title: "기억 인지 자극", desc: "정답 없는 추억 질문들을 마주하며 차분한 인지 건강 유지" },
                  { key: "Family Sharing", title: "가족과의 대화", desc: "자녀들과 같은 일화에 대해 기억을 대조하고 담소 나누기" },
                  { key: "Daily Journaling", title: "매일의 일기 적기", desc: "거창한 과거 회상 없이 오늘 있었던 소박한 일들을 일기장에 기록" },
                  { key: "Other", title: "기타 용도", desc: "그 외 다양한 기억 모임 활동 활용" }
                ].map((purpose) => (
                  <button
                    key={purpose.key}
                    onClick={() => setAppPurpose(purpose.key)}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                      appPurpose === purpose.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        appPurpose === purpose.key ? "border-primary-foreground bg-primary-foreground text-primary" : "border-border"
                      }`}
                    >
                      {appPurpose === purpose.key && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold">{purpose.title}</h4>
                      <p className={`text-[10px] mt-0.5 leading-relaxed ${appPurpose === purpose.key ? "text-primary-foreground/75" : "text-zinc-550 dark:text-zinc-400"}`}>
                        {purpose.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && role === "guardian" && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-highlight font-serif font-bold tracking-wider block uppercase mb-1.5">가족 질문</span>
                <h2 className="공동 질문 빈도 설정">공동 기억의 질문 주기</h2>
                <p className="text-xs text-muted-foreground mt-1">부모님과 교환하며 합칠 공동 나이테 질문 발송 횟수를 세팅합니다.</p>
              </div>

              <div className="flex flex-col gap-3">
                {(["once", "twice", "three", "custom"] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setSharedQuestionFrequency(freq)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                      sharedQuestionFrequency === freq
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <span className="font-serif">
                      {freq === "once" && "하루에 한 번 (추천)"}
                      {freq === "twice" && "하루에 두 번 (아침/저녁)"}
                      {freq === "three" && "하루에 세 번 (식후 대화)"}
                      {freq === "custom" && "맞춤 일정에 따라"}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        sharedQuestionFrequency === freq ? "border-primary-foreground bg-primary-foreground text-primary" : "border-border"
                      }`}
                    >
                      {sharedQuestionFrequency === freq && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Navigation controls */}
      <footer className="w-full max-w-lg mx-auto z-10 relative">
        {step < 4 ? (
          <Button variant="primary" onClick={handleNextStep} className="w-full flex items-center justify-center gap-2">
            다음 단계로
            <ArrowRight size={18} />
          </Button>
        ) : (
          <Button variant="primary" onClick={handleRegisterComplete} className="w-full flex items-center justify-center gap-2">
            가입 완료 및 서첩 열기
            <Sparkles size={18} />
          </Button>
        )}
        <p className="text-[10px] text-zinc-400 font-serif text-center mt-6">
          &copy; 2026 이음 서첩. 어르신들의 기억 건강을 기원합니다.
        </p>
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground">
          <p className="text-lg font-serif">기록첩 서장을 펴는 중...</p>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
