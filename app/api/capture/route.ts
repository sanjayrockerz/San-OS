import { NextRequest, NextResponse } from "next/server";
import { getOCRProvider } from "@/lib/ocr/ocr-provider";
import { getSpeechProvider } from "@/lib/voice/speech-provider";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    let textToProcess = "";
    const services = createServices(await createClient());

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      textToProcess = body.content;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as Blob | null;

      if (!file) {
        return NextResponse.json({ error: "No file or text provided" }, { status: 400 });
      }

      const mimeType = file.type;

      if (mimeType.startsWith("image/")) {
        const ocr = getOCRProvider();
        if (ocr.isConfigured()) {
          const arrayBuffer = await file.arrayBuffer();
          // Use Buffer directly in Node.js
          const buffer = Buffer.from(arrayBuffer);
          const result = await ocr.extractText(buffer);
          textToProcess = result.text;
        } else {
          return NextResponse.json({ error: "OCR not configured" }, { status: 503 });
        }
      } else if (mimeType.startsWith("audio/") || mimeType.startsWith("video/webm")) {
        const speech = getSpeechProvider();
        if (speech.isConfigured()) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await speech.transcribe({
            audio: arrayBuffer,
            mimeType: mimeType,
            language: "auto",
          });
          textToProcess = result.text;
        } else {
          return NextResponse.json({ error: "Speech provider not configured" }, { status: 503 });
        }
      } else {
        // Fallback for PDFs or other docs currently not supported by free local OCR out-of-the-box
        return NextResponse.json({ error: "Unsupported file type for universal capture yet." }, { status: 400 });
      }
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      return NextResponse.json({ error: "No text could be extracted" }, { status: 400 });
    }

    // Pass the extracted text to Brain Dump for parsing and categorization
    const result = await services.executionEngine.captureBrainDump(user.id, textToProcess);
    
    // Also store semantic memory
    for (const item of result.items) {
      if (item.captureId) {
        // Background async embedding
        services.semanticMemory.indexText(user.id, "capture", item.captureId, item.content).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      extractedText: textToProcess,
      created: result.created,
      items: result.items,
    });
  } catch (error) {
    console.error("Universal capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
