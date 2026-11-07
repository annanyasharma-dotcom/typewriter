/**
 * Layout of the machine's keyboard. Each key is identified by its
 * KeyboardEvent.code, so physical and on-screen presses share one id.
 */

export type KeyKind = "char" | "shift" | "lock" | "backspace" | "return";

export type KeyDef = {
  code: string;
  kind: KeyKind;
  /** Character typed without shift (for "char" keys). */
  base?: string;
  /** Character typed with shift. */
  shifted?: string;
  /** Legend shown on the key top. */
  label: string;
  /** Small legend shown above the main one. */
  sub?: string;
  /** Width multiplier for oblong keys. */
  span?: number;
};

const c = (code: string, base: string, shifted: string, sub?: string): KeyDef => ({
  code,
  kind: "char",
  base,
  shifted,
  label: /[a-z]/.test(base) ? base.toUpperCase() : base,
  sub,
});

export const ROWS: KeyDef[][] = [
  [
    c("Digit1", "1", "!", "!"),
    c("Digit2", "2", "@", "@"),
    c("Digit3", "3", "#", "#"),
    c("Digit4", "4", "$", "$"),
    c("Digit5", "5", "%", "%"),
    c("Digit6", "6", "&", "&"),
    c("Digit7", "7", "'", "'"),
    c("Digit8", "8", "(", "("),
    c("Digit9", "9", ")", ")"),
    c("Digit0", "0", "*", "*"),
    c("Minus", "-", "_", "_"),
    { code: "Backspace", kind: "backspace", label: "←", span: 1 },
  ],
  [
    c("KeyQ", "q", "Q"),
    c("KeyW", "w", "W"),
    c("KeyE", "e", "E"),
    c("KeyR", "r", "R"),
    c("KeyT", "t", "T"),
    c("KeyY", "y", "Y"),
    c("KeyU", "u", "U"),
    c("KeyI", "i", "I"),
    c("KeyO", "o", "O"),
    c("KeyP", "p", "P"),
    c("Equal", "=", "+", "+"),
  ],
  [
    { code: "CapsLock", kind: "lock", label: "LOCK", span: 1 },
    c("KeyA", "a", "A"),
    c("KeyS", "s", "S"),
    c("KeyD", "d", "D"),
    c("KeyF", "f", "F"),
    c("KeyG", "g", "G"),
    c("KeyH", "h", "H"),
    c("KeyJ", "j", "J"),
    c("KeyK", "k", "K"),
    c("KeyL", "l", "L"),
    c("Semicolon", ";", ":", ":"),
    { code: "Enter", kind: "return", label: "RETURN", span: 1.9 },
  ],
  [
    { code: "ShiftLeft", kind: "shift", label: "SHIFT", span: 1.5 },
    c("KeyZ", "z", "Z"),
    c("KeyX", "x", "X"),
    c("KeyC", "c", "C"),
    c("KeyV", "v", "V"),
    c("KeyB", "b", "B"),
    c("KeyN", "n", "N"),
    c("KeyM", "m", "M"),
    c("Comma", ",", ",", ","),
    c("Period", ".", ".", "."),
    c("Slash", "/", "?", "?"),
    { code: "ShiftRight", kind: "shift", label: "SHIFT", span: 1.5 },
  ],
];

export const SPACE_CODE = "Space";

/** Find which on-screen key best represents a typed character (for keys typed via other layouts). */
const charToCode = new Map<string, string>();
for (const row of ROWS) {
  for (const k of row) {
    if (k.kind !== "char") continue;
    if (k.base) charToCode.set(k.base, k.code);
    if (k.shifted && !charToCode.has(k.shifted)) charToCode.set(k.shifted, k.code);
  }
}
charToCode.set(" ", SPACE_CODE);
// Characters that live on keys of a modern keyboard but not on this machine.
charToCode.set('"', "Digit7");
charToCode.set("'", "Digit7");
charToCode.set("[", "Digit8");
charToCode.set("]", "Digit9");
charToCode.set(":", "Semicolon");

export function codeForChar(ch: string): string | undefined {
  return charToCode.get(ch) ?? charToCode.get(ch.toLowerCase());
}

/** Index 0..N used to pick which typebar in the basket swings up. */
const order: string[] = ROWS.flat()
  .filter((k) => k.kind === "char")
  .map((k) => k.code);
export function typebarIndex(code: string | undefined): number {
  const i = code ? order.indexOf(code) : -1;
  return i < 0 ? Math.floor(order.length / 2) : i;
}
export const TYPEBAR_COUNT = order.length;
