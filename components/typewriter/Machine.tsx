"use client";

import { useEffect, useRef, useState } from "react";
import type { TypewriterState } from "@/hooks/useTypewriter";
import { COLS } from "@/lib/engine";
import { TYPEBAR_COUNT, typebarIndex } from "@/lib/keymap";
import { BASKET, Body } from "./Body";
import { Keyboard } from "./Keyboard";
import { PaperText } from "./Paper";
import { TypedTitle } from "./TypedTitle";

/* Design-space geometry of the stage, in px before scaling. */
const STAGE_W = 1040;
const STAGE_H = 970;
const STRIKE_X = 520;
const LINE_TOP = 432; // top of the line box currently under the type guide
const LH = 31;
const MARGIN_L = 60;
const TOP_MARGIN_LINES = 7;
const CLIP = 2400; // how far above the stage the paper may still be drawn
const PAPER_CLIP_Y = 494; // the paper disappears behind the platen here

function useStageScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScale(Math.min((w * 0.98) / STAGE_W, (h * 0.97) / STAGE_H, 1.3));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}

function Lever({ onPull }: { onPull: () => void }) {
  return (
    <button
      type="button"
      className="tw-lever"
      aria-label="Carriage return lever"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPull}
    >
      <svg viewBox="0 0 140 80" width={140} height={80} aria-hidden="true">
        <defs>
          <linearGradient id="tw-lever-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f3ef" />
            <stop offset="0.5" stopColor="#a8a39b" />
            <stop offset="1" stopColor="#6f6a63" />
          </linearGradient>
        </defs>
        <path
          d="M 136 62 C 104 60 70 52 40 30 C 30 22 22 18 14 18"
          fill="none"
          stroke="rgba(60,45,30,0.25)"
          strokeWidth={7}
          strokeLinecap="round"
          transform="translate(2 5)"
        />
        <path
          d="M 136 62 C 104 60 70 52 40 30 C 30 22 22 18 14 18"
          fill="none"
          stroke="url(#tw-lever-g)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <path d="M 134 60 C 104 58 70 50 41 28" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeLinecap="round" />
        <ellipse cx={14} cy={18} rx={11} ry={9} fill="#1d1b1a" />
        <ellipse cx={11} cy={15} rx={4} ry={2.6} fill="rgba(255,255,255,0.25)" />
      </svg>
    </button>
  );
}

function Knob({ side, line }: { side: "left" | "right"; line: number }) {
  return (
    <div className={`tw-knob is-${side}`} aria-hidden="true">
      <span className="tw-knob-collar" />
      <span className="tw-knob-grip" style={{ backgroundPositionY: `${line * 7}px` }} />
    </div>
  );
}

/** Ticks of the carriage's margin scale, one per character. */
function Scale() {
  const marks = [];
  for (let n = 0; n <= COLS; n += 5) {
    marks.push(
      <span key={n} className={n % 10 === 0 ? "tw-scale-num" : "tw-scale-num is-minor"} style={{ "--n": n } as React.CSSProperties}>
        {n % 10 === 0 ? n : ""}
      </span>,
    );
  }
  return (
    <div className="tw-scale" aria-hidden="true">
      <div className="tw-scale-ticks" />
      {marks}
    </div>
  );
}

function StrikingBar({ id, code }: { id: number; code?: string }) {
  if (!id) return null;
  const i = typebarIndex(code);
  const a = ((8 + (164 * (i % TYPEBAR_COUNT)) / (TYPEBAR_COUNT - 1)) * Math.PI) / 180;
  const px = BASKET.cx + Math.cos(a) * (BASKET.rx - 6);
  const py = BASKET.cy + Math.sin(a) * (BASKET.ry - 5);
  const restDeg = (Math.atan2(BASKET.cy - py, BASKET.cx - px) * 180) / Math.PI;
  const hitDeg = (Math.atan2(LINE_TOP + 24 - py, STRIKE_X - px) * 180) / Math.PI;
  const len = Math.hypot(STRIKE_X - px, LINE_TOP + 24 - py);
  return (
    <span
      key={id}
      className="tw-typebar"
      aria-hidden="true"
      style={
        {
          left: px,
          top: py,
          width: len,
          "--rest": `${restDeg}deg`,
          "--hit": `${hitDeg}deg`,
        } as React.CSSProperties
      }
    />
  );
}

