import { useMemo, useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { buildConstellation } from "@/scene/constellation-data";
import { cue } from "@/lib/audio";
import { useUI } from "@/store/ui";
import { Window } from "./Window";

const TABS = ["Signal", "Path", "Replies"] as const;

/**
 * One signal, opened from the sky.
 *
 * The two things a person can do to it are the only two verbs in ECHO. Carry
 * moves it one hop further and resets its clock; reply attaches to it without
 * moving it. Neither is a like: carrying costs you something, because your own
 * sky is where it lands next.
 *
 * The path tab is the honest version of an engagement graph - it is the list
 * of individual people who each chose to move this thing along, in order.
 */
export function SignalWindow({ index }: { index: number }) {
  const setOpenSignal = useUI((s) => s.setOpenSignal);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Signal");
  const [carried, setCarried] = useState(false);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<string[]>([]);

  const nodes = useMemo(() => buildConstellation(), []);
  const node = nodes[index];

  const chain = useMemo(() => {
    const out: typeof nodes = [];
    let i = index;
    while (i > 0) {
      out.unshift(nodes[i]);
      i = nodes[i].parent;
    }
    return out;
  }, [nodes, index]);

  if (!node) return null;

  const hoursLeft = Math.max(1, Math.round((1 - node.age) * 24));
  const dying = node.age > 0.72;

  return (
    <Window
      title={node.author}
      subtitle={`${node.world}  ·  ${node.hops} hops`}
      tabs={TABS}
      active={tab}
      onTab={(t) => setTab(t as (typeof TABS)[number])}
      onClose={() => setOpenSignal(null)}
      size="narrow"
    >
      {tab === "Signal" && (
        <div className="u-grid">
          <section className="u-card sw__body">
            <p className="sw__text">{node.text}</p>

            <div className="sw__meta">
              <Mark
                mark={MARKS[index % MARKS.length] as MarkId}
                hue={275 + ((index * 13) % 45)}
                size={20}
              />
              <span className="sw__author">{node.author}</span>
              <span className="sw__dot" aria-hidden />
              <span className="sw__world">{node.world}</span>
            </div>
          </section>

          <section className="u-card">
            <div className="sw__life" data-dying={dying}>
              <span className="sw__life-label">
                {carried ? "Carried by you. Clock reset." : `${hoursLeft}h left`}
              </span>
              <span className="sw__life-track">
                <span
                  className="sw__life-fill"
                  style={{ transform: `scaleX(${carried ? 1 : 1 - node.age})` }}
                />
              </span>
            </div>
            <p className="u-hint" style={{ marginTop: "0.8rem", lineHeight: 1.7 }}>
              {carried
                ? "It is in your sky now. Anyone who reaches you can take it further."
                : "If nobody carries this, it is gone and there is no copy of it anywhere."}
            </p>
          </section>

          <div className="sw__actions">
            <button
              className="u-btn"
              data-on={carried}
              onClick={() => {
                setCarried(!carried);
                cue(carried ? "click" : "tick");
              }}
            >
              {carried ? "Carrying" : "Carry it"}
            </button>
            <span className="u-hint">
              {node.carried + (carried ? 1 : 0)} people have
            </span>
          </div>
        </div>
      )}

      {tab === "Path" && (
        <section className="u-card">
          <h3 className="u-h">How it got to you</h3>
          <ol className="sw__path">
            {chain.map((c, i) => (
              <li key={i} className="sw__hop">
                <span className="sw__hop-dot" aria-hidden />
                <span className="sw__hop-name">{c.author}</span>
                <span className="sw__hop-meta">{c.world}</span>
              </li>
            ))}
          </ol>
          <p className="u-hint" style={{ marginTop: "1rem", lineHeight: 1.7 }}>
            {chain.length} {chain.length === 1 ? "person" : "people"}, each of
            whom chose to move it one place further. No algorithm touched it.
          </p>
        </section>
      )}

      {tab === "Replies" && (
        <div className="u-grid">
          <section className="u-card">
            <textarea
              className="u-textarea"
              value={reply}
              onChange={(e) => setReply(e.target.value.slice(0, 200))}
              placeholder="Reply to this. It stays here; it does not travel."
            />
            <button
              className="u-btn u-btn--ghost"
              style={{ marginTop: "0.8rem" }}
              disabled={!reply.trim()}
              onClick={() => {
                setReplies([reply.trim(), ...replies]);
                setReply("");
                cue("click");
              }}
            >
              Reply
            </button>
          </section>

          <section className="u-card">
            {replies.length === 0 && <p className="u-empty">Nothing said yet</p>}
            {replies.map((r, i) => (
              <div className="u-row" key={i}>
                <div className="u-row__main">
                  <span className="sw__reply">{r}</span>
                  <span className="u-row__meta">you · just now</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </Window>
  );
}
