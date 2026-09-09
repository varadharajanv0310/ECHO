import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import "./ui.css";

type Props = {
  title: string;
  subtitle?: string;
  tabs: readonly string[];
  active: string;
  onTab: (t: string) => void;
  onClose: () => void;
  children: ReactNode;
  /**
   * Wide for browsing two columns, mid for a column you read down, narrow
   * for a single task.
   */
  size?: "wide" | "mid" | "narrow";
  /** Hue this window is tinted by. Defaults to the app accent. */
  accent?: number;
  /**
   * The body fills the window instead of scrolling inside it.
   *
   * For a window that owns its own scrolling - a conversation, where the
   * thread scrolls but the composer under it must stay put. Without this the
   * body scrolls as one piece and the thing you type into leaves the screen.
   */
  fill?: boolean;
};

/**
 * The window every panel lives in.
 *
 * It opens over the sky rather than navigating away from it: the sky stays
 * visible and lit behind the glass, so nothing in ECHO is ever a separate page
 * you have left your signals to go and visit. That is why it is a window and
 * not a route.
 *
 * Arrival and departure of the window as a whole belong to Panels, which holds
 * it mounted for a moment after dismissal so it can animate away. This
 * component is only the furniture.
 */
export function Window({
  title,
  subtitle,
  tabs,
  active,
  onTab,
  onClose,
  children,
  size = "wide",
  accent,
  fill = false,
}: Props) {
  // Escape closes. A window that can only be dismissed by hitting a small
  // target is a trap for anyone not using a mouse.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  /**
   * Keep focus inside the dialog, and give it back afterwards.
   *
   * A modal that does not trap focus is a modal only for people using a
   * mouse: tab once and you are behind it, operating a sky you cannot see,
   * with no way to tell where you are. Returning focus to whatever opened it
   * is the other half - otherwise closing a window drops you at the top of
   * the document every time.
   */
  const shell = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = shell.current;
    if (!root) return;

    const focusable = (): HTMLElement[] =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el: HTMLElement) => el.offsetParent !== null);

    focusable()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <>
      <div
        className="win-scrim"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />

      <section
        ref={shell}
        className="win"
        data-size={size}
        style={
          accent !== undefined
            ? ({ "--accent-h": accent } as React.CSSProperties)
            : undefined
        }
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="win__bar">
          <div className="win__id">
            <span className="win__title">{title}</span>
            {subtitle && <span className="win__sub">{subtitle}</span>}
          </div>

          <nav className="win__tabs">
            {tabs.map((t) => (
              <button
                key={t}
                className="win__tab"
                data-on={t === active}
                onClick={() => onTab(t)}
              >
                {t}
                {/* Deliberately a plain element. As a shared layoutId this
                    slid nicely between tabs, but a pending shared-layout
                    animation keeps AnimatePresence waiting, so closing the
                    window left an invisible full-screen layer in the DOM
                    swallowing every click on the sky behind it. */}
                {t === active && <i className="win__tab-mark" aria-hidden />}
              </button>
            ))}
          </nav>

          <button className="win__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
              <path
                d="M5 5 L19 19 M19 5 L5 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </header>

        {/* Tab content fades up on change, with no exit to wait for.
            A nested AnimatePresence here is what kept the window in the DOM
            forever: while the parent was leaving, the inner presence was never
            told to exit, so its unresolved children blocked the outer one from
            ever completing. Keying a motion element gives the same arrival and
            nothing to hold. */}
        {/* Scrolls internally, so Lenis has to leave its gestures alone. */}
        <div className="win__body" data-fill={fill} data-lenis-prevent>
          <div key={active} className="win__tabin">
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
