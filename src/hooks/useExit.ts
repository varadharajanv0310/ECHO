import { useEffect, useRef, useState } from "react";

/**
 * Keep something mounted long enough to animate away.
 *
 * React removes a closed panel on the same tick, so without this every window
 * in the app blinked out of existence - and the leaving half is the half people
 * notice, because arriving is expected and leaving is what confirms the click
 * landed.
 *
 * This exists rather than a presence library because the one thing that
 * absolutely must happen is the *removal*. An exit animation that fails to
 * unmount leaves a full-screen layer sitting invisibly over the sky swallowing
 * every click, which is far worse than no animation at all. Here the unmount
 * is a timeout this code owns, so it cannot be blocked by anything.
 *
 * Returns what to render (the last non-null value, held through the close) and
 * whether it is on its way out, for CSS to animate.
 */
export function useExit<T>(value: T | null, ms: number) {
  const [shown, setShown] = useState<T | null>(value);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);

    if (value !== null) {
      setShown(value);
      setClosing(false);
      return;
    }

    // Nothing to close.
    if (shown === null) return;

    setClosing(true);
    timer.current = window.setTimeout(() => {
      setShown(null);
      setClosing(false);
    }, ms);

    return () => window.clearTimeout(timer.current);
    // `shown` is deliberately not a dependency: reacting to it would restart
    // the close timer every time the held value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ms]);

  return { shown, closing };
}
