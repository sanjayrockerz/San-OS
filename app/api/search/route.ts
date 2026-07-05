import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRepositories } from "@/lib/repositories";
import { UniversalSearchService } from "@/lib/services/universal-search.service";

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
  
  try {
    const rawResults = await searchService.search(user.id, q);
    
    // Map to the existing SearchResult structure for the frontend
    const results: SearchResult[] = rawResults.map(r => {
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

    return NextResponse.json(results);
  } catch (e) {
    console.error("Universal Search Error", e);
    return NextResponse.json([]);
  }
}