export function Machine({ tw }: { tw: TypewriterState }) {
  const scale = useStageScale();
  const { lines, line, col, motion, phase, roll, rolling, started, strike, sheet, pressed, savedAt, returning } = tw;
  const view = line - roll;
  const paperTop = LINE_TOP - (TOP_MARGIN_LINES + view) * LH;
  const paperH = Math.max(780, (TOP_MARGIN_LINES + lines.length + 8) * LH);

  // Wheel on the paper or knobs rolls the platen, like turning the knob.
  const wheelTimer = useRef<number | undefined>(undefined);
  const rollRef = useRef(roll);
  rollRef.current = roll;
  const onWheel = (e: React.WheelEvent) => {
    if (phase !== "idle") return;
    tw.actions.setRoll(rollRef.current + e.deltaY / -60, { live: true });
    window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => tw.actions.settleRoll(), 140);
  };
  const drag = useRef<{ y: number; start: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || phase !== "idle") return;
    drag.current = { y: e.clientY, start: roll };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    tw.actions.setRoll(drag.current.start + (e.clientY - drag.current.y) / (LH * scale), { live: true });
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    tw.actions.settleRoll();
  };

  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setJustSaved(true);
    const t = window.setTimeout(() => setJustSaved(false), 900);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const stageStyle = {
    width: STAGE_W,
    height: STAGE_H,
    transform: `translate(-50%, -50%) scale(${scale})`,
    "--lh": `${LH}px`,
    "--ml": `${MARGIN_L}px`,
  } as React.CSSProperties;

  return (
    <div className="tw-desktop">
      <div className="tw-stage" style={stageStyle}>
        {/* Introduction, written in the margin of the desk */}
        <div className="tw-intro" data-hidden={started} aria-hidden={started}>
          <TypedTitle className="tw-intro-title" delay={1500} text={returning ? "Welcome back." : "A little space to think."} />
          <p className="tw-intro-sub">
            {returning ? "Your page is where you left it." : "Start typing. The machine is listening."}
          </p>
          {!returning && (
          <svg className="tw-intro-arrow" viewBox="0 0 260 260" width={260} height={260} aria-hidden="true">
            <path
              d="M 18 14 C 120 0, 190 60, 168 128 C 152 178, 196 214, 232 236"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              strokeLinecap="round"
              pathLength={1}
              className="tw-draw"
            />
            <path d="M 220 238 L 233 237 L 226 226" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="tw-draw is-late" />
          </svg>
          )}
        </div>

        {/* The moving carriage: paper, platen, knobs, lever and scale */}
        <div className="tw-carriage-intro">
          <div
            className="tw-carriage"
            data-motion={motion}
            style={{ "--col": col, left: STRIKE_X - MARGIN_L } as React.CSSProperties}
          >
            <div className="tw-paper-clip" style={{ top: -CLIP, height: CLIP + PAPER_CLIP_Y }}>
            <div
              key={sheet.id}
              className="tw-paper-feed"
              data-phase={phase}
              style={{ top: paperTop + CLIP, height: paperH }}
              data-rolling={rolling || undefined}
            >
              <div
                className="tw-paper"
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <div className="tw-paper-inner" style={{ paddingTop: TOP_MARGIN_LINES * LH }}>
                  <PaperText
                    lines={lines}
                    line={line}
                    col={col}
                    started={started}
                    showCursor={phase === "idle" && Math.abs(roll) < 0.01}
                  />
                </div>
              </div>
            </div>
            </div>

            <div className="tw-bail" aria-hidden="true">
              <span className="tw-bail-roller" style={{ left: 140 }} />
              <span className="tw-bail-roller" style={{ left: 440 }} />
            </div>
            <div className="tw-platen" aria-hidden="true" onWheel={onWheel}>
              <span className="tw-platen-turn" style={{ backgroundPositionY: `${(line - roll) * -9}px` }} />
            </div>
            <Knob side="left" line={line - roll} />
            <Knob side="right" line={line - roll} />
            <Lever onPull={tw.actions.carriageReturn} />
            <Scale />
          </div>
        </div>

        {/* Fixed parts at the printing point */}
        <span key={`r${strike.id}`} className="tw-ribbon" data-strike={strike.id > 0 || undefined} aria-hidden="true" />
        <span className="tw-guide" aria-hidden="true" />
        <span className="tw-scale-pointer" aria-hidden="true" />

        <Body />
        <span className="tw-capsule-dots" aria-hidden="true">
          <i data-on={justSaved || undefined} />
          <i />
          <i data-on={tw.muted || undefined} />
        </span>
        <StrikingBar id={strike.id} code={strike.code} />

        <div className="tw-keyboard-wrap">
          <Keyboard pressed={pressed} onPress={tw.actions.pressKey} />
        </div>
      </div>
    </div>
  );
}
