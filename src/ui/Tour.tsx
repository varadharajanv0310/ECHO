import { useEffect, useLayoutEffect, useState } from "react";
import { useSequence } from "@/store/sequence";
import { useUI, PANELS } from "@/store/ui";
import { CARDS, RAIL, useTour } from "@/store/tour";
import { cue } from "@/lib/audio";
import {
  ArtBelongs,
  ArtCarry,
  ArtDecay,
  ArtHierarchy,
  ArtMove,
  ArtNoFeed,
} from "./tour-art";
import "./tour.css";

/**
 * The tour.
 *
 * Three stages in one component because they are one continuous thing to the
 * person reading them: a hello, a deck of cards that says what this is, and
 * then a walk along the rail pointing at each control in turn.
 *
 * The deck is picture over text rather than text with an illustration beside
 * it. Every card here is explaining a rule that has no equivalent anywhere
 * else, and a diagram lands that before a sentence does.
 */

const DECK = [
  {
    art: <ArtHierarchy />,
    title: "This is a sky, and it goes inwards",
    body: "Places, then the people standing in them, then the things those people are carrying. You are always inside one of those three. There is no level above the sky and nothing behind it.",
  },
  {
    art: <ArtBelongs />,
    title: "What you say belongs to a place",
    body: "You pick where a signal lands, not who sees it. It sits in that place for anyone who walks in. Nothing is addressed to followers, because there are none.",
  },
  {
    art: <ArtDecay />,
    title: "Everything here is dying",
    body: "A signal is given hours, not forever. It cools, turns amber, and goes. Nothing is archived, nothing is recoverable, and nobody is told when something of theirs has gone.",
  },
  {
    art: <ArtCarry />,
    title: "Carrying is the only thing that saves it",
    body: "Open something of somebody else's and you can carry it. It starts orbiting you as well, keeping their name and their colour, and its clock starts again. That is the only way anything here survives, and the only way anything travels.",
  },
  {
    art: <ArtNoFeed />,
    title: "There is no feed",
    body: "No ranking, no follower counts, no likes, nothing infinite to scroll. Not as rules imposed on top - there is simply nowhere for them to live. Reach is people choosing to hold something.",
  },
  {
    art: <ArtMove />,
    title: "Getting around",
    body: "Click a place to fly into it, a person to stand at them, and a thing to read it. Click somebody a second time to open who they are. Back, or the trail across the top, takes you out again.",
  },
];

const RAIL_TIPS = [
  {
    title: "Your profile",
    body: "Your name, your colour, your mark, the games and music on your shelf, and where else you are. Your colour tints this entire interface - and your star, and the cursor.",
  },
  {
    title: "Menu",
    body: "What reaches you, what you see in the sky, light or dark, grain, and the opening sequence again. Nothing here leaves this browser.",
  },
  {
    title: "Create",
    body: "Say something into a place and give it a length of life. It appears immediately, orbiting your own star, with the clock already running.",
  },
  {
    title: "Search",
    body: "Look through signals and people. Results are deliberately unordered - there is no best result here, so there is nothing to put at the top.",
  },
  {
    title: "Dashboard",
    body: "What you sent and how long it has left, what came back, and the people you are actually talking to. Three separate things, kept separate.",
  },
];

