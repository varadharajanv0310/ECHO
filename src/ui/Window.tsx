import type { ReactNode } from "react";
import { useEffect } from "react";
import "./ui.css";

type Props = {
  title: string;
  subtitle?: string;
  tabs: readonly string[];
  active: string;
  onTab: (t: string) => void;
  onClose: () => void;
  children: ReactNode;
  /** Wide windows for browsing, narrow for a single task. */
  size?: "wide" | "narrow";
};

/**
 * The window every panel lives in.
 *
 * It opens over the constellation rather than navigating away from it: the sky
 * stays visible and lit behind the glass, so nothing in ECHO is ever a
 * separate page you have left your signals to go and visit. That is why it is
 * a window and not a route.
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

  return (
    <div className="win-layer" style={{ zIndex: "var(--z-window)" }}>
      <div
        className="win-scrim"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />

      <section
        className="win"
        data-size={size}
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

        <div className="win__body">{children}</div>
      </section>
    </div>
  );
}
