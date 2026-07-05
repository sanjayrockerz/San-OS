import type { LLMProvider, LLMOptions, ProviderHealth } from "./types";

export class NoopLLMProvider implements LLMProvider {
  readonly id = "noop-llm";
  readonly name = "No-op LLM Provider";

  isAvailable(): boolean {
    return false;
  }

  async health(): Promise<ProviderHealth> {
    return { status: "unavailable", lastChecked: new Date().toISOString() };
  }

  async generateText(): Promise<string> {
    throw new Error("No LLM provider configured");
  }

  async generateJSON<T>(): Promise<T> {
    throw new Error("No LLM provider configured");
  }
}

export class OpenAILikeProvider implements LLMProvider {
  readonly id = "openai-like";
  readonly name = "OpenAI-compatible Provider";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    this.defaultModel = config.model ?? "gpt-4o";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async health(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return {
        status: res.ok ? "healthy" : "degraded",
        latency: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      return { status: "unavailable", lastChecked: new Date().toISOString() };
    }
  }

  async generateText(prompt: string, options?: LLMOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model ?? this.defaultModel,
        messages: [
          ...(options?.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) throw new Error(`LLM API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateJSON<T>(prompt: string, schema: Record<string, unknown>): Promise<T> {
    const text = await this.generateText(prompt, {
      systemPrompt: "You must respond with valid JSON only, no markdown formatting.",
      temperature: 0.1,
    });
    return JSON.parse(text) as T;
  }
}
