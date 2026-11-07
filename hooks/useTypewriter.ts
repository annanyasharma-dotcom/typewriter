"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TypewriterAudio } from "@/lib/audio";
import {
  backspace as engineBackspace,
  carriageReturn,
  createSheet,
  isPrintable,
  sheetText,
  typeChar,
  typeText,
  type MechEvent,
  type Sheet,
} from "@/lib/engine";
import { ROWS, SPACE_CODE, codeForChar } from "@/lib/keymap";
import { loadSaved, save } from "@/lib/storage";

export type CarriageMotion = "step" | "return";
export type SheetPhase = "idle" | "out" | "in";
export type Strike = { id: number; code?: string };

const keyByCode = new Map(ROWS.flat().map((k) => [k.code, k]));

export function useTypewriter() {
  const [hydrated, setHydrated] = useState(false);
  const [returning, setReturning] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>(() => [createSheet()]);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  const [shiftOnce, setShiftOnce] = useState(false);
  const [lock, setLock] = useState(false);
  const [strike, setStrike] = useState<Strike>({ id: 0 });
  const [motion, setMotion] = useState<CarriageMotion>("step");
  const [phase, setPhase] = useState<SheetPhase>("idle");
  const [roll, setRollState] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [started, setStarted] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");

  const audio = useRef<TypewriterAudio | null>(null);
  if (audio.current === null) audio.current = new TypewriterAudio();

  // Mirror of state for event handlers that must read the latest values.
  const live = useRef({ sheets, current, shiftOnce, lock, phase, roll });
  live.current = { sheets, current, shiftOnce, lock, phase, roll };

  const motionTimer = useRef<number | undefined>(undefined);
  const tapTimers = useRef(new Map<string, number>());

  /* ---------------- hydration ---------------- */
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setSheets(saved.sheets);
      setCurrent(saved.current);
      setMuted(saved.muted);
      const hasText = saved.sheets.some((s) => s.lines.some((l) => l.length));
      setReturning(hasText);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    audio.current!.muted = muted;
  }, [muted]);

  /* ---------------- persistence ---------------- */
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      if (save({ sheets, current, muted })) setSavedAt(Date.now());
    }, 350);
    return () => window.clearTimeout(t);
  }, [sheets, current, muted, hydrated]);

  /* ---------------- helpers ---------------- */
  const sheet = sheets[current] ?? sheets[0];
  const lines = sheet.lines;

  /** Write-through: several keystrokes may land before React re-renders. */
  const setLines = useCallback((next: string[]) => {
    const { sheets: prev, current: i } = live.current;
    const copy = prev.slice();
    copy[i] = { ...copy[i], lines: next };
    live.current.sheets = copy;
    setSheets(copy);
  }, []);

  const carriageMotion = useCallback((m: CarriageMotion, ms = 340) => {
    setMotion(m);
    window.clearTimeout(motionTimer.current);
    if (m === "return") motionTimer.current = window.setTimeout(() => setMotion("step"), ms);
  }, []);

  const sound = useCallback((ev: MechEvent) => {
    const a = audio.current!;
    switch (ev) {
      case "strike":
        a.strike();
        break;
      case "bell":
        a.strike();
        a.bell();
        break;
      case "space":
        a.space();
        break;
      case "wrap":
      case "return":
        a.carriageReturn();
        break;
      case "backspace":
      case "lineback":
        a.backspace();
        break;
    }
  }, []);

  const apply = useCallback(
    (ev: MechEvent, next: string[], code?: string) => {
      if (live.current.phase !== "idle") return;
      setLines(next);
      setStarted(true);
      if (live.current.roll !== 0) setRollState(0);
      if (ev === "wrap" || ev === "return" || ev === "lineback") carriageMotion("return");
      else carriageMotion("step");
      if (ev === "strike" || ev === "bell" || (ev === "wrap" && code && code !== SPACE_CODE)) {
        setStrike((s) => ({ id: s.id + 1, code }));
      }
      sound(ev);
    },
    [carriageMotion, setLines, sound],
  );

  const currentLines = () => live.current.sheets[live.current.current].lines;

  /* ---------------- actions ---------------- */
  const typeCharacter = useCallback(
    (ch: string, code?: string) => {
      const step = typeChar(currentLines(), ch);
      apply(step.event, step.lines, code ?? codeForChar(ch));
    },
    [apply],
  );

  const doBackspace = useCallback(() => {
    const step = engineBackspace(currentLines());
    if (step.event === "none") return;
    apply(step.event, step.lines);
  }, [apply]);

  const doReturn = useCallback(() => {
    const step = carriageReturn(currentLines());
    apply(step.event, step.lines);
  }, [apply]);

  const pasteText = useCallback(
    (text: string) => {
      if (live.current.phase !== "idle" || !text) return;
      setLines(typeText(currentLines(), text));
      setStarted(true);
      setRollState(0);
      carriageMotion("return");
      audio.current!.carriageReturn();
    },
    [carriageMotion, setLines],
  );

  const clearPage = useCallback(() => {
    if (live.current.phase !== "idle") return;
    setLines([""]);
    setRollState(0);
    carriageMotion("return", 500);
    audio.current!.carriageReturn();
    setAnnounce("Page cleared.");
  }, [carriageMotion, setLines]);

  /** Eject the current sheet and feed another one in. */
  const swapSheet = useCallback(
    (decide: (sheets: Sheet[], current: number) => { sheets: Sheet[]; current: number }, message: string) => {
      if (live.current.phase !== "idle") return;
      audio.current!.feed();
      live.current.phase = "out";
      setPhase("out");
      setRollState(0);
      window.setTimeout(() => {
        const { sheets: s, current: c } = decide(live.current.sheets, live.current.current);
        live.current.sheets = s;
        live.current.current = c;
        live.current.phase = "in";
        setSheets(s);
        setCurrent(c);
        carriageMotion("return", 10);
        setPhase("in");
        setAnnounce(message);
        window.setTimeout(() => {
          live.current.phase = "idle";
          setPhase("idle");
        }, 760);
      }, 420);
    },
    [carriageMotion],
  );

  const newSheet = useCallback(() => {
    swapSheet((s, c) => {
      const written = (sh: Sheet) => sh.lines.some((l) => l.trim().length);
      // A blank sheet is simply re-fed; blank sheets never pile up.
      if (!written(s[c])) return { sheets: s, current: c };
      const next = [...s.filter(written), createSheet()];
      return { sheets: next, current: next.length - 1 };
    }, "A fresh sheet is in the machine.");
  }, [swapSheet]);

  const gotoSheet = useCallback(
    (index: number) => {
      const { sheets: s, current: c } = live.current;
      if (index < 0 || index >= s.length || index === c) return;
      swapSheet(() => ({ sheets: s, current: index }), `Sheet ${index + 1} of ${s.length}.`);
    },
    [swapSheet],
  );

  const hasText = useMemo(() => sheets.some((s) => s.lines.some((l) => l.trim().length)), [sheets]);

  const exportTxt = useCallback(() => {
    const written = live.current.sheets.filter((s) => s.lines.some((l) => l.trim().length));
    if (!written.length) return;
    const body = written.map(sheetText).join("\n\n\n— — —\n\n\n") + "\n";
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `margin-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnounce("Your pages were downloaded as a text file.");
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audio.current!.muted = next;
      if (!next) audio.current!.shift();
      setAnnounce(next ? "Sound off." : "Sound on.");
      return next;
    });
  }, []);

  /* ---------------- paper rolling (platen knobs) ---------------- */
  const maxRoll = Math.max(0, lines.length - 1);
  const setRoll = useCallback((value: number, opts?: { live?: boolean }) => {
    const max = Math.max(0, currentLines().length - 1);
    const v = Math.min(max + 0.4, Math.max(-0.4, value));
    setRollState((prev) => {
      if (Math.floor(prev) !== Math.floor(v)) audio.current!.roll();
      return v;
    });
    setRolling(!!opts?.live);
  }, []);
  const settleRoll = useCallback(() => {
    setRolling(false);
    setRollState((r) => Math.min(Math.max(0, Math.round(r)), Math.max(0, currentLines().length - 1)));
  }, []);

  /* ---------------- key visuals ---------------- */
  const pressVisual = useCallback((code: string, down: boolean) => {
    setPressed((prev) => {
      if (down === prev.has(code)) return prev;
      const next = new Set(prev);
      if (down) next.add(code);
      else next.delete(code);
      return next;
    });
  }, []);

  const tapVisual = useCallback(
    (code: string) => {
      pressVisual(code, true);
      const timers = tapTimers.current;
      window.clearTimeout(timers.get(code));
      timers.set(
        code,
        window.setTimeout(() => pressVisual(code, false), 110),
      );
    },
    [pressVisual],
  );

  /** On-screen key press (mouse or touch). */
  const pressKey = useCallback(
    (code: string) => {
      audio.current!.unlock();
      if (code === SPACE_CODE) {
        tapVisual(code);
        typeCharacter(" ", code);
        return;
      }
      const k = keyByCode.get(code);
      if (!k) return;
      if (k.kind === "shift") {
        setShiftOnce((s) => !s);
        audio.current!.shift();
        return;
      }
      if (k.kind === "lock") {
        setLock((l) => !l);
        audio.current!.shift();
        return;
      }
      tapVisual(code);
      if (k.kind === "backspace") return doBackspace();
      if (k.kind === "return") return doReturn();
      const { shiftOnce: s, lock: l } = live.current;
      const ch = s || l ? k.shifted! : k.base!;
      typeCharacter(ch, code);
      if (s) setShiftOnce(false);
    },
    [doBackspace, doReturn, tapVisual, typeCharacter],
  );

  /* ---------------- physical keyboard ---------------- */
  useEffect(() => {
    if (!hydrated) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      const target = e.target as HTMLElement | null;
      const onControl = !!target?.closest("button, a, [role='button']");

      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          exportTxt();
        }
        return;
      }
      if (e.key === "Tab") return;
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }
      if (onControl && (e.key === "Enter" || e.key === " ")) return;

      audio.current!.unlock();
      if (e.code) pressVisual(e.code, true);
      if (e.key === "Shift" || e.key === "CapsLock") {
        if (!e.repeat) audio.current!.shift();
        setLock(e.getModifierState?.("CapsLock") ?? false);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        doBackspace();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) doReturn();
        return;
      }
      if (isPrintable(e.key)) {
        e.preventDefault();
        if (e.repeat && e.key !== " ") return; // Real typebars don't auto-repeat.
        typeCharacter(e.key, e.key === " " ? SPACE_CODE : e.code || codeForChar(e.key));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code) pressVisual(e.code, false);
      if (e.key === "CapsLock" || e.key === "Shift") setLock(e.getModifierState?.("CapsLock") ?? false);
    };
    const onBlur = () => setPressed(new Set());
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      pasteText(text);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("paste", onPaste);
    };
  }, [hydrated, doBackspace, doReturn, exportTxt, pasteText, pressVisual, typeCharacter]);

  useEffect(
    () => () => {
      window.clearTimeout(motionTimer.current);
      tapTimers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const pressedWithModifiers = useMemo(() => {
    if (!shiftOnce && !lock) return pressed;
    const s = new Set(pressed);
    if (shiftOnce) {
      s.add("ShiftLeft");
      s.add("ShiftRight");
    }
    if (lock) s.add("CapsLock");
    return s;
  }, [pressed, shiftOnce, lock]);

  const unlockAudio = useCallback(() => audio.current!.unlock(), []);
  const actions = useMemo(
    () => ({
      typeCharacter,
      backspace: doBackspace,
      carriageReturn: doReturn,
      pressKey,
      clearPage,
      newSheet,
      gotoSheet,
      exportTxt,
      toggleMute,
      setRoll,
      settleRoll,
      unlockAudio,
    }),
    [typeCharacter, doBackspace, doReturn, pressKey, clearPage, newSheet, gotoSheet, exportTxt, toggleMute, setRoll, settleRoll, unlockAudio],
  );

  return {
    hydrated,
    returning,
    sheet,
    sheets,
    current,
    lines,
    line: lines.length - 1,
    col: lines[lines.length - 1].length,
    muted,
    pressed: pressedWithModifiers,
    strike,
    motion,
    phase,
    roll,
    maxRoll,
    rolling,
    started,
    savedAt,
    hasText,
    announce,
    actions,
  };
}

export type TypewriterState = ReturnType<typeof useTypewriter>;
