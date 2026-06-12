/**
 * Storage bucket definitions for SanOS / DSA OS.
 *
 * These are declarative definitions only — no buckets are created and no files
 * are uploaded in this phase. They serve as the single source of truth for
 * bucket names, visibility, and upload constraints so that a later phase (or a
 * provisioning migration / script) can create them consistently.
 */

export const BUCKETS = {
  AVATARS: "avatars",
  CONCEPT_IMAGES: "concept-images",
  PROBLEM_SCREENSHOTS: "problem-screenshots",
  IIT_DOCUMENTS: "iit-documents",
  ATTACHMENTS: "attachments",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export interface BucketDefinition {
  /** Bucket id/name as it exists in Supabase Storage. */
  id: BucketName;
  /** Public buckets serve files over a CDN URL without a signed token. */
  public: boolean;
  /** Max upload size in bytes (null = use project default). */
  fileSizeLimit: number | null;
  /** Allowed MIME types (null = allow any). */
  allowedMimeTypes: string[] | null;
  /** Human description of intended contents. */
  description: string;
}

const MB = 1024 * 1024;

const IMAGE_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DOCUMENT_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

export const BUCKET_DEFINITIONS: Record<BucketName, BucketDefinition> = {
  [BUCKETS.AVATARS]: {
    id: BUCKETS.AVATARS,
    public: true,
    fileSizeLimit: 2 * MB,
    allowedMimeTypes: IMAGE_MIME,
    description: "User profile avatars.",
  },
  [BUCKETS.CONCEPT_IMAGES]: {
    id: BUCKETS.CONCEPT_IMAGES,
    public: true,
    fileSizeLimit: 5 * MB,
    allowedMimeTypes: IMAGE_MIME,
    description: "Diagrams and images attached to concept notes.",
  },
  [BUCKETS.PROBLEM_SCREENSHOTS]: {
    id: BUCKETS.PROBLEM_SCREENSHOTS,
    public: false,
    fileSizeLimit: 5 * MB,
    allowedMimeTypes: IMAGE_MIME,
    description: "Screenshots of problem statements and submissions.",
  },
  [BUCKETS.IIT_DOCUMENTS]: {
    id: BUCKETS.IIT_DOCUMENTS,
    public: false,
    fileSizeLimit: 25 * MB,
    allowedMimeTypes: DOCUMENT_MIME,
    description: "IIT workspace documents (PDFs, notes, references).",
  },
  [BUCKETS.ATTACHMENTS]: {
    id: BUCKETS.ATTACHMENTS,
    public: false,
    fileSizeLimit: 25 * MB,
    allowedMimeTypes: null,
    description: "Generic attachments not covered by a dedicated bucket.",
  },
};

/** All bucket definitions as an array — convenient for provisioning loops. */
export const ALL_BUCKETS: BucketDefinition[] = Object.values(BUCKET_DEFINITIONS);
