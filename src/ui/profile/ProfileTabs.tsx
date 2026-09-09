import { Mark, MARKS } from "@/components/Mark";
import { Cover } from "../Cover";
import { copy } from "@/copy";
import { GAMES, SONGS, PLACES } from "@/services/library";
import { Chip } from "@/ui/primitives";
import type { Link, Profile, Settings, MarkId } from "@/types";

/**
 * The bodies of the profile's tabs.
 *
 * ProfileWindow was a single five-hundred-line function whose job was
 * genuinely five jobs: derive one shape from either your profile or somebody
 * else's, draw the identity column, and then draw four unrelated panels. The
 * first two are what the window is; these four are what it happens to be
 * showing, and they have no reason to be read while working on either.
 *
 * They take a plain view object rather than reaching into the store, so each
 * one renders the same whether the profile is yours or somebody else's, and
 * can be tested by handing it a shape.
 *
 * @packageDocumentation
 */

/** The one shape everything below reads from, whoever the profile belongs to. */
export type ProfileView = {
  name: string;
  hue: number;
  mark: MarkId;
  bio: string;
  status: string;
  traits: string[];
  worlds: string[];
  games: string[];
  songs: string[];
  favourite?: string;
  banner: number;
  links: Link[];
  since: string;
};

type Shared = {
  view: ProfileView;
  /** Whether this is the reader's own profile, and therefore editable. */
  own: boolean;
};

/** The five choosable hues, violet through magenta. Amber is never offered. */
export const HUES = [258, 268, 278, 292, 306, 322, 336];
export const BANNERS = [0, 1, 2, 3];

export const ACCENTS = [
  { id: "violet", label: "Violet", swatch: "#b026ff" },
  { id: "magenta", label: "Magenta", swatch: "#fa42b0" },
  { id: "indigo", label: "Indigo", swatch: "#6f5bff" },
  { id: "ice", label: "Ice", swatch: "#9db4ff" },
] as const;

/* ---------------------------------------------------------------- games */

/**
 * The shelf.
 *
 * On your own profile a tile is a control, so it is a button and can be
 * reached with the tab key. On somebody else's it is a picture of a thing they
 * like, so it stays a figure - a control that does nothing is worse than no
 * control at all.
 */
