const UPSTAGE_API_URL = "https://api.upstage.ai/v1/document-digitization";

export type UpstageParseResult = {
  text: string;
  confidence: number;
  elements: Array<{
    type: string;
    text: string;
    boundingBox?: number[][];
  }>;
};

export type UpstageIEItem = {
  type: string;
  value: string;
};

export function normalizeTimePeriod(val: string): string {
  if (!val) return val;
  let trimmed = val.trim().replace(/\s+/g, "");

  // 2-digit decade pattern: "20년대", "70년대", "80년대" -> 4-digit decade ("2020년대", "1970년대", "1980년대")
  const shortDecadeMatch = trimmed.match(/^(\d{2})년대$/);
  if (shortDecadeMatch) {
    const num = parseInt(shortDecadeMatch[1], 10);
    if (num >= 40) {
      return `19${shortDecadeMatch[1]}년대`;
    } else {
      return `20${shortDecadeMatch[1]}년대`;
    }
  }

  // Ensure "1980 년대" becomes "1980년대"
  trimmed = trimmed.replace(/(\d{4})년대/g, "$1년대");
  return trimmed;
}

export const upstageService = {
  /**
   * Sends a document (image/PDF) to Upstage Document Parse API
   */
  parseDocument: async (fileOrBuffer: File | Buffer, mimeType: string = "image/jpeg"): Promise<UpstageParseResult> => {
    const apiKey = process.env.UPSTAGE_API_KEY || process.env.NEXT_PUBLIC_UPSTAGE_API_KEY;

    if (!apiKey) {
      console.warn("Upstage API Key missing. Returning mock OCR transcription.");
      return {
        text: "1972년 8월 15일, 마당에서 선우 돌잔치를 치렀다. 온 가족이 모여 떡도 해 먹고 신나게 놀았다.",
        confidence: 0.95,
        elements: [],
      };
    }

    try {
      const formData = new FormData();
      if (typeof window === "undefined" && Buffer.isBuffer(fileOrBuffer)) {
        const blob = new Blob([new Uint8Array(fileOrBuffer)], { type: mimeType });
        formData.append("document", blob, "scan.jpg");
      } else if (fileOrBuffer instanceof File) {
        formData.append("document", fileOrBuffer);
      }
      formData.append("model", "document-parse");

      const response = await fetch(UPSTAGE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      let extractedText = "";
      if (response.ok) {
        const data = await response.json();
        if (typeof data.text === "string") {
          extractedText = data.text;
        } else if (Array.isArray(data.elements)) {
          extractedText = data.elements
            .map((el: any) => {
              if (typeof el.text === "string") return el.text;
              if (el.text && typeof el.text.content === "string") return el.text.content;
              if (typeof el.content === "string") return el.content;
              if (el.content && typeof el.content.text === "string") return el.content.text;
              return "";
            })
            .filter(Boolean)
            .join("\n");
        }
      }

      // Fallback to General OCR endpoint if document-digitization returned no text
      if (!extractedText) {
        try {
          const ocrFormData = new FormData();
          if (typeof window === "undefined" && Buffer.isBuffer(fileOrBuffer)) {
            const blob = new Blob([new Uint8Array(fileOrBuffer)], { type: mimeType });
            ocrFormData.append("document", blob, "scan.jpg");
          } else if (fileOrBuffer instanceof File) {
            ocrFormData.append("document", fileOrBuffer);
          }

          const ocrRes = await fetch("https://api.upstage.ai/v1/document-ai/ocr", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: ocrFormData,
          });

          if (ocrRes.ok) {
            const ocrData = await ocrRes.json();
            if (typeof ocrData.text === "string") {
              extractedText = ocrData.text;
            }
          }
        } catch (ocrErr) {
          console.warn("Upstage General OCR endpoint fallback error:", ocrErr);
        }
      }

      return {
        text: extractedText.trim(),
        confidence: 0.95,
        elements: [],
      };
    } catch (error) {
      console.error("Error in Upstage parsing:", error);
      return {
        text: typeof fileOrBuffer === "string" ? fileOrBuffer : "",
        confidence: 0.5,
        elements: [],
      };
    }
  },

  /**
   * Information Extraction: extracts 11 entity types from text with categorical tagging
   */
  extractInformation: async (text: string): Promise<UpstageIEItem[]> => {
    if (!text || !text.trim()) return [];

    const extracted: UpstageIEItem[] = [];
    const addedSet = new Set<string>();

    const addEntity = (type: string, value: string) => {
      let trimmed = value.trim();
      if (!trimmed) return;
      if (type === "time_period") {
        trimmed = normalizeTimePeriod(trimmed);
      }
      const key = `${type}:${trimmed.toLowerCase()}`;
      if (!addedSet.has(key)) {
        addedSet.add(key);
        extracted.push({ type, value: trimmed });
      }
    };

    // 1. Dynamic Regex Matching for Time Periods & Years (Normalizes 20년대 -> 2020년대, 80년대 -> 1980년대)
    const yearMatches = text.match(/19[3-9]\d(?:년|년대)?|20[0-2]\d(?:년|년대)?|\b\d{2}년대\b/g);
    if (yearMatches) {
      yearMatches.forEach((yr) => addEntity("time_period", yr));
    }
    const seasonMatches = text.match(/여름날?|겨울철?|봄날?|가을날?|어릴\s*적|학창\s*시절|유년\s*시절|청년\s*시절|신혼\s*시절/g);
    if (seasonMatches) {
      seasonMatches.forEach((s) => addEntity("time_period", s));
    }

    // 2. Comprehensive Entity Categorization Rules for 11 Entity Types
    const entityRules: Array<{ type: string; keywords: string[] }> = [
      {
        type: "person",
        keywords: [
          "어머니", "엄마", "아버지", "아빠", "할머니", "할아버지", "딸", "아들",
          "이지영", "지영", "김순자", "순자", "선우", "친구", "선생님", "동네 아이들",
          "동창", "이모", "삼촌", "고모", "남편", "아내", "시어머니", "시아버지", "가족", "손주", "손자", "손녀"
        ],
      },
      {
        type: "place",
        keywords: [
          "마당", "기와집", "복지관", "소풍길", "서울", "부산", "경주", "인천", "대구", "광주", "대전",
          "시골", "고향", "학교", "마을", "동네", "개울가", "남한산성", "신혼집", "골목길", "장터", "시장", "정미소", "운동장"
        ],
      },
      {
        type: "event",
        keywords: [
          "입학식", "졸업식", "결혼식", "봄소풍", "소풍", "운동회", "잔치", "돌잔치", "재롱잔치",
          "칠순잔치", "환갑", "명절", "추석", "설날", "동창회", "장날", "출근", "출생"
        ],
      },
      {
        type: "occasion",
        keywords: ["돌잔치", "재롱잔치", "소풍", "명절", "추석", "설날", "운동회"]
      },
      {
        type: "activity",
        keywords: ["술래잡기", "눈사람 만들기", "김밥 말기", "노래교실", "밭일", "빨래", "등산", "산책", "물놀이"]
      },
      {
        type: "animal",
        keywords: ["강아지", "바둑이", "고양이", "나비", "누렁이", "새소리", "황소", "돼지", "수탉", "암탉", "동물", "병아리", "참새", "제비"]
      },
      {
        type: "food",
        keywords: ["김밥", "홍시", "감자", "떡국", "떡볶이", "분홍 소시지", "참기름", "된장찌개", "시래기국", "국수", "비빔밥", "고구마", "옥수수", "감주", "단감"]
      },
      {
        type: "object",
        keywords: ["감나무", "도시락", "김밥", "연탄집게", "눈사람", "사진첩", "손편지", "앨범", "당근", "가방", "일기장"]
      },
      {
        type: "sensory",
        keywords: ["참기름 냄새", "깔깔거리던 소리", "함박눈", "따스한 햇살", "솔솔 풍기는 냄새"]
      },
      {
        type: "emotion",
        keywords: ["설렘", "그리움", "행복", "즐거움", "따스함", "사랑", "정겨움", "아련함"]
      },
    ];

    // Helper: checks if a Korean keyword appears as a standalone word (not inside a larger word).
    // For keywords of 1-2 chars, requires surrounding whitespace/punctuation/string boundary.
    // For keywords of 3+ chars, simple includes() is safe enough in Korean context.
    const keywordMatches = (src: string, kw: string): boolean => {
      if (kw.length <= 2) {
        // Require word boundary: kw must be preceded and followed by non-Korean-char or string boundary
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(?<=[\\s,。.!?'"「」『』【】（）()\\[\\]「」、…—–:;/\\\\]|^)${escaped}(?=[\\s,。.!?'"「」『』【】（）()\\[\\]「」、…—–:;/\\\\]|$)`, "u");
        return re.test(src);
      }
      return src.includes(kw);
    };

    entityRules.forEach((rule) => {
      rule.keywords.forEach((kw) => {
        if (keywordMatches(text, kw)) {
          addEntity(rule.type, kw);
        }
      });
    });

    return extracted;
  },

  /**
   * Generates vector embedding for text using Upstage Solar Embedding API (solar-embedding-1-large-query / solar-embedding-1-large-passage)
   */
  getEmbedding: async (text: string): Promise<number[]> => {
    const apiKey = process.env.UPSTAGE_API_KEY || process.env.NEXT_PUBLIC_UPSTAGE_API_KEY;
    if (!apiKey || !text || !text.trim()) return [];

    const models = ["solar-embedding-1-large-query", "solar-embedding-1-large-passage", "solar-embedding-1-large"];
    for (const model of models) {
      try {
        const res = await fetch("https://api.upstage.ai/v1/solar/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: text.trim(),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const embedding = data.data?.[0]?.embedding;
          if (Array.isArray(embedding) && embedding.length > 0) return embedding;
        }
      } catch (err) {
        console.warn(`Upstage getEmbedding error for model ${model}:`, err);
      }
    }
    return [];
  },

  /**
   * Calculates Cosine Similarity between two embedding vectors
   */
  cosineSimilarity: (v1: number[], v2: number[]): number => {
    if (!v1 || !v2 || v1.length === 0 || v2.length === 0 || v1.length !== v2.length) {
      return 0;
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return parseFloat((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
  },
};
