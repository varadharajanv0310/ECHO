import { useEffect, useMemo, useRef, useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { getSky } from "@/scene/sky-data";
import { thread as buildThread } from "@/lib/echoes";
import { cue } from "@/lib/audio";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "./Window";
import "./message-window.css";

/**
 * One conversation, as its own window.
 *
 * It used to live in the side of a profile: four lines in a narrow column
 * under the bio, which is a widget rather than a place. Talking to somebody is
 * the whole of what you are doing while you are doing it, so it gets the whole
 * window - the conversation on the left, who they are on the right, the way
 * every app people already know how to use arranges it.
 *
 * The right-hand card is deliberately not the full profile. It is enough to
 * remember who you are talking to, with a way through to the rest.
 */

const day = (t: number) =>
  new Date(t).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const clock = (t: number) =>
  new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function MessageWindow({ star }: { star: number }) {
  const sky = useMemo(() => getSky(), []);
  const them = sky.stars[star];

  const profile = useSequence((s) => s.profile);
  const dms = useSequence((s) => s.dms);
  const friends = useSequence((s) => s.friends);
  const sendDM = useSequence((s) => s.sendDM);
  const toggleFriend = useSequence((s) => s.toggleFriend);

  const closeMessages = useUI((s) => s.closeMessages);
  const openProfile = useUI((s) => s.openProfile);
  const enterStar = useUI((s) => s.enterStar);

  const [text, setText] = useState("");
  const foot = useRef<HTMLDivElement>(null);

  // Replies arrive on the clock, so the thread has to be re-read now and then
  // rather than only when something is typed.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const line = useMemo(
    () => buildThread(dms.filter((d) => d.withStar === star), now),
    [dms, star, now],
  );

  // A conversation opens at the end, where the newest thing is.
  useEffect(() => {
    foot.current?.scrollIntoView({ block: "end" });
  }, [line.length]);

  if (!them) return null;
  const isFriend = friends.includes(star);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendDM(star, them.name, t);
    setText("");
    cue("tick");
  };

  return (
    <Window
      title={them.name}
      subtitle={sky.constellations[them.constellation].world}
      tabs={[]}
      active=""
      onTab={() => {}}
      onClose={closeMessages}
      accent={them.hue}
      fill
    >
      <div className="mw">
        {/* ------------------------------------------------ conversation */}
        <section className="mw__talk">
          <div className="mw__scroll" data-lenis-prevent>
            <header className="mw__open">
              <div className="mw__open-mark">
                <Mark mark={MARKS[star % MARKS.length] as MarkId} hue={them.hue} size={54} />
              </div>
              <h2 className="mw__open-name">{them.name}</h2>
              <p className="mw__open-line">
                This is the beginning of everything you have said to{" "}
                <b>{them.name}</b>. Nothing here leaves your browser, and
                nothing here is delivered anywhere.
              </p>
              <div className="mw__open-acts">
                <button
                  className="u-btn"
                  data-on={isFriend}
                  onClick={() => {
                    toggleFriend(star);
                    cue("click");
                  }}
                >
                  {isFriend ? "Added" : "Add friend"}
                </button>
                <button className="u-btn" onClick={() => openProfile(star)}>
                  Their profile
                </button>
              </div>
            </header>

            {line.length === 0 ? (
              <p className="u-empty mw__empty">
                Nothing said yet. Whatever you send sits here and nowhere else.
              </p>
            ) : (
              line.map((d, i) => {
                const prev = line[i - 1];
                const newDay = !prev || day(prev.at) !== day(d.at);
                // Consecutive lines from the same person are one block, so a
                // back-and-forth reads as speech rather than as a list of rows.
                const run = !newDay && prev?.mine === d.mine && d.at - prev.at < 6e5;
                return (
                  <div key={d.id}>
                    {newDay && (
                      <div className="mw__day">
                        <span>{day(d.at)}</span>
                      </div>
                    )}
                    <article className="mw__msg" data-run={run}>
                      <div className="mw__msg-mark">
                        {!run && (
                          <Mark
                            mark={
                              d.mine
                                ? ((profile?.mark as MarkId) ?? "star")
                                : (MARKS[star % MARKS.length] as MarkId)
                            }
                            hue={d.mine ? (profile?.hue ?? 276) : them.hue}
                            size={30}
                          />
                        )}
                      </div>
                      <div className="mw__msg-body">
                        {!run && (
                          <p className="mw__msg-head">
                            <b>{d.mine ? (profile?.name ?? "you") : them.name}</b>
                            <time>{clock(d.at)}</time>
                          </p>
                        )}
                        {d.onText && (
                          <p className="mw__msg-on">on “{d.onText}”</p>
                        )}
                        <p className="mw__msg-text">{d.text}</p>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
            <div ref={foot} />
          </div>

          <div className="mw__compose">
            <input
              className="mw__input"
              value={text}
              placeholder={`Say something to ${them.name}`}
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              onKeyDown={(e) => e.key === "Enter" && send()}
              aria-label={`Message ${them.name}`}
            />
            <button className="u-btn u-btn--go" onClick={send} disabled={!text.trim()}>
              Send
            </button>
          </div>
        </section>

        {/* ------------------------------------------------------ aside */}
        <aside className="mw__who">
          <div className="mw__banner" data-b={star % 4} />
          <div className="mw__who-mark">
            <Mark mark={MARKS[star % MARKS.length] as MarkId} hue={them.hue} size={46} />
          </div>
          <div className="mw__who-body">
            {/* The card is the one part of this window that never scrolls
                away, so it is where the way back to their profile belongs.
                The name is the obvious thing to click for that. */}
            <button className="mw__who-id" onClick={() => openProfile(star)}>
              <h3 className="mw__who-name">{them.name}</h3>
              <p className="mw__who-sub">
                Listening in {sky.constellations[them.constellation].world}
              </p>
            </button>

            {them.traits.length > 0 && (
              <div className="mw__who-traits">
                {them.traits.map((t) => (
                  <span className="pw__badge" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            <dl className="mw__facts">
              <div>
                <dt>Carrying</dt>
                <dd>{them.planets.length}</dd>
              </div>
              <div>
                <dt>Said to them</dt>
                <dd>{line.filter((d) => d.mine).length}</dd>
              </div>
            </dl>

            <div className="mw__who-acts">
              <button className="u-btn mw__who-go" onClick={() => openProfile(star)}>
                Open their profile
              </button>
              <button
                className="u-btn mw__who-go"
                onClick={() => {
                  closeMessages();
                  enterStar(star);
                }}
              >
                Go and stand at them
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Window>
  );
}
