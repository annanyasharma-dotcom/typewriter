"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Download,
  Eraser,
  FilePlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { TypewriterState } from "@/hooks/useTypewriter";

type Props = {
  tw: TypewriterState;
  compact?: boolean;
  showReturn?: boolean;
};

/** Keeps focus where it was, so typing continues after a mouse click. */
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

function Control({
  label,
  hint,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="tw-control"
      aria-label={label}
      data-active={active || undefined}
      disabled={disabled}
      onMouseDown={keepFocus}
      onClick={onClick}
    >
      {children}
      <span className="tw-control-tip" aria-hidden="true">
        {hint ?? label}
      </span>
    </button>
  );
}

export function Controls({ tw, compact = false, showReturn = true }: Props) {
  const { actions, muted, hasText, sheets, current, lines } = tw;
  const [confirmClear, setConfirmClear] = useState(false);
  const pageHasText = lines.some((l) => l.length);

  useEffect(() => {
    if (!confirmClear) return;
    const t = window.setTimeout(() => setConfirmClear(false), 2800);
    return () => window.clearTimeout(t);
  }, [confirmClear]);

  const iconSize = compact ? 17 : 16;
  const stroke = 1.5;

  return (
    <nav className="tw-controls" data-compact={compact || undefined} aria-label="Typewriter controls">
      {sheets.length > 1 && (
        <div className="tw-sheets" aria-label="Sheets">
          <button
            type="button"
            className="tw-control is-small"
            aria-label="Previous sheet"
            onMouseDown={keepFocus}
            disabled={current === 0}
            onClick={() => actions.gotoSheet(current - 1)}
          >
            <ChevronLeft size={14} strokeWidth={stroke} />
          </button>
          <span className="tw-sheets-count" aria-live="polite">
            {String(current + 1).padStart(2, "0")}
            <span className="opacity-40"> / {String(sheets.length).padStart(2, "0")}</span>
          </span>
          <button
            type="button"
            className="tw-control is-small"
            aria-label="Next sheet"
            onMouseDown={keepFocus}
            disabled={current === sheets.length - 1}
            onClick={() => actions.gotoSheet(current + 1)}
          >
            <ChevronRight size={14} strokeWidth={stroke} />
          </button>
        </div>
      )}
      {showReturn && (
        <Control label="Return carriage" hint="Return  ⏎" onClick={actions.carriageReturn}>
          <CornerDownLeft size={iconSize} strokeWidth={stroke} />
        </Control>
      )}
      <Control
        label={confirmClear ? "Confirm: clear this page" : "Clear page"}
        hint={confirmClear ? "Click again to clear" : "Clear page"}
        active={confirmClear}
        disabled={!pageHasText && !confirmClear}
        onClick={() => {
          if (confirmClear) {
            actions.clearPage();
            setConfirmClear(false);
          } else setConfirmClear(true);
        }}
      >
        <Eraser size={iconSize} strokeWidth={stroke} />
      </Control>
      <Control label="New sheet of paper" hint="New sheet" onClick={actions.newSheet}>
        <FilePlus size={iconSize} strokeWidth={stroke} />
      </Control>
      <Control
        label="Download as text file"
        hint={compact ? "Download .txt" : "Download .txt  ⌘S"}
        disabled={!hasText}
        onClick={actions.exportTxt}
      >
        <Download size={iconSize} strokeWidth={stroke} />
      </Control>
      <Control label={muted ? "Turn sound on" : "Turn sound off"} hint={muted ? "Sound off" : "Sound on"} onClick={actions.toggleMute}>
        {muted ? <VolumeX size={iconSize} strokeWidth={stroke} /> : <Volume2 size={iconSize} strokeWidth={stroke} />}
      </Control>
    </nav>
  );
}
