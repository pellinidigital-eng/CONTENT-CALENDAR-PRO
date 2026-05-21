import { compactText } from "@/lib/random";

export function textSimilarity(first: string, second: string) {
  const a = new Set(compactText(first));
  const b = new Set(compactText(second));
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  const intersection = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

export function tooSimilar(value: string, previous: string[], threshold = 0.42) {
  return previous.some((item) => textSimilarity(value, item) >= threshold);
}

export function chooseDistinct(
  items: string[],
  random: () => number,
  blocked: string[],
  threshold = 0.42,
  attempts = 10
) {
  const exactBlocked = new Set(blocked);
  const clean = items.filter((item) => !exactBlocked.has(item));
  const source = clean.length > 0 ? clean : items;
  let best = source[Math.floor(random() * source.length) % source.length];
  let bestScore = 1;

  for (let index = 0; index < attempts; index += 1) {
    const candidate = source[Math.floor(random() * source.length) % source.length];
    const score = Math.max(0, ...blocked.map((item) => textSimilarity(candidate, item)));
    if (score < threshold) {
      return candidate;
    }
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
