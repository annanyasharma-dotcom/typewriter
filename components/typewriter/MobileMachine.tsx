"use client";

import { useEffect, useRef, useState } from "react";
import type { TypewriterState } from "@/hooks/useTypewriter";
import { Controls } from "./Controls";
import { PaperText } from "./Paper";
import { TypedTitle } from "./TypedTitle";

const SENTINEL = "  ";

/** Height and offset of the visible viewport — shrinks when the native keyboard opens. */
function useVisualViewport() {
  const [vv, setVv] = useState({ h: 0, top: 0 });
  useEffect(() => {
    const v = window.visualViewport;
    const update = () => {
      setVv({ h: v ? v.height : window.innerHeight, top: v ? v.offsetTop : 0 });
    };
    update();
    v?.addEventListener("resize", update);
    v?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      v?.removeEventListener("resize", update);
      v?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return vv;
}

export function MobileMachine({ tw }: { tw: TypewriterState }) {
  const { lines, line, col, motion, phase, roll, rolling, started, sheet, returning, actions } = tw;
  const input = useRef<HTMLTextAreaElement>(null);
  const act = useRef(actions);
  act.current = actions;
  const lastValue = useRef(SENTINEL);
  const composing = useRef(false);
  const [focused, setFocused] = useState(false);
  const vv = useVisualViewport();
  const keyboardOpen = focused && vv.h > 0 && vv.h < window.innerHeight * 0.82;
  const railY = vv.h ? vv.h - (keyboardOpen ? 66 : 136) : 0;

  /* Native keyboard input. Hardware-like keys arrive as keydown (handled
     globally); virtual keyboards that only report "input" are diffed here. */
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const reset = () => {
      el.value = SENTINEL;
      lastValue.current = SENTINEL;
      el.setSelectionRange(SENTINEL.length, SENTINEL.length);
    };
    reset();
    const onInput = (e: Event) => {
      const ev = e as InputEvent;
      if (ev.inputType === "insertLineBreak" || ev.inputType === "insertParagraph") {
        act.current.carriageReturn();
        reset();
        return;
      }
      const prev = lastValue.current;
      const next = el.value;
      let p = 0;
      while (p < prev.length && p < next.length && prev[p] === next[p]) p++;
      const deleted = prev.length - p;
      const inserted = next.slice(p);
      for (let i = 0; i < deleted; i++) act.current.backspace();
      for (const ch of inserted) {
        if (ch === "\n") act.current.carriageReturn();
        else act.current.typeCharacter(ch);
      }
      lastValue.current = next;
      if (!composing.current && (next.length < SENTINEL.length || next.length > 48 || inserted.includes("\n"))) reset();
    };
    const onCompStart = () => (composing.current = true);
    const onCompEnd = () => {
      composing.current = false;
      if (el.value.length > 48) reset();
    };
    el.addEventListener("input", onInput);
    el.addEventListener("compositionstart", onCompStart);
    el.addEventListener("compositionend", onCompEnd);
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("compositionstart", onCompStart);
      el.removeEventListener("compositionend", onCompEnd);
    };
  }, []);

  // Keep the page pinned while the keyboard pushes the layout around (iOS).
  useEffect(() => {
    if (focused) window.scrollTo(0, 0);
  }, [focused, vv.h]);

  const focusInput = () => {
    actions.unlockAudio();
    input.current?.focus({ preventScroll: true });
  };

  // Drag the paper to roll the platen and read back.
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  const lhPx = useRef(22);
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (textRef.current) lhPx.current = parseFloat(getComputedStyle(textRef.current).lineHeight) || 22;
  });
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "idle") return;
    drag.current = { y: e.clientY, start: roll, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 6) d.moved = true;
    if (d.moved) actions.setRoll(d.start + dy / lhPx.current, { live: true });
  };
  const wasDrag = useRef(false);
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    wasDrag.current = d.moved;
    if (d.moved) actions.settleRoll();
  };
  // Focus from the click itself: iOS only opens the keyboard inside a real gesture.
  const onClick = () => {
    if (wasDrag.current) {
      wasDrag.current = false;
      return;
    }
    focusInput();
  };

  const view = line - roll;
  const empty = !started && !lines.some((l) => l.length);

  return (
    <div
      className="tw-mobile"
      style={
        {
          height: vv.h || "100dvh",
          transform: `translateY(${vv.top}px)`,
          "--rail-y": `${railY}px`,
          "--view": view,
          "--col": col,
        } as React.CSSProperties
      }
      data-ready={vv.h > 0 || undefined}
      data-keyboard={keyboardOpen || undefined}
    >
      <header className="tw-m-header">
        <span className="tw-wordmark">Margin</span>
        <Controls tw={tw} compact showReturn={false} />
      </header>

      <div
        key={sheet.id}
        className="tw-m-paper"
        data-phase={phase}
        data-rolling={rolling || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        onPointerCancel={() => {
          drag.current = null;
          actions.settleRoll();
        }}
        style={{ "--rows": lines.length } as React.CSSProperties}
      >
        <div className="tw-m-paper-inner" ref={textRef}>
          <PaperText lines={lines} line={line} col={col} started={started} showCursor={phase === "idle" && Math.abs(roll) < 0.01} />
        </div>
      </div>

      {empty && (
        <div className="tw-m-intro" aria-hidden="true">
          <TypedTitle className="tw-intro-title" delay={700} text={returning ? "Welcome back." : "A little space to think."} />
          <p className="tw-intro-sub">Tap the paper and begin.</p>
          <svg className="tw-m-arrow" viewBox="0 0 120 150" width={120} height={150}>
            <path d="M 96 6 C 128 50, 104 104, 14 140" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" pathLength={1} className="tw-draw" />
            <path d="M 26 131 L 13 140 L 27 145" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="tw-draw is-late" />
          </svg>
        </div>
      )}

      <div className="tw-m-rail" aria-hidden="true">
        <span className="tw-m-rail-cap is-left" />
        <span className="tw-m-rail-cap is-right" />
        <span className="tw-m-carriage" data-motion={motion}>
          <span className="tw-m-guide" />
          <span className="tw-m-capsule">
            <i data-on={!!tw.savedAt || undefined} />
            <i />
            <i data-on={tw.muted || undefined} />
          </span>
        </span>
      </div>

      <textarea
        ref={input}
        className="tw-m-input"
        aria-label="Type on the page"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="enter"
        rows={1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      <div className="tw-m-actions">
        {focused ? (
          <>
            <button type="button" className="tw-pill" onMouseDown={(e) => e.preventDefault()} onClick={actions.carriageReturn}>
              Return
            </button>
            <button type="button" className="tw-pill is-quiet" onClick={() => input.current?.blur()}>
              Done
            </button>
          </>
        ) : (
          <button type="button" className="tw-pill" onClick={focusInput}>
            {lines.some((l) => l.length) ? "Keep writing" : "Begin"}
          </button>
        )}
      </div>
    </div>
  );
}
