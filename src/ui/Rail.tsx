import { PANELS, useUI } from "@/store";
import type { PanelId } from "@/types";
import { useUnseen } from "@/hooks/useUnseen";
import "./ui.css";

const ICONS: Record<PanelId, string> = {
  // Simple, single-weight glyphs. At 18px anything more detailed is mud.
  profile:
    "M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z M4 20.5c0-3.6 3.6-5.6 8-5.6s8 2 8 5.6",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  create: "M12 5v14 M5 12h14",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4-4",
  dashboard: "M4 14h5v6H4z M4 4h5v7H4z M14 4h6v5h-6z M14 12h6v8h-6z",
};

const LABELS: Record<PanelId, string> = {
  profile: "Profile",
  menu: "Menu",
  create: "Create",
  search: "Search",
  dashboard: "Dashboard",
};

/**
 * The five ways out of the sky.
 *
 * A vertical rail on the left rather than a top bar, because the constellation
 * is wider than it is tall and a horizontal bar would eat the part of the
 * frame the sky actually uses. Labels sit beside the icons on hover instead of
 * under them permanently - the rail should be almost invisible until wanted.
 */
export function Rail() {
  const panel = useUI((s) => s.panel);
  const setPanel = useUI((s) => s.setPanel);
  // The only number in ECHO that is allowed to be shown, and only because it
  // is a count of things waiting to be read rather than a measure of anything.
  const unseen = useUnseen();

  return (
    <nav className="rail" style={{ zIndex: "var(--z-rail)" }} aria-label="Main">
      {PANELS.map((id) => (
        <button
          type="button"
          key={id}
          className="rail__btn"
          data-on={panel === id}
          onClick={() => setPanel(panel === id ? null : id)}
          aria-pressed={panel === id}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              d={ICONS[id]}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="rail__label">{LABELS[id]}</span>
          {id === "dashboard" && unseen > 0 && (
            <span
              className="rail__dot"
              aria-label={`${unseen} new`}
              data-many={unseen > 9}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
