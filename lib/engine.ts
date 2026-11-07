/**
 * The typing engine. Pure functions only: every action takes the current
 * lines of a sheet and returns the next lines plus the mechanical "event"
 * it produced, so the UI can play the right sound and motion.
 */

/** Characters per line. Fixed across devices so a page reads the same everywhere. */
export const COLS = 42;
/** Column at which the margin bell rings, like a real machine. */
export const BELL_AT = COLS - 6;

export type Sheet = {
  id: string;
  lines: string[];
  createdAt: number;
};

export type MechEvent =
  | "strike"
  | "space"
  | "bell"
  | "wrap"
  | "return"
  | "backspace"
  | "lineback"
  | "none";

export type Step = { lines: string[]; event: MechEvent };

export function createSheet(): Sheet {
  return {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    lines: [""],
    createdAt: Date.now(),
  };
}

export function typeChar(lines: string[], ch: string): Step {
  const next = lines.slice();
  const i = next.length - 1;
  const cur = next[i];

  if (cur.length < COLS) {
    next[i] = cur + ch;
    if (ch === " ") return { lines: next, event: "space" };
    return { lines: next, event: next[i].length === BELL_AT ? "bell" : "strike" };
  }

  // At the margin. A space simply feeds a new line.
  if (ch === " ") {
    next.push("");
    return { lines: next, event: "wrap" };
  }

  // Carry the unfinished word down to the next line, the way a typist would.
  const lastSpace = cur.lastIndexOf(" ");
  const word = lastSpace >= 0 ? cur.slice(lastSpace + 1) : "";
  if (lastSpace > 0 && word.length > 0 && word.length < COLS / 2) {
    next[i] = cur.slice(0, lastSpace).replace(/\s+$/, "");
    next.push(word + ch);
  } else {
    next.push(ch);
  }
  return { lines: next, event: "wrap" };
}

export function carriageReturn(lines: string[]): Step {
  return { lines: [...lines, ""], event: "return" };
}

export function backspace(lines: string[]): Step {
  const next = lines.slice();
  const i = next.length - 1;
  if (next[i].length > 0) {
    next[i] = next[i].slice(0, -1);
    return { lines: next, event: "backspace" };
  }
  if (next.length > 1) {
    next.pop();
    return { lines: next, event: "lineback" };
  }
  return { lines: next, event: "none" };
}

/** Insert a block of text (paste) without per-character side effects. */
export function typeText(lines: string[], text: string): string[] {
  let next = lines;
  const clean = text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
  for (const ch of clean) {
    if (ch === "\n") next = carriageReturn(next).lines;
    else if (isPrintable(ch)) next = typeChar(next, ch).lines;
  }
  return next;
}

export function isPrintable(ch: string): boolean {
  // One grapheme-ish character that is not a control character.
  return [...ch].length === 1 && !/[\u0000-\u001f\u007f]/.test(ch);
}

export function sheetText(sheet: Sheet): string {
  return sheet.lines.map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
}

export function wordCount(lines: string[]): number {
  const text = lines.join(" ").trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Deterministic pseudo-random in [0, 1) from integers — gives each glyph its own ink. */
export function hash3(a: number, b: number, c: number): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 10000) / 10000;
}
