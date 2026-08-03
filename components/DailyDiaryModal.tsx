"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import { supabaseService, DBDailyDiary } from "@/services/supabase-service";
import { X, Sun, RefreshCw, Check } from "lucide-react";

type DailyDiaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onDiarySaved?: () => void;
};

const MOOD_OPTIONS = [
  { label: "평온함 🍃", value: "peaceful" },
  { label: "다정함 ☀️", value: "warm" },
  { label: "그리움 🌾", value: "nostalgic" },
  { label: "즐거움 😊", value: "joyful" },
];

export default function DailyDiaryModal({
  isOpen,
  onClose,
  userId = "user-elderly-123",
  onDiarySaved,
}: DailyDiaryModalProps) {
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("peaceful");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("오늘 하루 있었던 소소한 일이나 기분을 짧게 적어 주세요.");
      return;
    }

    try {
      setLoading(true);
      const newDiary: DBDailyDiary = {
        id: `d-${Date.now()}`,
        user_id: userId,
        content: content.trim(),
        mood: selectedMood,
        created_at: new Date().toISOString(),
        event_date: new Date().toISOString().substring(0, 10),
      };

      await supabaseService.saveDailyDiary(newDiary);

      setSavedSuccess(true);
      await new Promise((r) => setTimeout(r, 600));

      if (onDiarySaved) {
        onDiarySaved();
      }
      onClose();
      setContent("");
      setSavedSuccess(false);
    } catch (err) {
      console.error("saveDailyDiary error:", err);
      alert("일기 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-background border border-border rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Sun size={20} className="text-amber-500 animate-spin [animation-duration:10s]" />
            <h3 className="text-lg font-serif font-bold text-foreground">오늘 하루 일상 일기 적기</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mood Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-serif font-bold text-muted-foreground">오늘 하루 마음에 담긴 결</span>
          <div className="grid grid-cols-4 gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedMood(m.value)}
                className={`py-2 px-1 rounded-xl text-xs font-serif font-bold border transition-all cursor-pointer ${selectedMood === m.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          label="소소한 일상 적기"
          placeholder="예) 오늘 아침 산책길에 들꽃이 피어 유난히 반가웠다. 딸에게 정겨운 전화가 와서 도런도런 목소리를 나누었다."
          className="min-h-[140px]"
        />

        <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
          * 오늘 일기를 기록해 주시면 AI가 수학적 빈도 확률 알고리즘을 통해 일상과 회상을 잇는 따뜻한 맞춤 질문을 만들어 드립니다.
        </p>

        {/* Success Status */}
        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check size={16} />
            <span>오늘 일기가 서첩에 고이 보관되었습니다!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw size={14} className="animate-spin" /> 보관하는 중...
              </span>
            ) : (
              "일기 보관하기"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
