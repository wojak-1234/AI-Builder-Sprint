"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { supabaseService, DBUser } from "@/services/supabase-service";
import { User, Users, ArrowLeft, ArrowRight } from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();

  const handleSelectRole = (role: "self" | "guardian") => {
    router.push(`/register?role=${role}`);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-between min-h-screen bg-background text-foreground px-6 py-16 relative overflow-hidden transition-colors duration-300">

      {/* Background Video with opacity & brightness mask */}
      <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-100 transition-opacity duration-300"
          src="/videos/8087608-uhd_2160_4096_24fps.mp4"
        />
        {/* Soft natural lighting backdrop overlay to match cream / dark paper theme */}
        <div className="absolute inset-0 bg-background/85 transition-colors duration-300" />
      </div>

      {/* Top Header Section */}
      <header className="w-full max-w-lg mx-auto flex flex-col items-center gap-8 mt-4 z-10 relative">
        <div className="flex items-center justify-between w-full border-b border-border pb-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-sm font-serif select-none"
          >
            <ArrowLeft size={16} />
            대문으로
          </button>
          <ThemeSwitcher />
        </div>

        {/* Standout App Name */}
        <div className="text-center w-full mt-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-sm select-none">
            <span className="text-2xl font-bold text-primary-foreground font-serif">이음</span>
          </div>
          <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif block select-none">기억과 마음의 연대기</span>
          <h1 className="text-4xl font-serif font-bold text-primary mt-3 select-none">이음 가입하기</h1>
          <p className="text-muted-foreground mt-2 text-sm font-sans select-none max-w-xs leading-relaxed">
            나이테 연대기 위에 부모님과 자녀의 소중한 기억을 가지런히 모셔 보관합니다.
          </p>
        </div>
      </header>

      {/* Bottom Highlighted Signup Buttons */}
      <main className="w-full max-w-lg mx-auto flex flex-col gap-5 mt-auto mb-4 z-10 relative">
        <div className="text-center mb-3">
          <span className="text-xs font-serif font-bold text-highlight select-none">역할을 선택하여 가입 진행</span>
          <div className="w-8 h-[1px] bg-primary/20 mx-auto mt-2" />
        </div>

        {/* Option A: Elderly (Self Mode) */}
        <button
          onClick={() => handleSelectRole("self")}
          className="flex items-center justify-between w-full p-6 rounded-2xl bg-secondary border border-border hover:border-primary/40 hover:opacity-95 transition-all duration-200 text-left cursor-pointer group shadow-sm active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-primary group-hover:opacity-85 transition-colors">
                어르신 본인으로 가입
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-sans leading-normal">
                스스로 옛 서첩을 기록하고 질문에 답합니다.
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Option B: Guardian Mode */}
        <button
          onClick={() => handleSelectRole("guardian")}
          className="flex items-center justify-between w-full p-6 rounded-2xl bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 text-left cursor-pointer group shadow-sm active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-primary group-hover:opacity-85 transition-colors">
                보호자 / 자녀로 가입
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-sans leading-normal">
                부모님의 옛 소장품을 대리 보관 및 공유받습니다.
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
        </button>
      </main>

      {/* Info notice */}
      <footer className="w-full max-w-lg mx-auto text-center border-t border-border pt-6 z-10 relative">
        <p className="text-[10px] text-zinc-400 font-serif leading-normal select-none">
          이음 회원첩에 기록된 모든 사료는 비약물적 회상 인지 자극을 위한 목적으로만 보관되며 의료 기록에 반영되지 않습니다.
        </p>
      </footer>
    </div>
  );
}
