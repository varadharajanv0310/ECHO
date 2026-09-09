import { useEffect, useState } from "react";
import { getSky, peopleIn } from "@/scene/sky-data";
import { useSequence } from "@/store/sequence";
import { echoesFor, replyTo } from "@/lib/echoes";

/**
 * Whether anything has happened to you since you last looked.
 *
 * Without this the sky is silent about the only thing in ECHO that involves
 * another person. Somebody carries your signal, somebody answers you, and the
 * interface says nothing until you happen to open the dashboard - so the world
 * feels empty even while it is doing exactly what it promised.
 *
 * It is a count, and a count is the thing this product refuses to put on other
 * people's work. On your own inbox it is different: this is not a score, it is
 * the number of things waiting to be read, and it goes back to nothing the
 * moment you read them.
 */

const KEY = "echo.lastSeen";

const read = () => {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
};

export function markSeen() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event("echo:seen"));
}

export function useUnseen(): number {
  const emissions = useSequence((s) => s.emissions);
  const dms = useSequence((s) => s.dms);
  const [, tick] = useState(0);

  // Everything here is derived from the clock, so it has to be re-read now and
  // then or the dot only ever appears when something else re-renders.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 20000);
    const seen = () => tick((n) => n + 1);
    window.addEventListener("echo:seen", seen);
    return () => {
      clearInterval(t);
      window.removeEventListener("echo:seen", seen);
    };
  }, []);

  const since = read();
  if (!since) return 0;

  const sky = getSky();
  const now = Date.now();
  let n = 0;

  emissions.forEach((e) => {
    const { carries, replies } = echoesFor(e, peopleIn(sky, e.world), now);
    n += carries.filter((c) => c.at > since).length;
    n += replies.filter((r) => r.at > since).length;
  });

  dms.forEach((d) => {
    n += replyTo(d, now).filter((r) => r.at > since).length;
  });

  return n;
}
