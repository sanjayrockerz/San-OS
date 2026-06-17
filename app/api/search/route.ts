import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const services = createServices(supabase);
  const results: SearchResult[] = [];

  const [problems, concepts, vault] = await Promise.all([
    services.repos.problems.listVisible(user.id).catch(() => []),
    services.repos.concepts.findByUser(user.id).catch(() => []),
    services.repos.knowledge.recent(user.id, 50).catch(() => []),
  ]);

  for (const p of problems) {
    if (p.title.toLowerCase().includes(q)) {
      results.push({
        id: `problem-${p.id}`,
        label: p.title,
        sub: `${p.difficulty ?? "—"} · ${p.platform ?? ""}`,
        group: "Problems",
        href: `/problems/${p.id}`,
      });
    }
  }

  for (const c of concepts) {
    if (c.title.toLowerCase().includes(q)) {
      results.push({
        id: `concept-${c.id}`,
        label: c.title,
        sub: `Concept · ${c.status}`,
        group: "Concepts",
        href: `/concepts/${c.id}`,
      });
    }
  }

  for (const k of vault) {
    if (k.title.toLowerCase().includes(q)) {
      results.push({
        id: `vault-${k.id}`,
        label: k.title,
        sub: `Vault · ${k.type}`,
        group: "Knowledge Vault",
        href: "/vault",
      });
    }
  }

  return NextResponse.json(results.slice(0, 12));
}
