"use client";

import { useEffect, useState } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { Controls } from "./Controls";
import { Machine } from "./Machine";
import { MobileMachine } from "./MobileMachine";

const MOBILE_QUERY = "(max-width: 699px)";

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function Typewriter() {
  const tw = useTypewriter();
  const mobile = useIsMobile();
  const ready = tw.hydrated && mobile !== null;

  const [hintSeen, setHintSeen] = useState(false);
  useEffect(() => {
    if (tw.roll !== 0) setHintSeen(true);
  }, [tw.roll]);
  const showRollHint = !hintSeen && tw.line >= 7 && tw.phase === "idle";

  return (
    <main className="tw-root" data-ready={ready || undefined}>
      <h1 className="sr-only">Typewriter</h1>
      <p className="sr-only">
        Type with your keyboard to write on the page. Enter returns the carriage, Backspace steps back. Your writing is
        saved in this browser.
      </p>
      <div className="sr-only" role="status" aria-live="polite">
        {tw.announce}
      </div>

      {ready && !mobile && (
        <>
          <Machine tw={tw} />
          <div className="tw-corner is-tr" aria-hidden="true">
            <p className="tw-hint" data-visible={showRollHint || undefined}>
              Scroll over the paper to roll the platen
            </p>
          </div>
          <div className="tw-corner is-br">
            <Controls tw={tw} />
          </div>
        </>
      )}
      {ready && mobile && <MobileMachine tw={tw} />}
    </main>
  );
}
