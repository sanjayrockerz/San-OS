import { redirect } from "next/navigation";

/** The Knowledge Vault moved to /vault in Phase 5B.1. Preserve old links. */
export default function KnowledgeVaultRedirect() {
  redirect("/vault");
}
