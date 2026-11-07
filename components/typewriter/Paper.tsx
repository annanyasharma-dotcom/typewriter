"use client";

import { memo } from "react";
import { hash3 } from "@/lib/engine";

type LineProps = { text: string; row: number; fresh: boolean };

/**
 * One typed line. Every glyph gets its own slight variation in ink density,
 * baseline and angle — derived from its position, so it never changes once typed.
 */
const Line = memo(function Line({ text, row, fresh }: LineProps) {
  return (
    <div className="tw-line">
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) => {
          if (ch === " ") return <span key={i} className="tw-glyph"> </span>;
          const a = hash3(row, i, ch.charCodeAt(0));
          const b = hash3(i, ch.charCodeAt(0), row + 7);
          const style = {
            "--ink": (0.74 + a * 0.26).toFixed(3),
            "--dy": `${((b - 0.5) * 0.9).toFixed(2)}px`,
            "--rot": `${((a - 0.5) * 1.6).toFixed(2)}deg`,
            "--blur": a > 0.86 ? "0.5px" : "0.25px",
          } as React.CSSProperties;
          const isFresh = fresh && i === text.length - 1;
          return (
            <span key={isFresh ? `f${i}` : i} className={isFresh ? "tw-glyph is-fresh" : "tw-glyph"} style={style}>
              {ch}
            </span>
          );
        })}
      </span>
      <span className="sr-only">{text || " "}</span>
    </div>
  );
});

type PaperTextProps = {
  lines: string[];
  line: number;
  col: number;
  started: boolean;
  showCursor: boolean;
};

export function PaperText({ lines, line, col, started, showCursor }: PaperTextProps) {
  return (
    <div className="tw-text" role="document" aria-label="Your page">
      {lines.map((text, row) => (
        <Line key={row} text={text} row={row} fresh={started && row === line} />
      ))}
      <span
        aria-hidden="true"
        className="tw-caret"
        data-visible={showCursor}
        style={{ "--caret-col": col, "--caret-row": line } as React.CSSProperties}
      />
    </div>
  );
}
