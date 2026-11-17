// B-Baum nach den Vorlesungsfolien: Grad m, jeder Knoten (ausser der Wurzel) hat mindestens m
// und hoechstens 2m Records. Eingefuegt wird immer in ein Blatt. Bei 2m+1 Records wandert der
// mittlere Record in den Vaterknoten, die linken und rechten Records werden zwei neue Knoten.
// Der Split kann sich bis zur Wurzel fortsetzen; dann entsteht eine neue Wurzel.

export type BNode = { keys: number[]; children: BNode[] };

const clone = (b: BNode): BNode => ({ keys: [...b.keys], children: b.children.map(clone) });

type Up = { key: number; right: BNode } | null;

function insertInto(node: BNode, key: number, m: number, state: { dup: boolean; split: boolean }): Up {
  if (node.keys.includes(key)) {
    state.dup = true;
    return null;
  }
  let pos = node.keys.findIndex((k) => key < k);
  if (pos < 0) pos = node.keys.length;
  if (node.children.length === 0) {
    node.keys.splice(pos, 0, key);
  } else {
    const up = insertInto(node.children[pos], key, m, state);
    if (!up) return null;
    node.keys.splice(pos, 0, up.key);
    node.children.splice(pos + 1, 0, up.right);
  }
  if (node.keys.length <= 2 * m) return null;
  // Ueberlauf: 2m+1 Records, der mittlere (Index m) wandert nach oben
  state.split = true;
  const mid = node.keys[m];
  const right: BNode = { keys: node.keys.slice(m + 1), children: node.children.slice(m + 1) };
  node.keys = node.keys.slice(0, m);
  node.children = node.children.slice(0, m + 1);
  return { key: mid, right };
}

/** Fuegt einen Schluessel ein; der uebergebene Baum bleibt unveraendert */
export function insert(root: BNode | null, key: number, m: number): { root: BNode; split: boolean; duplicate: boolean } {
  if (!root) return { root: { keys: [key], children: [] }, split: false, duplicate: false };
  const next = clone(root);
  const state = { dup: false, split: false };
  const up = insertInto(next, key, m, state);
  const newRoot = up ? { keys: [up.key], children: [next, up.right] } : next;
  return { root: newRoot, split: state.split, duplicate: state.dup };
}

export function build(keys: number[], m: number, start: BNode | null = null): BNode {
  let root = start;
  for (const k of keys) root = insert(root, k, m).root;
  return root ?? { keys: [], children: [] };
}

/** Ebene → Knoten → Schluessel */
export function levels(root: BNode): number[][][] {
  const out: number[][][] = [];
  let cur = [root];
  while (cur.length) {
    out.push(cur.map((n) => n.keys));
    cur = cur.flatMap((n) => n.children);
  }
  return out;
}

export const formatLevels = (lv: number[][][]) => lv.map((l) => l.map((k) => `[${k.join(' ')}]`).join(' ')).join('\n');

/** Je Ebene eine Zeile, Knoten wie "[3 5] [9]" */
export const format = (root: BNode) => formatLevels(levels(root));

/** Liest die ebenenweise Eingabe; null bei leerer oder ungueltiger Eingabe */
export function parseLevels(text: string): number[][][] | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const out: number[][][] = [];
  for (const line of lines) {
    if (!/^(\[[\d\s,;]*\]\s*)+$/.test(line)) return null;
    const nodes = [...line.matchAll(/\[([^\]]*)\]/g)].map((m) =>
      m[1].split(/[\s,;]+/).filter(Boolean).map(Number),
    );
    if (nodes.some((k) => k.length === 0)) return null;
    out.push(nodes);
  }
  return out;
}
