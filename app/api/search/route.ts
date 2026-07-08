import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRepositories } from "@/lib/repositories";
import { UniversalSearchService } from "@/lib/services/universal-search.service";
import { SemanticMemoryService } from "@/lib/services/semantic-memory.service";
import { getEmbeddingProvider } from "@/lib/embeddings/embedding-provider";

export interface SearchResult {
  id: string;
  label: string;
  sub: string;
  group: string;
  href: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json([], { status: 401 });

  const repos = createRepositories(supabase);
  const searchService = new UniversalSearchService(repos);
  const semanticService = new SemanticMemoryService(repos);
  
  try {
    const rawResults = await searchService.search(user.id, q);
    
    // Attempt semantic search for better results as a fallback/enhancement
    let seenIds = new Set(rawResults.map(r => r.id));
    let additionalResults: SearchResult[] = [];

    const embeddingProvider = getEmbeddingProvider();
    if (embeddingProvider.isConfigured()) {
      try {
        const semanticResults = await semanticService.search(user.id, q, 5, 0.5);
        for (const sr of semanticResults) {
          if (!seenIds.has(sr.id)) {
            seenIds.add(sr.id);
            let group = "Memory Graph";
            if (sr.source === "capture") group = "Captures";
            else if (sr.source === "knowledge") group = "Knowledge";
            else if (sr.source === "event") group = "Events";

            additionalResults.push({
              id: sr.id,
              label: sr.content.slice(0, 80) || "Semantic match",
              sub: `Similarity ${(sr.similarity * 100).toFixed(0)}%`,
              group,
              href: sr.source === "knowledge" ? `/concepts/${sr.id}` : 
                    sr.source === "capture" ? `/vault` : `/notifications`,
            });
          }
        }
      } catch {
        // Semantic search is best-effort; fall through to ILIKE-only results
      }
    }

    // Map ILIKE results to SearchResult structure
    const ilikeResults: SearchResult[] = rawResults.map(r => {
      let group = "Other";
      if (r.type === "problem") group = "Problems";
      else if (r.type === "concept") group = "Concepts";
      else if (r.type === "resource") group = "Resources";
      else if (r.type === "project") group = "Projects";
      else if (r.type === "memory") group = "Memory Graph";
      
      return {
        id: r.id,
        label: r.title,
        sub: r.description || `${r.type} match`,
        group,
        href: r.url,
      };
    });

    // Merge and deduplicate: ILIKE results first (higher precision), then semantic
    const results = [...ilikeResults, ...additionalResults];

    return NextResponse.json(results);
  } catch (e) {
    console.error("Universal Search Error", e);
    return NextResponse.json([]);
  }
}
