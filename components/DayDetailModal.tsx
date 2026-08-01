"use client";

import { DBAnswer } from "@/services/supabase-service";
import { X, Calendar, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/Button";

type DayDetailModalProps = {
  isOpen: boolean;
  dateStr: string;
  answers: DBAnswer[];
  onClose: () => void;
};

export default function DayDetailModal({
  isOpen,
  dateStr,
  answers,
  onClose,
}: DayDetailModalProps) {
  if (!isOpen) return null;

  // Format YYYY-MM-DD to readable Korean string (예: 2026년 8월 1일)
  const formatKoreanDate = (str: string) => {
    if (!str) return "";
    const [y, m, d] = str.split("-");
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-background border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] text-highlight font-serif font-bold tracking-widest uppercase block">
                일기 및 질문 기록 지면
              </span>
              <h3 className="text-lg font-serif font-bold text-foreground">
                {formatKoreanDate(dateStr)}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {answers.length > 0 ? (
            answers.map((ans, idx) => (
              <div
                key={ans.id || idx}
                className="p-5 rounded-2xl bg-secondary/50 border border-border flex flex-col gap-3 text-left"
              >
                {/* Question Label */}
                <div className="flex items-start gap-2 text-xs font-serif font-bold text-primary border-b border-primary/10 pb-2.5">
                  <MessageSquare size={14} className="shrink-0 mt-0.5" />
                  <span>&ldquo;{ans.question_text}&rdquo;</span>
                </div>

                {/* Answer Content */}
                <p className="text-sm font-sans leading-relaxed text-foreground whitespace-pre-line px-1">
                  {ans.answer_text}
                </p>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] font-serif text-muted-foreground pt-1 border-t border-border/50">
                  <span>기록 시각: {ans.created_at.slice(11, 16)}</span>
                  <span>{ans.by_guardian ? "보호자 대리 기록" : "본인 직접 구술"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <BookOpen size={36} className="text-primary/30" />
              <p className="font-serif text-base text-foreground">
                이 날은 남겨진 기록이 없습니다.
              </p>
              <p className="text-xs font-sans">
                과거의 추억이나 오늘의 일기를 채워 새로운 회상 지면을 만들어 보세요.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/20">
          <Button variant="secondary" onClick={onClose} className="w-full">
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
