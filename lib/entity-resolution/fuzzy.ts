export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[] = new Array(bn + 1);
  for (let i = 0; i <= bn; i++) matrix[i] = i;
  for (let i = 1; i <= an; i++) {
    let prev = i;
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        prev + 1,
        matrix[j] + 1,
        matrix[j - 1] + cost,
      );
      matrix[j - 1] = prev;
      prev = val;
    }
    matrix[bn] = prev;
  }
  return matrix[bn];
}

export function wordInsightScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (t === q) return 1;
  if (t.includes(q) || q.includes(t)) return 0.9;
  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/).filter(Boolean);
  if (qWords.length === 0 || tWords.length === 0) return 0;
  const matched = qWords.filter(w => tWords.some(tw => tw.includes(w) || w.includes(tw)));
  const wordRatio = matched.length / Math.max(qWords.length, tWords.length);
  const distance = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  const editRatio = maxLen > 0 ? 1 - distance / maxLen : 0;
  return Math.max(wordRatio * 0.6 + editRatio * 0.4, 0);
}

export function acronymMatch(query: string, target: string): boolean {
  const q = normalize(query);
  if (q.length < 2 || q.length > 5) return false;
  const t = normalize(target);
  const acronym = t.split(/\s+/).map(w => w[0]).join("");
  return acronym === q;
}

export function fuzzyMatch(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (c === q) return 1;
  if (acronymMatch(query, candidate)) return 0.85;
  return wordInsightScore(q, c);
}
