"use client";

import { memo, useCallback } from "react";
import { ROWS, SPACE_CODE, type KeyDef } from "@/lib/keymap";

type KeyProps = {
  def: KeyDef;
  down: boolean;
  onPress: (code: string) => void;
};

const Key = memo(function Key({ def, down, onPress }: KeyProps) {
  const oblong = (def.span ?? 1) > 1 || def.kind === "lock" || def.kind === "shift" || def.kind === "return";
  const label =
    def.kind === "char"
      ? `Type ${def.base === " " ? "space" : def.base}`
      : def.kind === "backspace"
        ? "Backspace"
        : def.kind === "return"
          ? "Carriage return"
          : def.kind === "lock"
            ? "Shift lock"
            : "Shift";
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      aria-pressed={def.kind === "lock" || def.kind === "shift" ? down : undefined}
      className={`tw-key${oblong ? " is-oblong" : ""}${down ? " is-down" : ""}`}
      style={{ "--span": def.span ?? 1 } as React.CSSProperties}
      data-kind={def.kind}
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        onPress(def.code);
      }}
    >
      <span className="tw-key-stem" aria-hidden="true" />
      <span className="tw-key-cap" aria-hidden="true">
        <span className="tw-key-glass">
          {def.sub && <span className="tw-key-sub">{def.sub}</span>}
          <span className="tw-key-label">{def.label}</span>
        </span>
      </span>
    </button>
  );
});

type KeyboardProps = {
  pressed: ReadonlySet<string>;
  onPress: (code: string) => void;
};

export function Keyboard({ pressed, onPress }: KeyboardProps) {
  const press = useCallback((code: string) => onPress(code), [onPress]);
  const spaceDown = pressed.has(SPACE_CODE);
  return (
    <div className="tw-keyboard" role="group" aria-label="Typewriter keys">
      {ROWS.map((row, r) => (
        <div key={r} className="tw-row" data-row={r}>
          {row.map((def) => (
            <Key key={def.code} def={def} down={pressed.has(def.code)} onPress={press} />
          ))}
        </div>
      ))}
      <div className="tw-space-wrap">
        <span className="tw-space-arm is-left" aria-hidden="true" />
        <span className="tw-space-arm is-right" aria-hidden="true" />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Space"
          className={`tw-space${spaceDown ? " is-down" : ""}`}
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            press(SPACE_CODE);
          }}
        />
      </div>
    </div>
  );
}
