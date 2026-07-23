import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";
import type { Row } from "@/lib/repositories";

export interface VoiceNoteInput {
  title?: string;
  transcript: string;
  audioUrl?: string;
  durationSeconds?: number;
  tags?: string[];
}

export interface VoiceNoteRecord {
  id: string;
  user_id: string;
  title: string;
  transcript: string;
  audio_url: string | null;
  duration_seconds: number;
  tags: string[];
  created_at: string;
}

/**
 * Service for managing recorded voice notes, audio playback, transcripts,
 * and linking voice messages into the user's Knowledge Vault.
 */
export class VoiceRecordingService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async createVoiceNote(userId: string, input: VoiceNoteInput): Promise<VoiceNoteRecord> {
    const title = input.title || `Voice Note — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    
    // Save into the resources repository as an audio resource
    const res = await this.repos.resources.create({
      user_id: userId,
      title,
      type: "audio",
      url: input.audioUrl ?? null,
      summary: input.transcript,
      tags: input.tags ?? ["voice-recording", "audio"],
      status: "processed",
    });

    return {
      id: res.id,
      user_id: userId,
      title: res.title,
      transcript: res.summary ?? input.transcript,
      audio_url: res.url,
      duration_seconds: input.durationSeconds ?? 0,
      tags: res.tags ?? [],
      created_at: res.created_at,
    };
  }

  async listVoiceNotes(userId: string): Promise<VoiceNoteRecord[]> {
    const items = await this.repos.resources.findByUser(userId);
    return items
      .filter((r: Row<"resources">) => r.type === "audio" || (r.tags && r.tags.includes("voice-recording")))
      .map((res: Row<"resources">) => ({
        id: res.id,
        user_id: res.user_id,
        title: res.title,
        transcript: res.summary ?? "",
        audio_url: res.url,
        duration_seconds: 0,
        tags: res.tags ?? [],
        created_at: res.created_at,
      }));
  }
}
