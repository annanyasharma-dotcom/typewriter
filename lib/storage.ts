import { createSheet, type Sheet } from "./engine";

const KEY = "margin.typewriter.v1";

export type Saved = {
  sheets: Sheet[];
  current: number;
  muted: boolean;
};

export function loadSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Saved>;
    const sheets = Array.isArray(data.sheets)
      ? data.sheets.filter(
          (s): s is Sheet =>
            !!s && typeof s.id === "string" && Array.isArray(s.lines) && s.lines.every((l) => typeof l === "string"),
        )
      : [];
    if (!sheets.length) sheets.push(createSheet());
    sheets.forEach((s) => {
      if (!s.lines.length) s.lines = [""];
    });
    const current = Math.min(Math.max(0, Number(data.current) || 0), sheets.length - 1);
    return { sheets, current, muted: !!data.muted };
  } catch {
    return null;
  }
}

export function save(data: Saved): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
