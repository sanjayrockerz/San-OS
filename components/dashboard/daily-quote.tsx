import { Quote } from "lucide-react";

import { Section } from "@/components/layout/page-transition";

const QUOTES: { text: string; author: string }[] = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "We are what we repeatedly do. Excellence is not an act but a habit.", author: "Will Durant" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Small daily improvements lead to staggering long-term results.", author: "Robin Sharma" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Patience and persistence have a magical effect before which difficulties disappear.", author: "John Quincy Adams" },
  { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Stable daily quote — same one all day, rotates by day-of-year so it doesn't flicker between renders. */
export function DailyQuote() {
  const quote = QUOTES[dayOfYear(new Date()) % QUOTES.length];

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <Quote className="size-5 text-primary/60" />
        <p className="mt-2 text-sm leading-relaxed text-foreground">{quote.text}</p>
        <p className="mt-2 text-xs text-muted-foreground">— {quote.author}</p>
      </div>
    </Section>
  );
}