export function Tour() {
  const phase = useSequence((s) => s.phase);
  const stage = useTour((s) => s.stage);
  const step = useTour((s) => s.step);
  const begin = useTour((s) => s.begin);
  const next = useTour((s) => s.next);
  const back = useTour((s) => s.back);
  const end = useTour((s) => s.end);
  const setPanel = useUI((s) => s.setPanel);

  // Arriving in the sky for the first time is what starts it. Not the profile
  // screen - the tour talks about a place that is not on screen yet there.
  //
  // And not the instant of arrival either. Coming out of the dive is the one
  // moment the whole entry sequence has been building to, and covering it with
  // a dialogue box in the same frame throws it away. The sky gets a few
  // seconds to settle and be looked at first.
  useEffect(() => {
    if (phase !== "constellation") return;
    const t = setTimeout(begin, 3200);
    return () => clearTimeout(t);
  }, [phase, begin]);

  // The rail pass points at the rail, so nothing may be covering it.
  useEffect(() => {
    if (stage === "rail") setPanel(null);
  }, [stage, setPanel]);

  useEffect(() => {
    if (!stage) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [stage, end, next, back]);

  if (phase !== "constellation" || !stage) return null;

  const go = (fn: () => void) => () => {
    cue("click");
    fn();
  };

  if (stage === "rail") return <RailTour step={step} onNext={go(next)} onSkip={go(end)} />;

  return (
    <div className="tour" style={{ zIndex: "var(--z-tour)" }}>
      <div className="tour__scrim" onClick={go(end)} />

      {stage === "welcome" ? (
        <section
          className="tour__card tour__card--hello"
          key="hello"
          data-lenis-prevent
        >
          <p className="tour__eyebrow">Signal acquired</p>
          <h2 className="tour__hello">You are in.</h2>
          <p className="tour__body">
            Your star exists now, somewhere in the sky behind this. Everything
            you say from here will orbit it until it dies or until somebody
            carries it somewhere else.
            <br />
            <br />
            Six cards, about a minute, on how any of that works.
          </p>
          <div className="tour__foot">
            <button className="tour__skip" onClick={go(end)}>
              Skip
            </button>
            <button className="tour__go" onClick={go(next)}>
              Show me
            </button>
          </div>
        </section>
      ) : (
        <section className="tour__card" key={step} data-lenis-prevent>
          <div className="tour__art">{DECK[step].art}</div>

          <div className="tour__text">
            <p className="tour__eyebrow">
              {String(step + 1).padStart(2, "0")} / {String(CARDS).padStart(2, "0")}
            </p>
            <h2 className="tour__title">{DECK[step].title}</h2>
            <p className="tour__body">{DECK[step].body}</p>
          </div>

          <div className="tour__foot">
            <button className="tour__skip" onClick={go(end)}>
              Skip
            </button>

            <div className="tour__dots" aria-hidden>
              {Array.from({ length: CARDS }, (_, i) => (
                <span key={i} data-on={i === step} />
              ))}
            </div>

            <div className="tour__nav">
              <button className="tour__back" onClick={go(back)}>
                Back
              </button>
              <button className="tour__go" onClick={go(next)}>
                {step + 1 === CARDS ? "Show me the controls" : "Next"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- rail */

/**
 * The pass over the rail.
 *
 * The highlight is measured from the actual button rather than positioned by
 * hand, so it cannot drift away from the thing it is pointing at when the rail
 * moves or the window resizes.
 */
function RailTour({
  step,
  onNext,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [box, setBox] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const btns = document.querySelectorAll<HTMLElement>(".rail__btn");
      const el = btns[step];
      if (el) setBox(el.getBoundingClientRect());
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 60);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [step]);

  if (!box) return null;

  const tip = RAIL_TIPS[step];
  const top = Math.min(Math.max(box.top + box.height / 2 - 74, 16), window.innerHeight - 190);

  return (
    <div className="tour" style={{ zIndex: "var(--z-tour)" }}>
      <div className="tour__scrim" onClick={onSkip} />

      {/* Cut a hole over the control being described, so it stays lit while
          everything else drops back. */}
      <div
        className="tour__spot"
        style={{
          left: box.left - 8,
          top: box.top - 8,
          width: box.width + 16,
          height: box.height + 16,
        }}
      />

      <div className="tour__tip" style={{ left: box.right + 26, top }} key={step}>
        <span className="tour__tip-arrow" aria-hidden />
        <p className="tour__eyebrow">
          {String(step + 1).padStart(2, "0")} / {String(RAIL).padStart(2, "0")} ·{" "}
          {PANELS[step]}
        </p>
        <h3 className="tour__tip-title">{tip.title}</h3>
        <p className="tour__body">{tip.body}</p>
        <div className="tour__foot">
          <button className="tour__skip" onClick={onSkip}>
            Skip
          </button>
          <button className="tour__go" onClick={onNext}>
            {step + 1 === RAIL ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
