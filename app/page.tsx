"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { QuietFadeIn } from "@/components/QuietFadeIn";
import { Sparkles, Share2, Heart, ArrowRight, ChevronDown } from "lucide-react";

export default function EntryPage() {
  const [isMounted, setIsMounted] = useState(false);
  const section2Ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToSection2 = () => {
    section2Ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const existingUser = localStorage.getItem("eeum_mock_curr_user");
      if (!existingUser) {
        const defaultUser = {
          id: "user-elderly-123",
          role: "self",
          name: "김순자 어르신",
          email: "soonja@eeum.com",
          dob: "1945-03-10",
          userCode: "UM-709",
          textSize: "large",
          colorVision: "default",
          questionFrequency: "once",
          appPurpose: "Memory Recording",
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("eeum_mock_curr_user", JSON.stringify(defaultUser));
        window.dispatchEvent(new Event("eeum_user_changed"));
      }
    }
    router.push("/home");
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      {/* Floating Glassmorphism Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl rounded-full px-6 py-3 flex items-center justify-between backdrop-blur-md bg-white/10 dark:bg-neutral-900/20 border border-white/15 dark:border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:border-white/25 dark:hover:border-white/10">
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
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={handleStartDemo}
            className="bg-white hover:bg-neutral-100 text-neutral-900 text-xs md:text-sm font-semibold px-4 py-2 rounded-full cursor-pointer transition-all duration-200 shadow-sm active:scale-95"
          >
            기록 시작하기
          </button>
        </div>
      </header>

      {/* Section 1: Full-Screen Cinematic Hero */}
      <section className="relative w-full h-screen flex flex-col justify-end overflow-hidden">
        {/* Full-Screen Video Background - scaled slightly on desktop to reduce vertical crop zoom */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 md:scale-x-[1.25] md:scale-y-[1.05] transition-all duration-500"
          src="/videos/10302168-uhd_2160_4096_25fps.mp4"
        />

        {/* 60% Opacity Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />

        {/* Hero Content (Asymmetric bottom-left placement) with senior-friendly anime.js transition */}
        <QuietFadeIn
          delay={200}
          duration={800}
          yOffset={12}
          className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pb-16 md:pb-24 flex flex-col items-start text-left text-white"
        >
          <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-highlight font-serif mb-3 opacity-90">
            비약물적 기억 관리 & 세대 연계
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-tight tracking-tight drop-shadow-sm">
            기억을 잇다,<br />
            <span className="text-neutral-200">마음을 이음</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-xl mt-4 font-sans leading-relaxed drop-shadow-sm font-light">
            부모님의 오래된 손글씨 일기, 한 장의 옛 편지, 흐릿해진 사진들을 고요히 한 지면에 옮겨 적습니다. 인공지능이 건네는 다정한 질문들은 어르신의 소중한 과거 기억을 자극하고, 자녀의 기억 조각과 만나 하나의 마인드맵으로 엮입니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={handleStartDemo}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold px-6 py-3 rounded-full cursor-pointer flex items-center gap-2 text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-primary/20 active:scale-98"
            >
              기록 시작하기
              <ArrowRight size={18} />
            </button>
          </div>
        </QuietFadeIn>

        {/* Animated "Scroll Down" Indicator */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50 text-xs tracking-widest uppercase transition-opacity duration-1000 delay-500 cursor-pointer hover:text-white/80 ${isMounted ? "opacity-100" : "opacity-0"
            }`}
          onClick={scrollToSection2}
        >
          <span>Scroll Down</span>
          <ChevronDown className="animate-bounce" size={18} />
        </div>
      </section>

      {/* Section 2: Clean Light-themed Features Section */}
      <section
        ref={section2Ref}
        className="w-full bg-background text-foreground py-24 md:py-32 px-6 md:px-12 z-10 relative border-t border-border transition-colors duration-300"
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-24">
          {/* Section 2 Title */}
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
            <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif">
              이음 플랫폼의 지향점
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary leading-tight">
              따뜻한 연결을 위한 디지털 기억 정원
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed max-w-2xl font-light">
              이음은 단순한 저장소를 넘어, 잊혀가는 부모님의 소중한 삶의 궤적을 복원하고 세대 간 대화의 통로를 열어주는 따뜻한 동행입니다.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Digitization */}
            <div className="group flex flex-col p-8 rounded-2xl bg-secondary/20 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Share2 size={22} />
              </div>
              <span className="text-xs font-serif font-bold text-highlight mb-1">기록의 보관</span>
              <h3 className="text-xl font-serif font-bold text-primary mb-3">옛 일기 디지털 변환</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans font-light">
                오래된 손글씨나 빛바랜 서신을 사진으로 담으면, 인공지능이 인물과 장소, 날짜를 차분히 가려내어 정갈한 서체로 인쇄하듯 보관합니다.
              </p>
            </div>

            {/* Card 2: Questioning */}
            <div className="group flex flex-col p-8 rounded-2xl bg-secondary/20 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Sparkles size={22} />
              </div>
              <span className="text-xs font-serif font-bold text-highlight mb-1">인지의 자극</span>
              <h3 className="text-xl font-serif font-bold text-primary mb-3">기억 환기용 질문</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans font-light">
                기존의 일상 일대기 데이터와 연동하여, 부모님이 직접 삶의 한 자락을 깊이 돌아볼 수 있도록 정답 없는 회상 유도 질문을 조용히 건넵니다.
              </p>
            </div>

            {/* Card 3: Sharing */}
            <div className="group flex flex-col p-8 rounded-2xl bg-secondary/20 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Heart size={22} />
              </div>
              <span className="text-xs font-serif font-bold text-highlight mb-1">마음의 병합</span>
              <h3 className="text-xl font-serif font-bold text-primary mb-3">세대 간 기억의 병치</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans font-light">
                부모님과 자녀가 동일한 삶의 사건에 다르게 답하더라도, 옳고 그름의 판정 없이 각자의 기억을 하나의 마인드맵 위에 소중히 나열해 줍니다.
              </p>
            </div>
          </div>

          {/* Split Section: SVG concentic timeline + Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-t border-border/30 pt-16">
            {/* SVG Illustration */}
            <div className="flex justify-center relative w-full max-w-[340px] mx-auto aspect-square rounded-2xl bg-secondary/10 border border-border p-8 shadow-sm">
              <div className="absolute top-3 left-4 text-[10px] font-serif font-bold text-primary/70 tracking-wider">나이테 기억 타임라인</div>
              <svg viewBox="0 0 300 300" className="w-full h-full">
                <circle cx="150" cy="150" r="110" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx="150" cy="150" r="80" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx="150" cy="150" r="50" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx="150" cy="150" r="20" fill="none" className="pen-line" strokeWidth="0.8" />

                <circle cx="150" cy="150" r="3" className="fill-primary" />

                <line x1="150" y1="150" x2="150" y2="40" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />
                <line x1="150" y1="150" x2="260" y2="150" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />

                <circle cx="206" cy="100" r="5" className="fill-primary animate-pulse" />
                <text x="216" y="103" className="fill-primary text-[10px] font-bold font-serif">1955년 가을</text>

                <circle cx="95" cy="180" r="5" className="fill-highlight" />
                <text x="50" y="183" className="fill-highlight text-[10px] font-bold font-serif">1972년 돌잔치</text>

                <circle cx="150" cy="100" r="4" className="fill-primary" opacity="0.7" />
                <text x="142" y="90" className="fill-primary text-[9px] font-bold font-serif">1964년 봄</text>
              </svg>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-6 text-left">
              <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif">나이테 회상 방식</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-primary leading-tight">
                나무의 나이테처럼 겹겹이 쌓이는 인생의 순간들
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans font-light">
                이음은 어르신의 삶을 선형적 시간표가 아닌, 나이테처럼 유기적으로 얽힌 기억의 동심원으로 시각화합니다. 가장 중심의 어린 시절 기억부터 겉 테두리의 최근 기억까지, AI가 설계한 유기적인 대화 흐름을 따라 자연스럽게 회상할 수 있습니다.
              </p>
              <ul className="flex flex-col gap-3 mt-2 text-sm sm:text-base text-muted-foreground font-sans font-light">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span><strong>비약물적 회상 치료 기법</strong> 적용: 인지 능력 유지와 정서적 안정에 기여</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span><strong>마인드맵 기억 병합</strong>: 부모님과 자녀의 이야기를 입체적으로 매칭</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span><strong>기록의 영구 보존</strong>: 잊혀가는 가족사를 고화질 앨범과 디지털 서실로 백업</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full text-center border-t border-border/30 pt-10">
            <p className="text-xs text-muted-foreground leading-relaxed font-serif font-light">
              본 이음 플랫폼은 비약물적 회상 인지 자극을 목표로 설계되었으며, 정신과적 혹은 의학적 초기 진단 및 임상 진료를 대체할 수 없습니다. <br />
              &copy; 2026 이음 서실. All rights reserved.
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}

