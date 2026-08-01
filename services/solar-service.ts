const SOLAR_API_URL = "https://api.upstage.ai/v1/solar/chat/completions";

export type SolarChatOptions = {
  temperature?: number;
  responseFormatJson?: boolean;
  systemPrompt?: string;
};

const getApiKey = (): string => {
  return (
    process.env.UPSTAGE_API_KEY ||
    process.env.NEXT_PUBLIC_UPSTAGE_API_KEY ||
    ""
  ).trim();
};

/**
 * Service to call Upstage Solar Pro 3 LLM with specified temperature and JSON mode
 */
export const solarService = {
  generateText: async (
    userPrompt: string,
    options: SolarChatOptions = {}
  ): Promise<string> => {
    const { temperature = 0.3, responseFormatJson = false, systemPrompt = "" } = options;
    const apiKey = getApiKey();

    if (!apiKey) {
      console.warn("UPSTAGE_API_KEY is missing. Using Solar fallback generator.");
      return "";
    }

    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: userPrompt });

      const body: Record<string, any> = {
        model: "solar-pro",
        messages,
        temperature,
      };

      if (responseFormatJson) {
        body.response_format = { type: "json_object" };
      }

      let res = await fetch(SOLAR_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      // If solar-pro returns error (e.g. 404 model not found), retry with solar-1-mini-chat
      if (!res.ok && (res.status === 404 || res.status === 400)) {
        console.warn(`Upstage model 'solar-pro' status ${res.status}. Retrying with 'solar-1-mini-chat'...`);
        body.model = "solar-1-mini-chat";
        res = await fetch(SOLAR_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Solar API Error [HTTP ${res.status}]:`, errText);
        return "";
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.error("Error calling Upstage Solar API:", err);
      return "";
    }
  },
};
