/** n verschiedene ganze Zahlen aus [lo, hi] */
export function distinctInts(n: number, lo: number, hi: number, rnd: () => number = Math.random): number[] {
  const out = new Set<number>();
  while (out.size < Math.min(n, hi - lo + 1)) out.add(lo + Math.floor(rnd() * (hi - lo + 1)));
  return [...out];
}

export const pick = <T,>(xs: readonly T[], rnd: () => number = Math.random): T => xs[Math.floor(rnd() * xs.length)];
