import { NextRequest, NextResponse } from "next/server";
import { getSpeechProvider } from "@/lib/voice/speech-provider";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const provider = getSpeechProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: "Speech provider not configured." },
        { status: 503 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    // 1. Transcribe the audio
    const transcription = await provider.transcribe({
      audio: arrayBuffer,
      mimeType: file.type,
      filename: "upload.webm",
      language: "auto",
    });

    if (!transcription.text) {
      return NextResponse.json({ error: "Could not transcribe audio" }, { status: 400 });
    }

    // 2. Parse via Universal Intake for full Entity Resolution
    const services = createServices(await createClient());
    const result = await services.universalIntake.process(user.id, {
      text: transcription.text
    });

    return NextResponse.json({
      transcription: transcription.text,
      created: result.knowledgeEntryCreated || result.capturedItems.length > 0,
      items: result.capturedItems,
      domain: result.domain,
      type: result.type,
      project: result.resolvedProject,
      client: result.resolvedClient
    });
  } catch (error) {
    console.error("Voice upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
