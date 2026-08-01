import { upstageService } from "@/services/upstage-service";
import { EntityType, ExtractedEntity } from "@/lib/analytics/mindmap-analyzer";

export type OcrExtractorOutput = {
  text: string;
  entities: ExtractedEntity[];
  confidence: number;
  needsRecapture?: boolean;
};

export const ocrExtractorAgent = {
  /**
   * [Agent 1] ocr-extractor
   * Parses uploaded letter/journal images or text answers using Upstage Document Parse & IE.
   * Extracts 11 entity types: person, place, object, time_period, food, occasion, activity, sensory, animal, emotion, event.
   */
  extract: async (
    inputBufferOrText: Buffer | string,
    mimeType: string = "text/plain",
    sourceAnswerId?: string
  ): Promise<OcrExtractorOutput> => {
    try {
      let rawText = "";

      if (typeof inputBufferOrText === "string") {
        rawText = inputBufferOrText;
      } else {
        // Upstage Document Parse for Image/PDF
        const parseResult = await upstageService.parseDocument(inputBufferOrText, mimeType);
        rawText = parseResult.text;
        if (parseResult.confidence < 0.6) {
          return {
            text: rawText,
            entities: [],
            confidence: parseResult.confidence,
            needsRecapture: true,
          };
        }
      }

      // Upstage Information Extraction for 11 entity types
      const ieEntities = await upstageService.extractInformation(rawText);

      const parsedEntities: ExtractedEntity[] = ieEntities.map((item) => ({
        type: item.type as EntityType,
        value: item.value,
        sourceAnswerId,
        lastMentionedAt: new Date().toISOString(),
      }));

      return {
        text: rawText,
        entities: parsedEntities,
        confidence: 0.95,
        needsRecapture: false,
      };
    } catch (err) {
      console.error("Error in Agent 1 (ocr-extractor):", err);
      return {
        text: typeof inputBufferOrText === "string" ? inputBufferOrText : "",
        entities: [],
        confidence: 0.5,
        needsRecapture: true,
      };
    }
  },
};
