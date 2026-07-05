export interface BaseProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  health(): Promise<ProviderHealth>;
}

export interface ProviderHealth {
  status: "healthy" | "degraded" | "unavailable";
  latency?: number;
  error?: string;
  lastChecked: string;
}

export interface LLMProvider extends BaseProvider {
  generateText(prompt: string, options?: LLMOptions): Promise<string>;
  generateJSON<T>(prompt: string, schema: Record<string, unknown>): Promise<T>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface SearchProvider extends BaseProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  index(entityType: string, entityId: string, content: string): Promise<void>;
}

export interface SearchOptions {
  limit?: number;
  entityTypes?: string[];
  threshold?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  entityType: string;
  entityId: string;
  score: number;
  href: string;
}

export interface CalendarProvider extends BaseProvider {
  getEvents(from: string, to: string): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent>;
  updateEvent(event: CalendarEvent): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
}

export interface NotificationProvider_ extends BaseProvider {
  send(title: string, body: string, options?: NotificationSendOptions): Promise<void>;
  sendToUser(userId: string, title: string, body: string, options?: NotificationSendOptions): Promise<void>;
}

export interface NotificationSendOptions {
  href?: string;
  icon?: string;
  priority?: "low" | "normal" | "high";
  tag?: string;
}

export interface SpeechProvider extends BaseProvider {
  transcribe(audio: Blob | Buffer, options?: SpeechOptions): Promise<string>;
  synthesize(text: string, options?: SpeechOptions): Promise<Buffer>;
}

export interface SpeechOptions {
  language?: string;
  model?: string;
  voice?: string;
}

export interface OCRProvider extends BaseProvider {
  recognizeText(image: Blob | Buffer | string): Promise<string>;
  recognizeStructured<T>(image: Blob | Buffer | string): Promise<T>;
}

export interface EmbeddingProvider_ extends BaseProvider {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  similarity(a: number[], b: number[]): number;
}

export interface PlannerProvider_ extends BaseProvider {
  generatePlan(userId: string, date: string): Promise<unknown>;
  adjustPlan(userId: string, adjustments: unknown): Promise<unknown>;
}
