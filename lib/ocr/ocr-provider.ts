import { createWorker } from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProvider {
  readonly id: string;
  isConfigured(): boolean;
  extractText(imageBuffer: Buffer | Uint8Array | Blob): Promise<OCRResult>;
}

export class TesseractOCRProvider implements OCRProvider {
  readonly id = "tesseract-local";

  isConfigured(): boolean {
    return true; // tesseract.js is self-contained
  }

  async extractText(imageBuffer: Buffer | Uint8Array | Blob): Promise<OCRResult> {
    const worker = await createWorker("eng");
    
    let input: Buffer;
    
    if (imageBuffer instanceof Blob) {
      input = Buffer.from(await imageBuffer.arrayBuffer());
    } else {
      input = Buffer.from(imageBuffer);
    }

    try {
      // Pass the buffer directly to Tesseract
      // Note: In browser context this might need special handling, but in Node/Edge it handles buffers
      const { data } = await worker.recognize(input);
      return {
        text: data.text.trim(),
        confidence: data.confidence,
      };
    } finally {
      await worker.terminate();
    }
  }
}

export class NoopOCRProvider implements OCRProvider {
  readonly id = "noop";
  isConfigured(): boolean {
    return false;
  }
  async extractText(): Promise<OCRResult> {
    throw new Error("No OCR Provider configured");
  }
}

export function getOCRProvider(): OCRProvider {
  const provider = new TesseractOCRProvider();
  return provider.isConfigured() ? provider : new NoopOCRProvider();
}
