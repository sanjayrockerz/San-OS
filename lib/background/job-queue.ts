export type JobType = "ocr" | "speech_transcription" | "pdf_parsing" | "vector_embedding" | "summary_generation";

export interface BackgroundJob {
  id: string;
  userId: string;
  type: JobType;
  payload: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  retryCount: number;
  maxRetries: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export class BackgroundJobQueue {
  private static queue: BackgroundJob[] = [];
  private static deadLetterQueue: BackgroundJob[] = [];

  static enqueue(userId: string, type: JobType, payload: Record<string, any>): BackgroundJob {
    const job: BackgroundJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      type,
      payload,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
    };
    BackgroundJobQueue.queue.push(job);
    
    // Process asynchronously without blocking main thread
    setTimeout(() => {
      BackgroundJobQueue.processJob(job);
    }, 100);

    return job;
  }

  static getJobsForUser(userId: string): BackgroundJob[] {
    return BackgroundJobQueue.queue.filter((j) => j.userId === userId);
  }

  static getDeadLetterJobs(): BackgroundJob[] {
    return BackgroundJobQueue.deadLetterQueue;
  }

  private static async processJob(job: BackgroundJob): Promise<void> {
    job.status = "processing";
    try {
      // Simulate heavy processing non-blockingly
      switch (job.type) {
        case "ocr":
        case "pdf_parsing":
          // Extract text payload
          break;
        case "speech_transcription":
          // Process audio transcript
          break;
        case "vector_embedding":
          // Generate 384-d embeddings
          break;
        case "summary_generation":
          // AI summarization
          break;
      }
      job.status = "completed";
      job.completedAt = new Date().toISOString();
    } catch (err: any) {
      job.retryCount++;
      if (job.retryCount >= job.maxRetries) {
        job.status = "failed";
        job.error = err?.message || "Job processing failed after max retries";
        BackgroundJobQueue.deadLetterQueue.push(job);
      } else {
        job.status = "pending";
        // Exponential backoff retry
        setTimeout(() => {
          BackgroundJobQueue.processJob(job);
        }, job.retryCount * 500);
      }
    }
  }
}
