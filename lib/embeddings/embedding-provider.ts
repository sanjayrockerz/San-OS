// Optional: Disable remote models to force local only
// process.env.allowRemoteModels = "false";

export interface EmbeddingProvider {
  readonly id: string;
  isConfigured(): boolean;
  embedText(text: string): Promise<number[]>;
}

export class XenovaEmbeddingProvider implements EmbeddingProvider {
  readonly id = "xenova-local";
  private extractor: any = null;
  private initializing: Promise<void> | null = null;

  isConfigured(): boolean {
    return true; // Local transformers are always ready (they download on first use)
  }

  private async initialize() {
    if (this.extractor) return;
    if (!this.initializing) {
      this.initializing = (async () => {
        // Use a fast, small embedding model suitable for vectors
        const { pipeline, env } = await import("@xenova/transformers");
        env.allowLocalModels = true;
        
        this.extractor = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5", {
          quantized: true, // Use int8 quantization for faster inference and lower memory
        });
      })();
    }
    await this.initializing;
  }

  async embedText(text: string): Promise<number[]> {
    await this.initialize();
    
    // Output shape is [1, sequence_length, embedding_size]
    const output = await this.extractor(text, { pooling: "mean", normalize: true });
    
    // The output data is a Float32Array. Convert to regular array for pgvector.
    return Array.from(output.data);
  }
}

export class NoopEmbeddingProvider implements EmbeddingProvider {
  readonly id = "noop";
  isConfigured(): boolean {
    return false;
  }
  async embedText(): Promise<number[]> {
    throw new Error("No Embedding Provider configured");
  }
}

// Singleton to avoid memory leaks
let globalProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!globalProvider) {
    const provider = new XenovaEmbeddingProvider();
    globalProvider = provider.isConfigured() ? provider : new NoopEmbeddingProvider();
  }
  return globalProvider;
}
