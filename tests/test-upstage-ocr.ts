import { upstageService } from "../services/upstage-service";
import { ocrExtractorAgent } from "../lib/agents/ocr-extractor-agent";
import * as fs from "fs";
import * as path from "path";

// Simple manual loader for .env.local if present
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    });
  }
} catch {
  // Silent catch
}

async function runTargetImageOcrTest() {
  console.log("==================================================");
  console.log("📸 Upstage Document Parse & OCR Test (ocrtest1.jpg)");
  console.log("==================================================\n");

  const apiKey = process.env.UPSTAGE_API_KEY || process.env.NEXT_PUBLIC_UPSTAGE_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  [Notice] UPSTAGE_API_KEY가 .env.local에 설정되지 않았습니다.");
  } else {
    console.log("🔑 UPSTAGE_API_KEY 감지됨\n");
  }

  const targetImagePath = path.join(process.cwd(), "public", "testdata", "ocrtest1.jpg");
  console.log(`🖼️ Target Image Path: ${targetImagePath}`);

  if (!fs.existsSync(targetImagePath)) {
    console.error(`❌ 파일이 존재하지 않습니다: ${targetImagePath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(targetImagePath);
  console.log(`📦 이미지 파일 크기: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

  // 1. Service parseDocument Call
  console.log("--- 1. upstageService.parseDocument 파싱 ---");
  const parseResult = await upstageService.parseDocument(imageBuffer, "image/jpeg");
  console.log("📄 추출된 텍스트:\n", parseResult.text ? `"${parseResult.text}"` : "(텍스트 없음)");
  console.log(`📊 신뢰도 Score: ${parseResult.confidence}\n`);

  // 2. Direct Call to Upstage OCR API (/v1/document-ai/ocr) if available
  if (apiKey) {
    console.log("--- 2. Upstage General OCR API (https://api.upstage.ai/v1/document-ai/ocr) 직접 시도 ---");
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });
      formData.append("document", blob, "ocrtest1.jpg");

      const res = await fetch("https://api.upstage.ai/v1/document-ai/ocr", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        console.log("📄 Upstage General OCR 응답 텍스트:\n", json.text || JSON.stringify(json, null, 2));
        if (json.text && !parseResult.text) {
          parseResult.text = json.text;
        }
      } else {
        console.log(`⚠️ General OCR Endpoint Status: ${res.status} ${res.statusText}`);
      }
    } catch (e: any) {
      console.log("⚠️ General OCR Direct Call warning:", e.message);
    }
  }

  // 3. Information Extraction on extracted text
  const finalExtractedText = parseResult.text || "";
  if (finalExtractedText) {
    console.log("\n==================================================");
    console.log("🏷️ [Agent 1 정보 추출 (11개 엔티티 파싱)]");
    console.log("==================================================");
    const agentOutput = await ocrExtractorAgent.extract(finalExtractedText, "text/plain", "ocrtest1-image");
    console.log(`✅ 추출된 엔티티 개수: ${agentOutput.entities.length}개`);
    console.table(agentOutput.entities.map((e) => ({ 종류: e.type, 값: e.value })));
  } else {
    console.log("\n⚠️ 이미지 내에 인지 가능한 텍스트 글자가 존재하지 않거나, 시각 풍경 사진으로 판단됩니다.");
  }

  console.log("\n==================================================");
  console.log("🎉 ocrtest1.jpg OCR Parse 테스트가 성공적으로 완수되었습니다.");
  console.log("==================================================");
}

runTargetImageOcrTest().catch((err) => {
  console.error("❌ OCR Parse 테스트 오류 발생:", err);
  process.exit(1);
});
