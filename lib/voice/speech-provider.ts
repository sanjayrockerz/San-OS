/**
 * Voice Intelligence — provider abstraction (§12).
 *
 * Transcription is expressed against a single {@link SpeechProvider} interface so
 * the rest of the app never depends on a concrete engine. The default and only
 * shipped target is **whisper.cpp running locally**, which is free and offline —
 * NO paid speech API is used. Until the user stands up a local whisper.cpp
 * server, {@link getSpeechProvider} returns a {@link NoopSpeechProvider} that
 * fails loudly with setup guidance, keeping the feature architecturally complete
 * but inert.
 *
 * A later provider (cloud, on-device WASM, etc.) only has to implement this
 * interface — callers and the Execution layer stay unchanged.
 */

export type SpeechLanguage = "en" | "ta" | "hi" | "auto" | (string & {});

export interface TranscriptionRequest {
  /** Raw audio bytes (wav/mp3/m4a/ogg — whatever the engine accepts). */
  audio: ArrayBuffer | Uint8Array;
  /** MIME type of the audio, e.g. "audio/wav". */
  mimeType: string;
  /** Hint the spoken language, or "auto" to let the engine detect it. */
  language?: SpeechLanguage;
  /** Optional original filename, used for multipart uploads. */
  filename?: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  /** ISO-639-1 code the engine detected (or was told), if available. */
  detectedLanguage: string | null;
  segments: TranscriptSegment[];
  /** Identifier of the engine that produced this, for provenance. */
  provider: string;
  /** Wall-clock transcription time in ms, if the engine reports it. */
  durationMs: number | null;
}

export interface SpeechProvider {
  readonly id: string;
  /** True when the provider is configured and can actually transcribe. */
  isConfigured(): boolean;
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

/** Thrown when transcription is attempted without a configured backend. */
export class SpeechProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpeechProviderNotConfiguredError";
  }
}

/**
 * Local whisper.cpp provider. Targets the `server` example that ships with
 * whisper.cpp, which exposes an OpenAI-compatible-ish `/inference` endpoint
 * accepting a multipart `file` field and returning `{ text, ... }`.
 *
 * Run it locally (free, offline), e.g.:
 *   ./server -m models/ggml-base.bin --host 127.0.0.1 --port 8080
 * then set WHISPER_ENDPOINT=http://127.0.0.1:8080/inference
 *
 * No API key, no network egress beyond localhost.
 */
export class LocalWhisperProvider implements SpeechProvider {
  readonly id = "whisper.cpp-local";

  constructor(private readonly endpoint: string | undefined = process.env.WHISPER_ENDPOINT) {}

  isConfigured(): boolean {
    return typeof this.endpoint === "string" && this.endpoint.length > 0;
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    if (!this.endpoint) {
      throw new SpeechProviderNotConfiguredError(
        "WHISPER_ENDPOINT is not set. Start a local whisper.cpp server and point WHISPER_ENDPOINT at its /inference URL.",
      );
    }

    const started = Date.now();
    const view = request.audio instanceof Uint8Array ? request.audio : new Uint8Array(request.audio);
    // Copy into a plain ArrayBuffer so the Blob part type is unambiguous.
    const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
    const form = new FormData();
    form.append(
      "file",
      new Blob([buffer], { type: request.mimeType }),
      request.filename ?? "capture.wav",
    );
    form.append("response_format", "json");
    if (request.language && request.language !== "auto") {
      form.append("language", request.language);
    }

    const res = await fetch(this.endpoint, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error(`whisper.cpp server returned ${res.status}: ${await res.text().catch(() => "")}`);
    }

    const payload = (await res.json()) as {
      text?: string;
      language?: string;
      segments?: Array<{ start?: number; end?: number; text?: string }>;
    };

    return {
      text: (payload.text ?? "").trim(),
      detectedLanguage: payload.language ?? (request.language && request.language !== "auto" ? request.language : null),
      segments: (payload.segments ?? []).map((s) => ({
        start: s.start ?? 0,
        end: s.end ?? 0,
        text: (s.text ?? "").trim(),
      })),
      provider: this.id,
      durationMs: Date.now() - started,
    };
  }
}

/** Inert fallback — keeps callers total while no backend is configured. */
export class NoopSpeechProvider implements SpeechProvider {
  readonly id = "noop";
  isConfigured(): boolean {
    return false;
  }
  async transcribe(): Promise<TranscriptionResult> {
    throw new SpeechProviderNotConfiguredError(
      "No speech provider configured. Set SPEECH_PROVIDER=whisper and WHISPER_ENDPOINT to enable free local transcription via whisper.cpp.",
    );
  }
}

/**
 * Resolves the active provider from env. `SPEECH_PROVIDER=whisper` selects the
 * local whisper.cpp backend; anything else (or an unconfigured whisper) yields
 * the Noop provider. Deterministic and side-effect free.
 */
export function getSpeechProvider(): SpeechProvider {
  if ((process.env.SPEECH_PROVIDER ?? "").toLowerCase() === "whisper") {
    const provider = new LocalWhisperProvider();
    if (provider.isConfigured()) return provider;
  }
  return new NoopSpeechProvider();
}
