import { useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { copy } from "@/copy";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "../Window";

export const PROFILE_TABS = [
  "Board",
  "Sound",
  "Games",
  "Links",
  "Traits",
  "Theme",
] as const;

const ACCENTS = [
  { id: "violet", label: "Violet", swatch: "#b026ff" },
  { id: "magenta", label: "Magenta", swatch: "#fa42b0" },
  { id: "indigo", label: "Indigo", swatch: "#6f5bff" },
  { id: "ice", label: "Ice", swatch: "#9db4ff" },
] as const;

const HUES = [262, 276, 290, 306, 322];

/**
 * The full profile, opened as a window over your own sky.
 *
 * Identity on the left, everything you have chosen to show on the right. The
 * split matters: the left column is who you are and never changes shape, the
 * right column is whatever you have decided to put on display, and it can be
 * empty without the page looking broken.
 *
 * Nothing here is a metric. There is no follower count to put under the name
 * because there is no follower graph to count.
 */
export function ProfilePanel() {
  const profile = useSequence((s) => s.profile);
  const patch = useSequence((s) => s.patchProfile);
  const settings = useSequence((s) => s.settings);
  const setSettings = useSequence((s) => s.setSettings);
  const setPanel = useUI((s) => s.setPanel);
  const tab = useUI((s) => s.tab.profile);
  const setTab = useUI((s) => s.setTab);

  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [game, setGame] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkValue, setLinkValue] = useState("");

  if (!profile) return null;

  const songs = profile.songs ?? [];
  const games = profile.games ?? [];
  const links = profile.links ?? [];

  const toggleTrait = (t: string) => {
    const has = profile.traits.includes(t);
    patch({
      traits: has
        ? profile.traits.filter((x) => x !== t)
        : profile.traits.length >= 5
          ? profile.traits
          : [...profile.traits, t],
    });
  };

  const toggleWorld = (w: string) => {
    const has = profile.worlds.includes(w);
    if (has && profile.worlds.length === 1) return; // never leave them nowhere
    patch({
      worlds: has
        ? profile.worlds.filter((x) => x !== w)
        : [...profile.worlds, w],
    });
  };

  return (
    <Window
      title={profile.name}
      subtitle={profile.worlds.join("  ·  ")}
      tabs={PROFILE_TABS}
      active={tab}
      onTab={(t) => setTab("profile", t)}
      onClose={() => setPanel(null)}
    >
      <div className="u-2col">
        {/* ------------------------------------------------------ identity */}
        <aside className="u-card pp__id">
          <div
            className="pp__sigil"
            style={{
              background: `radial-gradient(closest-side, hsl(${profile.hue} 100% 60% / 0.35), transparent 72%)`,
            }}
          >
            <Mark mark={profile.mark as MarkId} hue={profile.hue} size={78} />
          </div>

          <input
            className="u-input pp__name"
            value={profile.name}
            onChange={(e) => patch({ name: e.target.value.slice(0, 24) })}
            aria-label="Name"
          />

          <input
            className="u-input"
            value={profile.status ?? ""}
            placeholder="Set a status"
            onChange={(e) => patch({ status: e.target.value.slice(0, 60) })}
            aria-label="Status"
          />

          <textarea
            className="u-textarea"
            value={profile.bio}
            placeholder="What you are here for"
            onChange={(e) => patch({ bio: e.target.value.slice(0, 180) })}
            aria-label="One line"
          />

          <div>
            <span className="u-label">Mark</span>
            <div className="pp__marks">
              {MARKS.map((m) => (
                <button
                  key={m}
                  className="pp__mark"
                  data-on={m === profile.mark}
                  onClick={() => patch({ mark: m })}
                  aria-label={m}
                >
                  <Mark mark={m} hue={profile.hue} size={22} glow={m === profile.mark} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="u-label">Colour</span>
            <div className="pp__hues">
              {HUES.map((h) => (
                <button
                  key={h}
                  className="pp__hue"
                  data-on={h === profile.hue}
                  onClick={() => patch({ hue: h })}
                  aria-label={`hue ${h}`}
                  style={{ "--h": h } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* --------------------------------------------------------- tabs */}
        <div className="u-grid">
          {tab === "Board" && (
            <>
              <section className="u-card">
                <h3 className="u-h">Worlds</h3>
                <div className="u-chips">
                  {copy.worlds.map((w) => (
                    <button
                      key={w}
                      className="u-chip"
                      data-on={profile.worlds.includes(w)}
                      onClick={() => toggleWorld(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <p className="u-hint" style={{ marginTop: "0.8rem" }}>
                  Signals from these reach you. Leaving one does not delete
                  anything you left there.
                </p>
              </section>

              <section className="u-card">
                <h3 className="u-h">How you listen</h3>
                <div className="u-chips">
                  {profile.traits.length === 0 && (
                    <span className="u-empty">Nothing chosen</span>
                  )}
                  {profile.traits.map((t) => (
                    <span key={t} className="u-chip" data-on="true">
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              <section className="u-card">
                <h3 className="u-h">Standing</h3>
                <div className="pp__stats">
                  <div>
                    <b>0</b>
                    <span>signals alive</span>
                  </div>
                  <div>
                    <b>0</b>
                    <span>carried by others</span>
                  </div>
                  <div>
                    <b>0</b>
                    <span>you carried</span>
                  </div>
                </div>
                <p className="u-hint" style={{ marginTop: "0.9rem" }}>
                  These are counts of what is still travelling, not a score.
                  They go down.
                </p>
              </section>
            </>
          )}

          {tab === "Sound" && (
            <section className="u-card">
              <h3 className="u-h">Songs</h3>
              <div className="pp__add">
                <input
                  className="u-input"
                  placeholder="Title"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                />
                <input
                  className="u-input"
                  placeholder="Artist"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                />
                <button
                  className="u-btn u-btn--ghost"
                  disabled={!songTitle.trim()}
                  onClick={() => {
                    patch({
                      songs: [
                        ...songs,
                        { title: songTitle.trim(), artist: songArtist.trim() },
                      ],
                    });
                    setSongTitle("");
                    setSongArtist("");
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ marginTop: "0.6rem" }}>
                {songs.length === 0 && <p className="u-empty">Nothing yet</p>}
                {songs.map((s, i) => (
                  <div className="u-row" key={`${s.title}-${i}`}>
                    <span className="pp__note" aria-hidden>
                      ♪
                    </span>
                    <div className="u-row__main">
                      <span className="u-row__title">{s.title}</span>
                      <span className="u-row__meta">{s.artist || "Unknown"}</span>
                    </div>
                    <button
                      className="u-x"
                      aria-label="Remove"
                      onClick={() =>
                        patch({ songs: songs.filter((_, k) => k !== i) })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "Games" && (
            <section className="u-card">
              <h3 className="u-h">Games</h3>
              <div className="pp__add">
                <input
                  className="u-input"
                  placeholder="Add a game"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && game.trim()) {
                      patch({ games: [...games, game.trim()] });
                      setGame("");
                    }
                  }}
                />
                <button
                  className="u-btn u-btn--ghost"
                  disabled={!game.trim()}
                  onClick={() => {
                    patch({ games: [...games, game.trim()] });
                    setGame("");
                  }}
                >
                  Add
                </button>
              </div>

              <div className="pp__tiles">
                {games.length === 0 && <p className="u-empty">Nothing yet</p>}
                {games.map((g, i) => (
                  <button
                    key={`${g}-${i}`}
                    className="pp__tile"
                    onClick={() => patch({ games: games.filter((_, k) => k !== i) })}
                    title="Remove"
                  >
                    <span>{g}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === "Links" && (
            <section className="u-card">
              <h3 className="u-h">Elsewhere</h3>
              <div className="pp__add">
                <input
                  className="u-input"
                  placeholder="Where"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                />
                <input
                  className="u-input"
                  placeholder="Handle"
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                />
                <button
                  className="u-btn u-btn--ghost"
                  disabled={!linkLabel.trim() || !linkValue.trim()}
                  onClick={() => {
                    patch({
                      links: [
                        ...links,
                        { label: linkLabel.trim(), value: linkValue.trim() },
                      ],
                    });
                    setLinkLabel("");
                    setLinkValue("");
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ marginTop: "0.6rem" }}>
                {links.length === 0 && <p className="u-empty">Nothing yet</p>}
                {links.map((l, i) => (
                  <div className="u-row" key={`${l.label}-${i}`}>
                    <div className="u-row__main">
                      <span className="u-row__title">{l.value}</span>
                      <span className="u-row__meta">{l.label}</span>
                    </div>
                    <button
                      className="u-x"
                      aria-label="Remove"
                      onClick={() =>
                        patch({ links: links.filter((_, k) => k !== i) })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <p className="u-hint" style={{ marginTop: "0.9rem" }}>
                Stored in this browser. Nothing is verified and nothing is sent
                anywhere.
              </p>
            </section>
          )}

          {tab === "Theme" && (
            <>
              <section className="u-card">
                <h3 className="u-h">Ground</h3>
                <div className="th__modes">
                  {(
                    [
                      ["dark", "Dark", "The void. Everything is made of light."],
                      ["light", "Light", "Ink on paper. The light becomes the mark."],
                    ] as const
                  ).map(([id, label, hint]) => (
                    <button
                      key={id}
                      className="th__mode"
                      data-on={settings.mode === id}
                      onClick={() => setSettings({ mode: id })}
                    >
                      <span className="th__swatch" data-mode={id} aria-hidden />
                      <span className="th__mode-name">{label}</span>
                      <span className="th__mode-hint">{hint}</span>
                    </button>
                  ))}
                </div>
                <p className="u-hint" style={{ marginTop: "0.9rem", lineHeight: 1.7 }}>
                  Light is not a tint of dark. The nebula, the road and the
                  galaxy are additive light, and light added to white is
                  nothing - so in light mode those layers invert, and violet
                  glow becomes violet ink.
                </p>
              </section>

              <section className="u-card">
                <h3 className="u-h">Accent</h3>
                <div className="th__accents">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      className="th__accent"
                      data-on={settings.accent === a.id}
                      onClick={() => setSettings({ accent: a.id })}
                      aria-label={a.label}
                    >
                      <span style={{ background: a.swatch }} aria-hidden />
                      <em>{a.label}</em>
                    </button>
                  ))}
                </div>
                <p className="u-hint" style={{ marginTop: "0.9rem", lineHeight: 1.7 }}>
                  Amber is not offered. It is the colour a signal turns when it
                  is dying, and painting the whole interface with it would break
                  the one rule the rest of the visual language rests on.
                </p>
              </section>
            </>
          )}

          {tab === "Traits" && (
            <section className="u-card">
              <h3 className="u-h">How you listen</h3>
              <div className="u-chips">
                {copy.traits.map((t) => (
                  <button
                    key={t}
                    className="u-chip"
                    data-on={profile.traits.includes(t)}
                    onClick={() => toggleTrait(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="u-hint" style={{ marginTop: "0.9rem" }}>
                Up to five. With no follower graph, this is most of how anyone
                finds you worth listening to.
              </p>
            </section>
          )}
        </div>
      </div>
    </Window>
  );
}
