const UPSTAGE_API_URL = "https://api.upstage.ai/v1/document-digitization";

export type UpstageParseResult = {
  text: string;
  elements: Array<{
    type: string;
    text: string;
    boundingBox?: number[][];
  }>;
};

export const upstageService = {
  /**
   * Sends a document (image/PDF) to Upstage Document Parse API
   * Falls back to a mock result if the API key is not configured
   */
  parseDocument: async (file: File): Promise<UpstageParseResult> => {
    const apiKey = process.env.NEXT_PUBLIC_UPSTAGE_API_KEY || process.env.UPSTAGE_API_KEY;

    if (!apiKey) {
      console.warn("Upstage API Key missing. Returning high-fidelity mock OCR transcription.");
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Look at the file name or properties to mock different types of handwriting/letters
      if (file.name.includes("letter") || file.name.includes("편지")) {
        return {
          text: `사랑하는 영이에게.\n\n날씨가 많이 춥구나. 밥은 잘 챙겨 먹고 다니는지 걱정되는구나. 엄마는 요새 동네 복지관에서 노래교실도 다니고 건강하게 잘 지내고 있다.\n어제는 옛날 앨범을 들춰보았는데 네가 유치원 다닐 때 노란 원피스를 입고 재롱잔치 하던 사진이 있더구나. 그땐 참 예쁘고 작았는데 언제 이렇게 커서 시집을 갔는지 세월이 참 빠르다. 몸 조심하고 보고 싶구나.\n\n1995년 12월 5일 엄마가.`,
          elements: [
            { type: "paragraph", text: "사랑하는 영이에게." },
            { type: "paragraph", text: "날씨가 많이 춥구나. 밥은 잘 챙겨 먹고 다니는지 걱정되는구나." },
            { type: "paragraph", text: "엄마는 요새 동네 복지관에서 노래교실도 다니고 건강하게 잘 지내고 있다." },
            { type: "paragraph", text: "어제는 옛날 앨범을 들춰보았는데 네가 유치원 다닐 때 노란 원피스를 입고 재롱잔치 하던 사진이 있더구나. 그땐 참 예쁘고 작았는데 언제 이렇게 커서 시집을 갔는지 세월이 참 빠르다." },
            { type: "paragraph", text: "몸 조심하고 보고 싶구나." },
            { type: "paragraph", text: "1995년 12월 5일 엄마가." }
          ]
        };
      }

      // Default mock diary page
      return {
        text: `1972년 8월 15일. 맑음.\n\n오늘 드디어 우리 선우 돌잔치를 했다. 삼촌네랑 이모네랑 다 마당에 모여서 떡도 해 먹고 시끌벅작하게 잔치를 치렀다. 선우 녀석이 돌잡이 때 연필을 덥석 쥐더구나. 공부를 열심히 하려는지 영리하게 생겼다. 건강하고 무럭무럭만 자라다오 선우야. 온 가족이 기쁜 날이었다.`,
        elements: [
          { type: "heading", text: "1972년 8월 15일. 맑음." },
          { type: "paragraph", text: "오늘 드디어 우리 선우 돌잔치를 했다. 삼촌네랑 이모네랑 다 마당에 모여서 떡도 해 먹고 시끌벅작하게 잔치를 치렀다." },
          { type: "paragraph", text: "선우 녀석이 돌잡이 때 연필을 덥석 쥐더구나. 공부를 열심히 하려는지 영리하게 생겼다." },
          { type: "paragraph", text: "건강하고 무럭무럭만 자라다오 선우야. 온 가족이 기쁜 날이었다." }
        ]
      };
    }

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("model", "document-parse");

      const response = await fetch(UPSTAGE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upstage API returned status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Parse markdown or elements from Upstage JSON structure
      const text = data.text || "";
      const elements = data.elements || [];
      
      return {
        text,
        elements: elements.map((el: any) => ({
          type: el.type || "paragraph",
          text: el.text || "",
          boundingBox: el.bounding_box || undefined
        }))
      };
    } catch (error) {
      console.error("Error in Upstage parsing:", error);
      throw error;
    }
  }
};
