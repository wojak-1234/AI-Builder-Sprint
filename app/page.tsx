"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Sparkles, Share2, Heart, ArrowRight } from "lucide-react";

export default function EntryPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground relative select-none px-6 py-16 sm:px-12 transition-colors duration-300">
      {/* Editorial Decorative Layout lines */}
      <div className="absolute top-0 left-[5%] w-[1px] h-full bg-primary/5 pointer-events-none hidden md:block" />
      <div className="absolute top-0 right-[5%] w-[1px] h-full bg-primary/5 pointer-events-none hidden md:block" />

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between items-center z-10 gap-16">
        
        {/* Header Branding */}
        <header className="flex items-center justify-between w-full border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground font-serif">이음</span>
            </div>
            <span className="text-lg font-serif font-bold tracking-tight text-primary">기억 회상 플랫폼</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <span className="text-sm font-medium text-muted-foreground font-serif hidden sm:inline">제 1호 기록집</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="w-full flex flex-col lg:flex-row items-center justify-between gap-16 flex-1 my-auto">
          {/* Hero text */}
          <div className="flex-1 text-center lg:text-left flex flex-col gap-6 max-w-xl">
            <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif">비약물적 기억 관리 & 세대 연계</span>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-primary leading-tight">
              기억을 잇다,<br />
              <span className="text-foreground">마음을 이음</span>
            </h1>
            <div className="w-12 h-[1px] bg-primary/30 my-1 mx-auto lg:mx-0" />
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-sans">
              부모님의 오래된 손글씨 일기, 한 장의 옛 편지, 흐릿해진 사진들을 고요히 한 지면에 옮겨 적습니다. 인공지능이 건네는 다정한 질문들은 어르신의 소중한 과거 기억을 자극하고, 자녀의 기억 조각과 만나 하나의 마인드맵으로 엮입니다.
            </p>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/role-selection" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto flex items-center justify-center gap-2">
                  기록 시작하기
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Minimal Editorial Pen Sketch SVG Container */}
          <div className="flex-1 flex items-center justify-center relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl bg-secondary border border-border p-8 shadow-sm transition-colors duration-300">
            <div className="absolute top-3 left-4 text-[10px] font-serif font-bold text-primary/70 tracking-wider">나이테 인쇄본</div>
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {/* Concentric rings - Pen-line drawing styles */}
              <circle cx="150" cy="150" r="110" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx="150" cy="150" r="80" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx="150" cy="150" r="50" fill="none" className="pen-line" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx="150" cy="150" r="20" fill="none" className="pen-line" strokeWidth="0.8" />
              
              {/* Core point */}
              <circle cx="150" cy="150" r="3" className="fill-primary" />

              {/* Timber lines */}
              <line x1="150" y1="150" x2="150" y2="40" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />
              <line x1="150" y1="150" x2="260" y2="150" className="stroke-primary" strokeWidth="0.5" opacity="0.3" />

              {/* Muted clay & ochre nodes */}
              <circle cx="206" cy="100" r="5" className="fill-primary" />
              <text x="216" y="103" className="fill-primary" fontSize="9" fontWeight="bold" fontFamily="var(--font-noto-serif-kr)">1955년 가을</text>

              <circle cx="95" cy="180" r="5" className="fill-highlight" />
              <text x="50" y="183" className="fill-highlight" fontSize="9" fontWeight="bold" fontFamily="var(--font-noto-serif-kr)">1972년 돌잔치</text>

              <circle cx="150" cy="100" r="4" className="fill-primary" opacity="0.7" />
              <text x="142" y="90" className="fill-primary" fontSize="8" fontWeight="bold" fontFamily="var(--font-noto-serif-kr)">1964년 봄</text>
            </svg>
          </div>
        </main>

        {/* Feature Grid Section - Book Column Layout */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 my-4 border-t border-b border-border py-10">
          {/* Card 1: Digitization */}
          <div className="flex flex-col gap-4 text-left md:pr-4 md:border-r border-border">
            <span className="text-xs font-serif font-bold text-highlight">기록의 보관</span>
            <h3 className="text-lg font-serif font-bold text-primary">옛 일기 디지털 변환</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              오래된 손글씨나 빛바랜 서신을 사진으로 담으면, 인공지능이 인물과 장소, 날짜를 차분히 가려내어 정갈한 서체로 인쇄하듯 보관합니다.
            </p>
          </div>

          {/* Card 2: Questioning */}
          <div className="flex flex-col gap-4 text-left md:px-2 md:border-r border-border">
            <span className="text-xs font-serif font-bold text-highlight">인지의 자극</span>
            <h3 className="text-lg font-serif font-bold text-primary">기억 환기용 질문</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              기존의 일상 일대기 데이터와 연동하여, 부모님이 직접 삶의 한 자락을 깊이 돌아볼 수 있도록 정답 없는 회상 유도 질문을 조용히 건넵니다.
            </p>
          </div>

          {/* Card 3: Sharing */}
          <div className="flex flex-col gap-4 text-left md:pl-4">
            <span className="text-xs font-serif font-bold text-highlight">마음의 병합</span>
            <h3 className="text-lg font-serif font-bold text-primary">세대 간 기억의 병치</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              부모님과 자녀가 동일한 삶의 사건에 다르게 답하더라도, 옳고 그름의 판정 없이 각자의 기억을 하나의 마인드맵 위에 소중히 나열해 줍니다.
            </p>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="w-full text-center">
          <p className="text-xs text-muted-foreground leading-relaxed font-serif">
            본 이음 플랫폼은 비약물적 회상 인지 자극을 목표로 설계되었으며, 정신과적 혹은 의학적 초기 진단 및 임상 진료를 대체할 수 없습니다. <br />
            &copy; 2026 이음 서실. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  );
}
