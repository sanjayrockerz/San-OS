/**
 * Live voice capture — provider abstraction (§12).
 *
 * Complements the file-based {@link SpeechProvider} (whisper.cpp) with a
 * *streaming*, in-browser transcriber. The shipped implementation,
 * {@link WebSpeechProvider}, uses the browser's built-in Web Speech API — free,
 * zero-install, no credentials. Where it isn't available the factory returns a
 * {@link NoopLiveSpeechProvider} so callers can degrade to typing.
 *
 * Business logic depends only on {@link LiveSpeechProvider}; swapping in an
 * on-device WASM model later touches nothing else.
 */

export type SpeechLang = "en-US" | "ta-IN" | "hi-IN" | (string & {});

export interface LiveTranscript {
  /** Full transcript so far (final + interim), ready to display/submit. */
  text: string;
  /** True once the recogniser has committed this chunk. */
  isFinal: boolean;
}

export interface LiveSpeechSession {
  stop(): void;
}

export interface LiveSpeechStartOptions {
  lang?: SpeechLang;
  onTranscript: (t: LiveTranscript) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export interface LiveSpeechProvider {
  readonly id: string;
  isSupported(): boolean;
  start(options: LiveSpeechStartOptions): LiveSpeechSession;
}

// --- Minimal Web Speech API typings (not in the standard TS lib.dom) ---------

interface SpeechAlternative {
  readonly transcript: string;
}
interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative;
}
interface SpeechResultList {
  readonly length: number;
  readonly [index: number]: SpeechResult;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}
interface SpeechRecognitionErrorEventLike {
  readonly error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser Web Speech API provider — free, no install, no credentials. */
export class WebSpeechProvider implements LiveSpeechProvider {
  readonly id = "web-speech";

  isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  start(options: LiveSpeechStartOptions): LiveSpeechSession {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      options.onError?.("Speech recognition isn't supported in this browser.");
      return { stop() {} };
    }

    const recognition = new Ctor();
    recognition.lang = options.lang ?? "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    // Accumulate committed text; append interim on top for a live preview.
    let finalText = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += chunk;
        else interim += chunk;
      }
      const text = (finalText + interim).replace(/\s+/g, " ").trimStart();
      options.onTranscript({ text, isFinal: interim.length === 0 });
    };

    recognition.onerror = (event) => {
      options.onError?.(mapError(event.error));
    };
    recognition.onend = () => options.onEnd?.();

    try {
      recognition.start();
    } catch {
      // start() throws if already running — safe to ignore.
    }

    return {
      stop() {
        try {
          recognition.stop();
        } catch {
          /* ignore */
        }
      },
    };
  }
}

/** Inert provider for SSR / unsupported browsers. */
export class NoopLiveSpeechProvider implements LiveSpeechProvider {
  readonly id = "noop";
  isSupported(): boolean {
    return false;
  }
  start(options: LiveSpeechStartOptions): LiveSpeechSession {
    options.onError?.("Voice capture is unavailable — type your note instead.");
    return { stop() {} };
  }
}

function mapError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied.";
    case "no-speech":
      return "No speech detected — try again.";
    case "audio-capture":
      return "No microphone found.";
    case "network":
      return "Network error during recognition.";
    default:
      return `Voice capture error: ${code}`;
  }
}

let cached: LiveSpeechProvider | null = null;

/** Resolves the active live-speech provider (Web Speech where available). */
export function getLiveSpeechProvider(): LiveSpeechProvider {
  if (cached) return cached;
  const web = new WebSpeechProvider();
  cached = web.isSupported() ? web : new NoopLiveSpeechProvider();
  return cached;
}
