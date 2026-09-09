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

  // The clock is held in state rather than read while rendering. Everything
  // below is derived from it, so it has to move on its own or the dot only
  // ever appears when something else happens to re-render - but reading
  // Date.now() in the render body would make this component's output depend on
  // when React chose to call it.
  const [now, tick] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => tick(Date.now()), 20000);
    const seen = () => tick(Date.now());
    window.addEventListener("echo:seen", seen);
    return () => {
      clearInterval(t);
      window.removeEventListener("echo:seen", seen);
    };
  }, []);

  const since = read();
  if (!since) return 0;

  const sky = getSky();
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
