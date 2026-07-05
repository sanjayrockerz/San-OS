/**
 * Voice Intelligence barrel (§12).
 *
 * Exposes the {@link SpeechProvider} abstraction and a single high-level helper
 * that turns spoken audio into structured, classified execution items by piping
 * the transcript through the same deterministic Brain-Dump parser used for typed
 * capture. Voice therefore produces the exact same structured data as text — one
 * classification pipeline, no duplication (§16).
 */
export * from "./speech-provider";

import { parseBrainDump, type ParsedCaptureItem } from "@/lib/execution/brain-dump";
import {
  getSpeechProvider,
  type SpeechProvider,
  type TranscriptionRequest,
  type TranscriptionResult,
} from "./speech-provider";

export interface VoiceCaptureResult {
  transcription: TranscriptionResult;
  /** Structured items extracted from the transcript (tasks, meetings, ideas…). */
  items: ParsedCaptureItem[];
}

/**
 * Transcribes audio (free/local) and extracts structured capture items from the
 * result. The caller persists `items` via the same path as typed Brain Dump.
 */
export async function transcribeAndExtract(
  request: TranscriptionRequest,
  provider: SpeechProvider = getSpeechProvider(),
): Promise<VoiceCaptureResult> {
  const transcription = await provider.transcribe(request);
  return { transcription, items: parseBrainDump(transcription.text) };
}
