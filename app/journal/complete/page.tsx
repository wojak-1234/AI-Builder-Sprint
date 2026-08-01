"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Check, Sparkles } from "lucide-react";

export default function JournalCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home");
    }, 6000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col flex-1 items-center justify-between min-h-screen bg-background text-foreground px-6 py-16 select-none transition-colors duration-300">
      {/* Editorial space grid lines */}
      <div className="absolute top-0 left-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />
      <div className="absolute top-0 right-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />

      {/* Header spacer */}
      <div />

      {/* Main Success Section - Styled as a printed book-end colophon */}
      <main className="flex flex-col items-center justify-center text-center max-w-sm z-10 gap-8">
        
        {/* Book colophon border box */}
        <div className="w-16 h-16 rounded-xl border border-primary/30 flex items-center justify-center text-primary relative bg-background">
          <Check size={28} strokeWidth={1.5} />
          {/* Muted Highlight Sparkle */}
          <Sparkles className="absolute -top-1.5 -right-1.5 text-highlight" size={16} />
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif block">기록 완료</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary leading-relaxed">
            참 소중한 <br />기억의 한 지면입니다
          </h1>
          <div className="w-8 h-[1px] bg-primary/20 mx-auto my-1" />
          <p className="text-sm text-muted-foreground leading-relaxed font-sans px-2">
            김순자 어르신의 구술 답변이 기억 서화첩에 정갈하게 정돈되었습니다. 이 기록은 인생 나이테에 고요히 보관되어 자녀와 함께 보실 수 있습니다.
          </p>
        </div>
      </main>

      {/* Action Button */}
      <footer className="w-full max-w-xs z-10 px-4 sm:px-0 flex flex-col items-center gap-4">
        <Button variant="primary" onClick={() => router.push("/home")} className="w-full">
          기록첩 닫기
        </Button>
        <span className="text-[10px] text-zinc-400 font-serif">
          잠시 후 자동으로 서실 대기 화면으로 귀환합니다.
        </span>
      </footer>
    </div>
  );
}
