import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const hasKey = !!apiKey;

// Initialize SDK only if we have a key
const genAI = hasKey ? new GoogleGenerativeAI(apiKey) : null;

export const geminiService = {
  /**
   * Generates a structured JSON output using Gemini API
   * Falls back to a mock response if no API key is present
   */
  generateJSON: async <T>(
    prompt: string,
    schema: any,
    mockFallback: T,
    systemInstruction?: string
  ): Promise<T> => {
    if (!hasKey) {
      console.warn("Gemini API Key missing. Returning mock schema response.");
      // Simulate slight network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return mockFallback;
    }

    try {
      // Use gemini-2.5-flash or gemini-2.0-flash (both support responseSchema)
      const model = genAI!.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1, // Low temp for structured tasks
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      return JSON.parse(text) as T;
    } catch (error) {
      console.error("Gemini API structured call failed. Using fallback:", error);
      return mockFallback;
    }
  },

  /**
   * Simple text generation for general LLM work (if needed)
   */
  generateText: async (prompt: string, systemInstruction?: string): Promise<string> => {
    if (!hasKey) {
      console.warn("Gemini API Key missing. Returning fallback plain text.");
      return "이것은 제미나이 API 키가 제공되지 않았을 때 반환되는 가상의 텍스트입니다. 실제 질문이나 서사 분석을 위해서는 API 키 등록이 필요합니다.";
    }

    try {
      const model = genAI!.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent(prompt);
      return result.response.text() || "";
    } catch (error) {
      console.error("Gemini API text call failed:", error);
      throw error;
    }
  }
};