export function GamesTab({
  view,
  own,
  onToggle,
}: Shared & { onToggle: (id: string) => void }) {
  const shown = own ? GAMES : GAMES.filter((g) => view.games.includes(g.id));

  return (
    <section className="u-card">
      <h3 className="u-h">{own ? "Your shelf" : `${view.name} plays`}</h3>
      <div className="pw__shelf">
        {shown.map((g) =>
          own ? (
            <button
              type="button"
              className="pw__tile"
              key={g.id}
              data-on={view.games.includes(g.id)}
              data-pick
              aria-pressed={view.games.includes(g.id)}
              onClick={() => onToggle(g.id)}
            >
              <Cover title={g.title} size={92} />
              <span className="pw__tile-name">{g.title}</span>
            </button>
          ) : (
            <figure className="pw__tile" key={g.id} data-on={view.games.includes(g.id)}>
              <Cover title={g.title} size={92} />
              <figcaption>{g.title}</figcaption>
            </figure>
          ),
        )}
      </div>
      {own && (
        <p className="u-hint" style={{ marginTop: "1rem" }}>
          Click to add or remove. The first one you pick is your favourite.
        </p>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- sound */

export function SoundTab({
  view,
  own,
  onToggle,
}: Shared & { onToggle: (id: string) => void }) {
  const shown = own ? SONGS : SONGS.filter((s) => view.songs.includes(s.id));

  return (
    <section className="u-card">
      <h3 className="u-h">{own ? "Your songs" : `${view.name} listens to`}</h3>
      {shown.map((s) => (
        <button
          type="button"
          className="pw__song pw__song--pick"
          key={s.id}
          data-on={view.songs.includes(s.id)}
          aria-pressed={own ? view.songs.includes(s.id) : undefined}
          onClick={own ? () => onToggle(s.id) : undefined}
          disabled={!own}
        >
          <Cover title={s.title} size={44} radius={8} />
          <div className="u-row__main">
            <span className="u-row__title">{s.title}</span>
            <span className="u-row__meta">{s.by}</span>
          </div>
        </button>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------- links */

export function LinksTab({
  view,
  onPatch,
}: {
  view: ProfileView;
  onPatch: (p: Partial<Profile>) => void;
}) {
  return (
    <section className="u-card">
      <h3 className="u-h">Elsewhere</h3>
      <p className="u-hint" style={{ lineHeight: 1.7 }}>
        Stored in this browser. Nothing is verified and nothing is sent anywhere, so
        these are handles rather than links - ECHO has no way to know that any of them
        is really you.
      </p>
      <div className="pw__places">
        {PLACES.map((pl) => (
          <label className="pw__place" key={pl.id}>
            <span>{pl.label}</span>
            <input
              className="u-input"
              value={view.links.find((l) => l.label === pl.id)?.value ?? ""}
              placeholder="handle"
              onChange={(e) => {
                const value = e.target.value.slice(0, 32);
                const rest = view.links.filter((l) => l.label !== pl.id);
                onPatch({ links: value ? [...rest, { label: pl.id, value }] : rest });
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- theme */

export function ThemeTab({
  view,
  settings,
  onPatch,
  onSettings,
}: {
  view: ProfileView;
  settings: Settings;
  onPatch: (p: Partial<Profile>) => void;
  onSettings: (s: Partial<Settings>) => void;
}) {
  return (
    <>
      <section className="u-card">
        <h3 className="u-h">Your colour</h3>
        <p className="u-hint" style={{ marginBottom: "0.9rem" }}>
          This tints your mark, your star in the sky, your cursor, and every surface of
          your own interface.
        </p>
        <div className="pw__hues">
          {HUES.map((h) => (
            <button
              type="button"
              key={h}
              className="pw__hue"
              data-on={h === view.hue}
              aria-pressed={h === view.hue}
              onClick={() => onPatch({ hue: h })}
              aria-label={`hue ${h}`}
              style={{ "--h": h } as React.CSSProperties}
            />
          ))}
        </div>
      </section>

      <section className="u-card">
        <h3 className="u-h">Mark</h3>
        <div className="pw__marks">
          {MARKS.map((m) => (
            <button
              type="button"
              key={m}
              className="pw__mark"
              data-on={m === view.mark}
              aria-pressed={m === view.mark}
              onClick={() => onPatch({ mark: m })}
              aria-label={m}
            >
              <Mark mark={m} hue={view.hue} size={26} glow={m === view.mark} />
            </button>
          ))}
        </div>
      </section>

      <section className="u-card">
        <h3 className="u-h">Banner</h3>
        <div className="pw__banners">
          {/* Both classes: the gradients are defined on .pw__banner, the swatch
              sizing on .pw__banner-pick. With only the latter these render as
              four empty outlines. */}
          {BANNERS.map((b) => (
            <button
              type="button"
              key={b}
              className="pw__banner pw__banner-pick"
              data-b={b}
              data-on={b === view.banner}
              aria-pressed={b === view.banner}
              onClick={() => onPatch({ banner: b })}
              aria-label={`banner ${b}`}
            />
          ))}
        </div>
      </section>

      <section className="u-card">
        <h3 className="u-h">Ground</h3>
        <div className="u-chips">
          {(["dark", "light"] as const).map((m) => (
            <Chip
              key={m}
              selected={settings.mode === m}
              onClick={() => onSettings({ mode: m })}
            >
              {m}
            </Chip>
          ))}
        </div>
        <div className="u-chips" style={{ marginTop: "0.7rem" }}>
          {ACCENTS.map((a) => (
            <Chip
              key={a.id}
              selected={settings.accent === a.id}
              onClick={() => onSettings({ accent: a.id })}
            >
              {a.label}
            </Chip>
          ))}
        </div>
        <p className="u-hint" style={{ marginTop: "0.9rem", lineHeight: 1.7 }}>
          Amber is not offered. It is the colour a signal turns when it is dying.
        </p>
      </section>

      <section className="u-card">
        <h3 className="u-h">{copy.profile.traitsLabel}</h3>
        <div className="u-chips">
          {copy.traits.map((t) => (
            <Chip
              key={t}
              selected={view.traits.includes(t)}
              onClick={() =>
                onPatch({
                  traits: view.traits.includes(t)
                    ? view.traits.filter((x) => x !== t)
                    : view.traits.length >= 5
                      ? view.traits
                      : [...view.traits, t],
                })
              }
            >
              {t}
            </Chip>
          ))}
        </div>
      </section>
    </>
  );
}
