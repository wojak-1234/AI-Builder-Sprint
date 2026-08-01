"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/Input";
import { X, Sparkles, Image as ImageIcon, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

type CustomTopicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  creatorRole?: "self" | "guardian";
};

export default function CustomTopicModal({
  isOpen,
  onClose,
  userId = "user-elderly-123",
  creatorRole = "self",
}: CustomTopicModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"text" | "photo">("text");
  const [textHint, setTextHint] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (tab === "text" && !textHint.trim()) {
      setError("추억 이야기 힌트나 단어를 적어 주세요.");
      return;
    }
    if (tab === "photo" && !selectedFile) {
      setError("스캔할 옛 사진이나 편지 이미지를 선택해 주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (tab === "photo") {
        setLoadingMsg("옛 사진 속 글씨와 장면을 정독하고 있어요...");
      } else {
        setLoadingMsg("제시해주신 추억 힌트를 바탕으로 정겨운 회상 질문을 다듬고 있어요...");
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("creatorRole", creatorRole);
      formData.append("textHint", textHint);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/questions/custom", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "주제 생성 중 오류가 발생했습니다.");
      }

      setLoadingMsg("어르신 맞춤 질문이 완성되었습니다! 회상 지면으로 이동합니다.");
      await new Promise((r) => setTimeout(r, 600));

      const encodedQText = encodeURIComponent(data.qtext);
      onClose();
      router.push(`/journal?qid=${data.qid}&qtext=${encodedQText}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "주제 생성 실패. 다시 시도해 주세요.");
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
            <Sparkles size={20} className="text-highlight animate-pulse" />
            <h3 className="text-lg font-serif font-bold text-foreground">
              {creatorRole === "guardian" ? "어르신께 제안할 추억 주제" : "직접 만드는 회상 대화 주제"}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Type Tabs */}
        <div className="grid grid-cols-2 p-1 bg-muted/40 rounded-xl border border-border text-xs font-serif">
          <button
            type="button"
            onClick={() => setTab("text")}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
              tab === "text"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare size={14} /> 텍스트 힌트 적기
          </button>
          <button
            type="button"
            onClick={() => setTab("photo")}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
              tab === "photo"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon size={14} /> 옛 사진/편지 첨부
          </button>
        </div>

        {/* Content Body */}
        {tab === "text" ? (
          <div className="flex flex-col gap-2">
            <TextArea
              value={textHint}
              onChange={(e) => setTextHint(e.target.value)}
              label="추억 힌트/키워드"
              placeholder="예) 1978년 마당에서 키우던 바둑이 이야기, 또는 가을 들판 소풍날 먹던 김밥"
              className="min-h-[120px]"
            />
            <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">
              * 입력해주신 단어를 바탕으로 AI가 어르신이 편안히 들려주실 수 있는 다정한 회상 질문으로 다듬어 드립니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!filePreview ? (
              <label className="flex flex-col items-center justify-center p-8 border border-dashed border-primary/40 rounded-2xl hover:border-primary transition-all cursor-pointer bg-muted/10 shadow-sm text-center">
                <ImageIcon size={36} className="text-primary/50 mb-2" />
                <span className="text-sm font-serif font-bold text-primary">추억 사진/손글씨 이미지 선택</span>
                <span className="text-[10px] text-muted-foreground mt-1 font-serif">카메라로 앨범이나 옛 편지를 찍어 업로드해 주세요</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative rounded-2xl overflow-hidden border border-border max-h-[180px] bg-black/5 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreview} alt="Selected scan" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <TextArea
                  value={textHint}
                  onChange={(e) => setTextHint(e.target.value)}
                  label="사진 부연 설명 (선택)"
                  placeholder="사진에 담긴 배경이나 전하고 싶은 이야기를 함께 남겨주시면 더욱 풍성해집니다."
                  className="min-h-[70px]"
                />
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="p-4 rounded-2xl bg-secondary/80 border border-border flex flex-col items-center justify-center text-center gap-2">
            <RefreshCw size={22} className="animate-spin text-primary" />
            <p className="text-xs font-serif font-bold text-foreground animate-pulse">{loadingMsg}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "다듬는 중..." : "대화 주제 만들기 ✦"}
          </Button>
        </div>
      </div>
    </div>
  );
}
