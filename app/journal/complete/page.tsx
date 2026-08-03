"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { animate } from "animejs";
import { Button } from "@/components/Button";

// Dynamically import Lottie to prevent SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function JournalCompletePage() {
  const router = useRouter();
  const headlineRef  = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef  = useRef<HTMLParagraphElement | null>(null);
  const cardRef      = useRef<HTMLDivElement | null>(null);
  const [confettiData, setConfettiData] = useState<object | null>(null);
  const [showLottie, setShowLottie] = useState(false);

  // Load confetti JSON
  useEffect(() => {
    fetch("/elements/confetti.json")
      .then((r) => r.json())
      .then((data) => {
        setConfettiData(data);
        // Short delay so the card entrance finishes before confetti fires
        setTimeout(() => setShowLottie(true), 400);
      })
      .catch(() => {/* confetti is optional — silently skip */});
  }, []);

  // anime.js entrance animations
  useEffect(() => {
    const card = cardRef.current;
    const h    = headlineRef.current;
    const sub  = subtitleRef.current;
    if (!card || !h || !sub) return;

    // Card slide-up
    animate(card, {
      translateY: [40, 0],
      opacity:    [0, 1],
      duration:   700,
      easing:     "easeOutCubic",
    });

    // Headline char stagger
    animate(h, {
      opacity:  [0, 1],
      translateY: [12, 0],
      delay:    200,
      duration: 600,
      easing:   "easeOutCubic",
    });

    // Subtitle fade
    animate(sub, {
      opacity:  [0, 1],
      delay:    500,
      duration: 700,
      easing:   "easeOutCubic",
    });
  }, []);

  // Auto-redirect
  useEffect(() => {
    router.replace("/home?completed=true");
  }, [router]);

  return (
    <div className="relative flex flex-col flex-1 items-center justify-center min-h-screen bg-background text-foreground overflow-hidden select-none transition-colors duration-300">

      {/* ── Lottie confetti overlay (pointer-events: none so it doesn't block clicks) ── */}
      {showLottie && confettiData && (
        <div
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <Lottie
            animationData={confettiData}
            loop={false}
            autoplay
            style={{ width: "min(100vw, 600px)", height: "min(100vh, 600px)" }}
          />
        </div>
      )}

      {/* Subtle editorial column lines */}
      <div className="absolute top-0 left-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />
      <div className="absolute top-0 right-[8%] w-[1px] h-full bg-primary/5 pointer-events-none hidden sm:block" />

      {/* ── Main card ── */}
      <main className="relative z-10 flex flex-col items-center text-center max-w-sm px-6 gap-8">
        <div
          ref={cardRef}
          style={{ opacity: 0 }}
          className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-background/80 backdrop-blur-sm border border-border shadow-xl"
        >
          {/* Trophy icon */}
          <div className="w-20 h-20 rounded-2xl bg-highlight/10 border border-highlight/25 flex items-center justify-center text-4xl">
            🎉
          </div>

          {/* Text */}
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif">
              오늘 할 일 완료
            </span>

            <h1
              ref={headlineRef}
              style={{ opacity: 0 }}
              className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-relaxed"
            >
              오늘 할 일을 모두
              <br />
              완료했습니다!
              <br />
              <span className="text-highlight">수고하셨어요 🙇</span>
            </h1>

            <div className="w-8 h-[1px] bg-primary/20 mx-auto my-1" />

            <p
              ref={subtitleRef}
              style={{ opacity: 0 }}
              className="text-sm text-muted-foreground leading-relaxed font-sans"
            >
              소중한 기억의 한 지면이 서화첩에 정갈하게 보관되었습니다.
              <br />
              오늘도 기억 정원을 가꾸어 주셔서 감사합니다.
            </p>
          </div>

          {/* Action */}
          <div className="w-full flex flex-col items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push("/home")}
              className="w-full"
            >
              기록첩 닫기
            </Button>
            <span className="text-[10px] text-muted-foreground font-serif">
              잠시 후 자동으로 홈 화면으로 돌아갑니다.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
