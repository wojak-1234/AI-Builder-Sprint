"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBUser } from "@/services/supabase-service";
import { ArrowLeft, ArrowRight, Check, Scan, Sparkles, User, Users, LogIn } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: "entry" | "login" | "role-select" | "register-steps"
  const [mode, setMode] = useState<"entry" | "login" | "role-select" | "register-steps">("entry");
  const [role, setRole] = useState<"self" | "guardian">("self");
  const [step, setStep] = useState(1);

  // Form Fields & Validation Errors
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState(""); // Elderly only
  const [phone, setPhone] = useState(""); // Guardian only
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Accessibility
  const [textSize, setTextSize] = useState<"small" | "medium" | "large" | "xl">("medium");
  const [colorVision, setColorVision] = useState<"default" | "daltonism" | "tritanopia" | "contrast">("default");

  // Step 3 (Elderly AI settings / Guardian linking)
  const [questionFrequency, setQuestionFrequency] = useState<"once" | "twice" | "three" | "custom">("once");
  const [linkMethod, setLinkMethod] = useState<"code" | "qr">("code");
  const [userCode, setUserCode] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [pairedUserName, setPairedUserName] = useState<string | null>(null);

  // Step 4 (Elderly Purpose / Guardian shared settings)
  const [appPurpose, setAppPurpose] = useState("Memory Recording");
  const [sharedQuestionFrequency, setSharedQuestionFrequency] = useState<"once" | "twice" | "three" | "custom">("once");

  // Parse query params to jump directly to registration wizard if needed
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "self" || roleParam === "guardian") {
      setRole(roleParam as "self" | "guardian");
      setMode("register-steps");
      setStep(1);
    }
  }, [searchParams]);

  // Accessibility & live-preview Sync
  useEffect(() => {
    if (mode === "register-steps") {
      const tempUser: Partial<DBUser> = {
        role: role,
        name: name || "가입자",
        textSize,
        colorVision,
      };
      localStorage.setItem("eeum_mock_curr_user", JSON.stringify(tempUser));
      window.dispatchEvent(new Event("eeum_user_changed"));
    }
  }, [textSize, colorVision, name, role, mode]);

  // Validation Actions
  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "이메일이 올바르지 않습니다!";
    }
    if (!password.trim()) {
      newErrors.password = "비밀번호가 올바르지 않습니다!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const users = await supabaseService.getAllUsers();
      const matched = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (matched) {
        await supabaseService.setCurrentUser(matched);
        router.push("/home");
      } else {
        setErrors({
          email: "등록되지 않은 이메일입니다!",
          password: "비밀번호가 일치하지 않습니다!",
        });
      }
    } catch (err) {
      console.error(err);
      setErrors({ email: "로그인 중 오류가 발생했습니다." });
    }
  };

  const handleNextStep = () => {
    const newErrors: Record<string, string> = {};
    setErrors({});

    if (step === 1) {
      if (!name.trim()) newErrors.name = "성함이 올바르지 않습니다!";
      if (!email.trim() || !email.includes("@")) newErrors.email = "이메일이 올바르지 않습니다!";
      if (!password.trim() || password.length < 4) newErrors.password = "비밀번호가 올바르지 않습니다!";
      if (role === "self" && !dob) newErrors.dob = "생년월일이 올바르지 않습니다!";
      if (role === "guardian" && !phone.trim()) newErrors.phone = "휴대폰 번호가 올바르지 않습니다!";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    if (step === 3 && role === "guardian") {
      if (linkMethod === "code") {
        if (!userCode.trim()) {
          newErrors.userCode = "코드가 올바르지 않습니다!";
        } else if (userCode.trim() !== "UM-709") {
          newErrors.userCode = "코드가 올바르지 않습니다!";
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }
        setPairedUserName("김순자 어르신");
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setErrors({});
    if (step === 1) {
      setMode("role-select");
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // Mock QR scan success handler
  const handleMockQrScan = () => {
    setQrScanning(true);
    setErrors({});
    setTimeout(() => {
      setUserCode("UM-709");
      setPairedUserName("김순자 어르신");
      setQrScanning(false);
      setLinkMethod("code");
    }, 1200);
  };

  const handleRegisterComplete = async () => {
    try {
      const generatedId = role === "self" ? `user-elderly-${Date.now()}` : `user-guardian-${Date.now()}`;
      
      const newUser: DBUser = {
        id: generatedId,
        role: role,
        name: name,
        email: email,
        password: password,
        dob: role === "self" ? dob : undefined,
        phone: role === "guardian" ? phone : undefined,
        userCode: role === "self" ? `UM-${Math.floor(100 + Math.random() * 900)}` : undefined,
        paired_user_id: role === "guardian" ? "user-elderly-123" : undefined,
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
      setErrors({ register: "가입 처리 중 오류가 발생했습니다." });
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-between min-h-screen bg-background text-foreground px-6 py-12 relative transition-colors duration-300">
      {/* Visual background grids */}
      <div className="absolute top-0 left-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />
      <div className="absolute top-0 right-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />

      {/* Header controls */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pb-4 border-b border-border z-10">
        {mode !== "entry" ? (
          <button
            onClick={() => {
              setErrors({});
              if (mode === "register-steps") {
                handlePrevStep();
              } else {
                setMode("entry");
              }
            }}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-serif cursor-pointer"
          >
            <ArrowLeft size={16} />
            돌아가기
          </button>
        ) : (
          <div className="text-muted-foreground font-serif text-xs select-none">이음 서실</div>
        )}
        
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          {mode === "register-steps" && (
            <span className="text-muted-foreground font-serif text-xs select-none">
              {role === "self" ? "어르신 가입" : "보호자 가입"} ({step}/4)
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center my-8 z-10">
        
        {/* MODE 1: ENTRY SCREEN (Choice between Login and Signup) */}
        {mode === "entry" && (
          <div className="p-8 rounded-2xl bg-secondary border border-border shadow-sm text-center flex flex-col items-center gap-6">
            <div className="h-24 w-auto relative select-none shrink-0">
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
              <h1 className="text-3xl font-serif font-bold text-primary">이음에 오신 것을 환영합니다</h1>
              <p className="text-sm text-muted-foreground mt-2 font-serif">부모님의 기억과 자녀의 마음을 잇는 공간</p>
            </div>
            
            <div className="flex flex-col gap-3.5 w-full mt-4">
              <Button variant="primary" onClick={() => setMode("role-select")} className="w-full flex items-center justify-center gap-2">
                새 기록첩 시작하기 (회원가입)
                <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" onClick={() => setMode("login")} className="w-full flex items-center justify-center gap-2">
                기존 기록첩 열기 (로그인)
                <LogIn size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* MODE 2: LOGIN SCREEN */}
        {mode === "login" && (
          <div className="p-8 rounded-2xl bg-secondary border border-border shadow-sm text-left flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary">기록첩 열기</h2>
              <p className="text-xs text-muted-foreground mt-1">등록하셨던 이메일과 계정 열쇠를 사용해 로그인합니다.</p>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="이메일 주소"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }}
                error={!!errors.email}
                errorMessage={errors.email}
                required
              />
              <Input
                label="비밀번호"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                }}
                error={!!errors.password}
                errorMessage={errors.password}
                required
              />
            </div>

            <div className="text-[11px] text-muted-foreground bg-background border border-border/50 p-3.5 rounded-xl leading-relaxed select-none">
              💡 <strong>데모 체험 안내:</strong><br />
              이메일 <strong className="text-primary">soonja@eeum.com</strong> (어르신) 또는 <strong className="text-primary">jiyoung@eeum.com</strong> (자녀)을 입력하고 비밀번호는 아무 글자나 입력하시면 준비된 테스트 데이터로 바로 체험하실 수 있습니다.
            </div>

            <Button variant="primary" onClick={handleLogin} className="w-full flex items-center justify-center gap-2 mt-2">
              로그인 완료
              <Sparkles size={18} />
            </Button>
          </div>
        )}

        {/* MODE 3: ROLE SELECT */}
        {mode === "role-select" && (
          <div className="p-8 rounded-2xl bg-secondary border border-border shadow-sm text-left flex flex-col gap-6">
            <div className="text-center w-full">
              <span className="text-xs font-serif font-bold text-highlight block">역할을 선택하여 가입 진행</span>
              <h2 className="text-2xl font-serif font-bold text-primary mt-1.5">어떤 기록첩을 시작할까요?</h2>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setRole("self");
                  setMode("register-steps");
                  setStep(1);
                  setErrors({});
                }}
                className="flex items-center justify-between w-full p-5 rounded-2xl bg-background border border-border hover:border-primary/40 hover:opacity-95 transition-all text-left cursor-pointer group shadow-sm active:scale-98"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-primary">어르신 본인으로 가입</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-sans leading-normal">
                      나의 옛 서첩을 한지 위에 기록하고 질문을 받습니다.
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setRole("guardian");
                  setMode("register-steps");
                  setStep(1);
                  setErrors({});
                }}
                className="flex items-center justify-between w-full p-5 rounded-2xl bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left cursor-pointer group shadow-sm active:scale-98"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-primary">보호자 / 자녀로 가입</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-sans leading-normal">
                      어르신의 추억 보관을 돕고 마인드맵 기록을 공유합니다.
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* MODE 4: STEP WIZARD */}
        {mode === "register-steps" && (
          <div className="p-8 rounded-2xl bg-secondary border border-border shadow-sm text-left">
            
            {/* STEP 1: 기본 정보 입력 */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary">기본 정보를 입력해 주세요</h2>
                  <p className="text-xs text-muted-foreground mt-1">서첩 등록을 위한 성함과 비밀번호를 지정합니다.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <Input
                    label={role === "self" ? "성함 혹은 별칭" : "성함"}
                    placeholder={role === "self" ? "예: 김순자" : "예: 이지영"}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    error={!!errors.name}
                    errorMessage={errors.name}
                    required
                  />
                  <Input
                    label="이메일 주소"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                    }}
                    error={!!errors.email}
                    errorMessage={errors.email}
                    required
                  />
                  <Input
                    label="비밀번호 (4자 이상)"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                    }}
                    error={!!errors.password}
                    errorMessage={errors.password}
                    required
                  />
                  {role === "self" ? (
                    <Input
                      label="생년월일"
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        if (errors.dob) setErrors(prev => ({ ...prev, dob: "" }));
                      }}
                      error={!!errors.dob}
                      errorMessage={errors.dob}
                      required
                    />
                  ) : (
                    <Input
                      label="휴대폰 번호"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                      }}
                      error={!!errors.phone}
                      errorMessage={errors.phone}
                      required
                    />
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: 화면 설정 */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary">화면 설정</h2>
                  <p className="text-xs text-muted-foreground mt-1">글씨 크기와 대조를 실시간으로 맞춤화합니다.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-serif font-bold text-primary">글씨 크기</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["small", "medium", "large", "xl"] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setTextSize(sz)}
                        className={`py-2 px-1 text-xs rounded-lg border text-center font-serif transition-all cursor-pointer ${
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

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-serif font-bold text-primary">색각 모드 지원</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "default", label: "기본 색상" },
                      { key: "contrast", label: "흑백 고대비" },
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

            {/* STEP 3: AI / Pairing */}
            {step === 3 && role === "self" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary">인공지능 대화 주기</h2>
                  <p className="text-xs text-muted-foreground mt-1">기억 환기를 위해 인공지능이 말을 건네는 빈도입니다.</p>
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
                      <span className="font-serif text-sm">
                        {freq === "once" && "하루에 한 번 (추천)"}
                        {freq === "twice" && "하루에 두 번 (아침/저녁)"}
                        {freq === "three" && "하루에 세 번 (식사 대화)"}
                        {freq === "custom" && "맞춤형 일정"}
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
                  <h2 className="text-2xl font-serif font-bold text-primary">가족 연결 설정</h2>
                  <p className="text-xs text-muted-foreground mt-1">기록을 공유할 부모님의 가입 코드나 QR을 넣어주세요.</p>
                </div>

                <div className="flex border-b border-border">
                  <button
                    onClick={() => setLinkMethod("code")}
                    className={`flex-1 pb-2 text-center font-serif text-xs border-b-2 transition-all cursor-pointer ${
                      linkMethod === "code" ? "border-primary font-bold text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    기록코드 입력
                  </button>
                  <button
                    onClick={() => setLinkMethod("qr")}
                    className={`flex-1 pb-2 text-center font-serif text-xs border-b-2 transition-all cursor-pointer ${
                      linkMethod === "qr" ? "border-primary font-bold text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    QR 코드 스캔
                  </button>
                </div>

                {linkMethod === "code" ? (
                  <div className="flex flex-col gap-4">
                    <Input
                      label="6자리 기록코드"
                      placeholder="예: UM-709"
                      value={userCode}
                      onChange={(e) => {
                        setUserCode(e.target.value.toUpperCase());
                        if (errors.userCode) setErrors(prev => ({ ...prev, userCode: "" }));
                      }}
                      error={!!errors.userCode}
                      errorMessage={errors.userCode}
                      helperText="체험 연결을 위해 'UM-709'를 입력하시면 즉시 가상 연결이 적용됩니다."
                    />
                    {pairedUserName && (
                      <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between text-xs animate-fade-in select-none">
                        <span className="font-serif">확인된 계정: <strong>{pairedUserName}</strong></span>
                        <Check size={14} className="text-primary font-bold" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl border border-border text-center">
                    <div className="w-36 h-36 border border-primary/20 bg-secondary/50 rounded-lg flex flex-col items-center justify-center relative overflow-hidden select-none">
                      {qrScanning ? (
                        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center animate-pulse">
                          <span className="text-xs font-serif text-primary">스캐너 스캔 중...</span>
                        </div>
                      ) : (
                        <>
                          <Scan size={30} className="text-primary/30" />
                          <span className="text-[10px] text-muted-foreground font-serif mt-2">QR 배치</span>
                        </>
                      )}
                    </div>
                    <Button variant="secondary" onClick={handleMockQrScan} disabled={qrScanning} size="md" className="flex gap-2">
                      <Scan size={12} />
                      모의 스캔 시작
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: 용도 / 공동 설정 */}
            {step === 4 && role === "self" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary">기록 목적 선택</h2>
                  <p className="text-xs text-muted-foreground mt-1">선택하신 목적에 맞춰 질문의 어조가 조정됩니다.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { key: "Memory Recording", title: "옛 기록 보관", desc: "편지와 일기를 정갈한 디지털 앨범으로 영구 보관" },
                    { key: "Memory Recall", title: "인지 건강 자극", desc: "다정한 과거 추억 질문을 답하며 두뇌 활성 유지" },
                    { key: "Family Sharing", title: "가족과의 교류", desc: "자녀들과 기록을 공유하고 추억 대화 나누기" },
                    { key: "Daily Journaling", title: "오늘의 일기", desc: "가벼운 하루 기록과 일상 쓰기 중심" }
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
                        <p className={`text-[10px] mt-0.5 leading-relaxed ${appPurpose === purpose.key ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
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
                  <h2 className="text-2xl font-serif font-bold text-primary">공동 질문 주기</h2>
                  <p className="text-xs text-muted-foreground mt-1">부모님과 공유하여 기억을 대조할 질문 주기입니다.</p>
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
                      <span className="font-serif text-sm">
                        {freq === "once" && "하루에 한 번 (추천)"}
                        {freq === "twice" && "하루에 두 번 (아침/저녁)"}
                        {freq === "three" && "하루에 세 번 (식사 대화)"}
                        {freq === "custom" && "맞춤 일정 설정"}
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
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-lg mx-auto z-10 relative">
        {mode === "register-steps" && (
          step < 4 ? (
            <Button variant="primary" onClick={handleNextStep} className="w-full flex items-center justify-center gap-2">
              다음 단계로
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleRegisterComplete} className="w-full flex items-center justify-center gap-2">
              가입 완료 및 서첩 열기
              <Sparkles size={18} />
            </Button>
          )
        )}
        
        {errors.register && (
          <p className="text-xs text-destructive font-serif text-center mt-2 animate-pulse">
            {errors.register}
          </p>
        )}

        <p className="text-[10px] text-muted-foreground font-serif text-center mt-6 select-none">
          이음 서첩에 기록된 모든 자료는 비약물적 회상 인지 자극을 목적으로 보관됩니다.
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
          <p className="text-lg font-serif">서첩 준비 중...</p>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
