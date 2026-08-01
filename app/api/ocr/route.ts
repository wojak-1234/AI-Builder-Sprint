import { NextRequest, NextResponse } from "next/server";
import { ocrExtractorAgent } from "@/lib/agents/ocr-extractor-agent";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let extracted;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      extracted = await ocrExtractorAgent.extract(buffer, file.type);
    } else {
      const body = await req.json();
      const textInput = body.text || "";
      extracted = await ocrExtractorAgent.extract(textInput);
    }

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (err: any) {
    console.error("API /api/ocr error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
