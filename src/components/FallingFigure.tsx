import "./falling-figure.css";

type Props = { className?: string };

/**
 * The falling figure from the loading reference, drawn rather than placed.
 *
 * It is built from round-capped strokes because that is what gives a
 * silhouette organic taper without hand-authoring an outline path - and
 * because a drawn figure can tumble, drift and breathe, which a flat cutout
 * cannot. Drag pulls the limbs upward, so the arms trail above the body.
 */
export function FallingFigure({ className }: Props) {
  return (
    <div className={className}>
      <div className="ff">
        <div className="ff__halo" aria-hidden />
        <svg className="ff__svg" viewBox="0 0 120 150" aria-hidden>
          {/* Asymmetric and tilted on purpose. A symmetric figure with limbs
              mirrored reads as a jumping jack, not a fall. Drag lifts the arms,
              one knee folds, the torso is off axis, and the whole body is
              rotated out of vertical so it reads as tumbling. */}
          <g
            className="ff__body"
            transform="rotate(-24 60 78)"
            fill="none"
            stroke="#fdfbff"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="64" cy="40" r="8.6" fill="#fdfbff" stroke="none" />
            <path d="M63,50 C60,62 57,73 54,84" strokeWidth="14.5" />
            <path d="M69,56 C82,51 91,39 95,25" strokeWidth="7.6" />
            <path d="M56,56 C46,54 38,47 33,34" strokeWidth="7.6" />
            <path d="M57,86 C63,96 67,105 62,117" strokeWidth="10" />
            <path d="M51,86 C45,100 40,113 34,127" strokeWidth="10" />
          </g>
        </svg>
      </div>
    </div>
  );
}
