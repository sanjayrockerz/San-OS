import { LANGUAGE_TEMPLATES } from "./templates";
export { LANGUAGE_TEMPLATES } from "./templates";
export { registerCompletionProviders } from "./completions";

export const LANGUAGES = ["Java", "Python", "C++", "JavaScript", "TypeScript", "C", "Go", "Other"] as const;

export type LanguageLabel = (typeof LANGUAGES)[number];

/** Maps our display labels → Monaco language IDs. */
export const LANGUAGE_MONACO_MAP: Record<string, string> = {
  Java: "java",
  Python: "python",
  "C++": "cpp",
  JavaScript: "javascript",
  TypeScript: "typescript",
  C: "c",
  Go: "go",
  Other: "plaintext",
};

/** Get Monaco language ID from our label. */
export function toMonacoLanguage(label: string): string {
  return LANGUAGE_MONACO_MAP[label] ?? "plaintext";
}

/** Get default template for a language label. */
export function getTemplate(label: string): string {
  return LANGUAGE_TEMPLATES[label] ?? "// Write your solution here";
}
