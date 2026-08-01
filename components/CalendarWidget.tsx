"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { DBAnswer } from "@/services/supabase-service";

type CalendarWidgetProps = {
  answers: DBAnswer[];
  onSelectDate: (dateStr: string, dayAnswers: DBAnswer[]) => void;
};

export default function CalendarWidget({ answers, onSelectDate }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const gridRef = useRef<HTMLDivElement | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format YYYY-MM-DD
  const formatDateKey = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  // Group answers by created_at date (YYYY-MM-DD)
  const answersByDateMap = new Map<string, DBAnswer[]>();
  answers.forEach((ans) => {
    const key = ans.created_at.slice(0, 10);
    if (!answersByDateMap.has(key)) {
      answersByDateMap.set(key, []);
    }
    answersByDateMap.get(key)!.push(ans);
  });

  // Calculate days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Run pop animation on completed circles when month changes
  useEffect(() => {
    if (gridRef.current) {
      animate(gridRef.current.querySelectorAll(".completed-circle"), {
        scale: [0.3, 1],
        opacity: [0, 1],
        delay: (el, i) => (i || 0) * 40,
        duration: 500,
        easing: "easeOutBack",
      });
    }
  }, [year, month, answers]);

  const todayStr = formatDateKey(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  return (
    <div className="w-full p-6 rounded-2xl bg-secondary border border-border shadow-sm flex flex-col gap-5 text-left transition-colors duration-300">
      {/* Calendar Header: Month Nav */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-highlight font-serif font-bold tracking-widest uppercase block">
            기록 달력
          </span>
          <h3 className="text-xl font-serif font-bold text-foreground mt-0.5">
            {year}년 {month + 1}월
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="이전 달"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center text-xs font-serif font-bold text-muted-foreground border-b border-border pb-2">
        <span className="text-rose-500/80">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span className="text-blue-500/80">토</span>
      </div>

      {/* Calendar Grid */}
      <div ref={gridRef} className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
        {/* Empty slots for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-10" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateKey = formatDateKey(year, month, dayNum);
          const dayAnswers = answersByDateMap.get(dateKey) || [];
          const isCompleted = dayAnswers.length > 0;
          const isToday = dateKey === todayStr;

          return (
            <div
              key={dateKey}
              onClick={() => onSelectDate(dateKey, dayAnswers)}
              className="relative h-10 flex items-center justify-center cursor-pointer group select-none"
            >
              {/* Completed Yellow Circle with Pop animation */}
              {isCompleted ? (
                <div className="completed-circle absolute w-8 h-8 rounded-full bg-[#F5C842] text-zinc-900 font-bold flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <span className="text-xs font-serif font-bold">{dayNum}</span>
                </div>
              ) : (
                <span
                  className={`text-sm font-serif ${
                    isToday
                      ? "font-bold text-primary underline underline-offset-4"
                      : "text-foreground/80 group-hover:text-primary"
                  }`}
                >
                  {dayNum}
                </span>
              )}

              {/* Today border indicator if not completed */}
              {isToday && !isCompleted && (
                <div className="absolute w-8 h-8 rounded-full border-2 border-primary/40 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
