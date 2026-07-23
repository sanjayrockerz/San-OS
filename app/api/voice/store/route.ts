import { NextResponse } from "next/server";
import { getContext } from "@/lib/server/context";

export async function POST(request: Request) {
  try {
    const { user, services } = await getContext();
    const userId = user?.id ?? "dev-user";

    const body = await request.json();
    const { title, transcript, audioUrl, durationSeconds, tags } = body;

    if (!transcript && !audioUrl) {
      return NextResponse.json({ error: "Transcript or audio URL is required" }, { status: 400 });
    }

    const note = await services.voiceRecording.createVoiceNote(userId, {
      title,
      transcript: transcript || "Voice recording captured",
      audioUrl: audioUrl || null,
      durationSeconds: durationSeconds || 0,
      tags: tags || ["voice-recording", "audio"],
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to save voice note" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { user, services } = await getContext();
    const userId = user?.id ?? "dev-user";
    const notes = await services.voiceRecording.listVoiceNotes(userId);
    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ notes: [], error: error?.message });
  }
}
