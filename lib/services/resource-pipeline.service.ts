import { getOCRProvider } from "@/lib/ocr/ocr-provider";
import { getSpeechProvider } from "@/lib/voice/speech-provider";
import type { Repositories } from "@/lib/repositories";
import { ResourceService } from "./resource.service";
import { MemoryGraphService } from "./memory-graph.service";
import { EventService, EVENT_TYPES } from "./event.service";
import crypto from "crypto";

export class ResourcePipelineService {
  private resourceService: ResourceService;
  private memoryGraphService: MemoryGraphService;
  private eventService: EventService;

  constructor(private repos: Repositories) {
    this.resourceService = new ResourceService(repos);
    this.memoryGraphService = new MemoryGraphService(repos);
    this.eventService = new EventService(repos);
  }

  async processUpload(
    userId: string,
    file: File | Blob,
    metadataOverrides: {
      title?: string;
      description?: string;
      resource_type?: string;
    } = {}
  ) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const checksum = hashSum.digest('hex');

    // 1. Determine resource type
    const mimeType = file.type;
    let resourceType = metadataOverrides.resource_type;
    if (!resourceType) {
      if (mimeType.startsWith("image/")) resourceType = "image";
      else if (mimeType.startsWith("video/")) resourceType = "video";
      else if (mimeType.startsWith("audio/")) resourceType = "audio";
      else if (mimeType === "application/pdf") resourceType = "pdf";
      else resourceType = "document";
    }

    const title = metadataOverrides.title || (file instanceof File ? file.name : "Untitled Resource");
    const description = metadataOverrides.description || "";
    const sizeBytes = file.size;

    // 2. Extracted Data Placeholders
    let extractedText = "";
    let aiSummary = "";

    // 3. OCR or Speech Extraction
    if (resourceType === "image") {
      const ocr = getOCRProvider();
      if (ocr.isConfigured()) {
        try {
          const res = await ocr.extractText(buffer);
          extractedText = res.text;
        } catch (e) {
          console.error("OCR extraction failed", e);
        }
      }
    } else if (resourceType === "audio" || resourceType === "video") {
      const speech = getSpeechProvider();
      if (speech.isConfigured()) {
        try {
          const res = await speech.transcribe({
            audio: buffer,
            mimeType: mimeType,
            filename: title,
          });
          extractedText = res.text;
        } catch (e) {
          console.error("Speech transcription failed", e);
        }
      }
    }

    // 4. Deterministic Intelligence Extraction (Phase 7A)
    const extractedEntities: Array<{ type: string; name: string }> = [];
    if (extractedText) {
      aiSummary = extractedText.slice(0, 200) + "...";
      
      // Money Extraction
      const moneyMatches = extractedText.match(/\$?\d+(?:,\d{3})*(?:\.\d{2})?\b/g);
      if (moneyMatches) {
        moneyMatches.forEach(m => extractedEntities.push({ type: "money", name: m }));
      }
      
      // Date Extraction (basic YYYY-MM-DD or MM/DD/YYYY)
      const dateMatches = extractedText.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/g);
      if (dateMatches) {
        dateMatches.forEach(d => extractedEntities.push({ type: "date", name: d }));
      }

      // Email Extraction
      const emailMatches = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) {
        emailMatches.forEach(e => extractedEntities.push({ type: "email", name: e }));
      }
      
      // URL Extraction
      const urlMatches = extractedText.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) {
        urlMatches.forEach(u => extractedEntities.push({ type: "url", name: u }));
      }
      
      // Heuristic Concept Extraction
      const techKeywords = ["React", "TypeScript", "Python", "Node.js", "PostgreSQL", "Supabase", "Docker", "Kubernetes", "AWS"];
      techKeywords.forEach(tech => {
        if (new RegExp(`\\b${tech}\\b`, "i").test(extractedText)) {
          extractedEntities.push({ type: "technology", name: tech });
        }
      });
      
      // Document type heuristics
      if (extractedText.toLowerCase().includes("invoice")) {
        extractedEntities.push({ type: "concept", name: "Invoice" });
      }
      if (extractedText.toLowerCase().includes("meeting")) {
        extractedEntities.push({ type: "concept", name: "Meeting" });
      }
    }

    // 5. Save to Storage (mocked path for now)
    const storagePath = `resources/${userId}/${checksum}-${title}`;

    // 6. Save to DB
    const resource = await this.resourceService.createResource(userId, {
      title,
      description: description || aiSummary,
      resource_type: resourceType,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      checksum,
      storage_path: storagePath,
      metadata: {
        extractedText,
        extractedEntities,
        originalName: title
      }
    });

    // 7. Auto-link to Memory Graph based on deterministic entities
    // Each extracted entity becomes a first-class memory node
    for (const entity of extractedEntities) {
      const node = await this.memoryGraphService.getOrCreateNode(
        userId,
        entity.type,
        entity.name
      );
      
      await this.memoryGraphService.addEdge(
        userId,
        "resource",
        resource.id,
        "memory_node",
        node.id,
        "mentions",
        {},
        0.9, // high confidence for deterministic rules
        `Regex/Heuristic matched ${entity.name}`,
        true
      );
    }

    // 8. Emit Event for Timeline
    await this.eventService.emit(userId, {
      eventType: EVENT_TYPES.ResourceCreated,
      entityType: "resource",
      entityId: resource.id,
      payload: { title }
    });

    return resource;
  }
}
