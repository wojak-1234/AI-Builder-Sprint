"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/Button";
import { X } from "lucide-react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

type CompletionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CompletionModal({ isOpen, onClose }: CompletionModalProps) {
  const [confettiData, setConfettiData] = useState<object | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/elements/confetti.json")
        .then((r) => r.json())
        .then((data) => setConfettiData(data))
        .catch(() => { });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-background border border-border shadow-2xl overflow-hidden flex flex-col items-center p-6 text-center animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-20 cursor-pointer"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        {/* Top: Lottie Animation */}
        <div className="w-full h-44 flex items-center justify-center -mt-2 mb-2 relative z-10 pointer-events-none">
          {confettiData ? (
            <Lottie
              animationData={confettiData}
              loop={true}
              autoplay={true}
              style={{ width: "220px", height: "220px" }}
            />
          ) : (
            <div className="text-5xl animate-bounce">🎉</div>
          )}
        </div>

        {/* Below: Text Content */}
        <div className="flex flex-col items-center gap-3 relative z-10 w-full px-2">
          <span className="text-xs uppercase tracking-widest font-bold text-highlight font-serif">
            오늘의 회상 완성
          </span>

          <h2 className="text-xl sm:text-xl font-serif font-bold text-foreground leading-snug">
            오늘 할 일을 모두 완료했습니다!
            <br />
            <span className="text-primary mt-1 inline-block">수고하셨어요 🙇</span>
          </h2>

          <div className="w-full mt-4">
            <Button variant="primary" onClick={onClose} className="w-full py-3 text-base font-serif font-bold">
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
