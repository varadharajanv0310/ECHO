/**
 * The pictures on the tutorial cards.
 *
 * Drawn rather than screenshotted, for two reasons. A screenshot of the sky is
 * mostly black with a few bright points in it, which explains nothing at card
 * size. And half of what needs explaining is not a state the interface is ever
 * in at one moment - a signal decaying over a day, or the same signal moving
 * from one person to another - so there is nothing to photograph.
 *
 * Everything here is stroked in the reader's own accent, so the tutorial is
 * already the colour they picked before it tells them they picked it.
 */

const V = "0 0 340 150";

/** A sun with rings and bodies on them. The shape the whole app resolves to. */
function System({
  x,
  y,
  r = 9,
  rings = [24, 38],
  dim = false,
}: {
  x: number;
  y: number;
  r?: number;
  rings?: number[];
  dim?: boolean;
}) {
  return (
    <g opacity={dim ? 0.45 : 1}>
      {rings.map((rr, i) => (
        <ellipse
          key={rr}
          cx={x}
          cy={y}
          rx={rr}
          ry={rr * 0.42}
          className="ta-ring"
          transform={`rotate(${-12 - i * 6} ${x} ${y})`}
        />
      ))}
      <circle cx={x} cy={y} r={r} className="ta-sun" />
      {rings.map((rr, i) => (
        <circle
          key={`p${rr}`}
          cx={x + (i % 2 ? -rr * 0.86 : rr * 0.9)}
          cy={y + (i % 2 ? -rr * 0.22 : rr * 0.28)}
          r={3.2}
          className="ta-body"
        />
      ))}
    </g>
  );
}

function Arrow({ x, y, w = 26 }: { x: number; y: number; w?: number }) {
  return (
    <g className="ta-arrow">
      <path d={`M${x} ${y} h${w}`} />
      <path d={`M${x + w - 5} ${y - 4} l5 4 l-5 4`} />
    </g>
  );
}

function Cap({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} className="ta-cap" textAnchor="middle">
      {children}
    </text>
  );
}

/* ---------------------------------------------------------------- 1. where */

/** Zooming in: a sky of places, one place of people, one person and their things. */
export function ArtHierarchy() {
  const dots = [
    [30, 44],
    [64, 30],
    [92, 58],
    [44, 74],
    [78, 88],
    [22, 96],
  ];
  const chain: [number, number][] = [
    [150, 40],
    [178, 60],
    [206, 44],
    [196, 82],
    [162, 88],
  ];
  return (
    <svg viewBox={V} className="ta">
      {dots.map(([x, y]) => (
        <circle key={`${x}`} cx={x} cy={y} r={3.4} className="ta-body" />
      ))}
      <Cap x={58} y={124}>
        PLACES
      </Cap>
      <Arrow x={108} y={64} />

      {chain.slice(1).map(([x, y], i) => (
        <path
          key={`l${x}`}
          d={`M${chain[i][0]} ${chain[i][1]} L${x} ${y}`}
          className="ta-link"
        />
      ))}
      {chain.map(([x, y]) => (
        <circle key={`c${x}`} cx={x} cy={y} r={3.6} className="ta-body" />
      ))}
      <Cap x={178} y={124}>
        PEOPLE
      </Cap>
      <Arrow x={228} y={64} />

      <System x={292} y={64} />
      <Cap x={292} y={124}>
        WHAT THEY CARRY
      </Cap>
    </svg>
  );
}

/* --------------------------------------------------------------- 2. belong */

/** A signal is filed under the place, not under the person who wrote it. */
export function ArtBelongs() {
  return (
    <svg viewBox={V} className="ta">
      <ellipse cx={170} cy={66} rx={132} ry={46} className="ta-field" />
      <text x={170} y={26} className="ta-cap" textAnchor="middle">
        3AM
      </text>

      <System x={110} y={74} rings={[26]} />
      <System x={236} y={74} rings={[30]} dim />

      <path d="M136 62 C168 34 202 40 216 60" className="ta-flow" />
      <path d="M216 60 l-7 -3 l1 7" className="ta-flow" />
      <Cap x={172} y={124}>
        IT STAYS IN THE PLACE. IT DOES NOT STAY WITH YOU.
      </Cap>
    </svg>
  );
}

/* ----------------------------------------------------------------- 3. dies */

/** The clock. Three of the same thing at three ages. */
export function ArtDecay() {
  const at = [62, 170, 278];
  return (
    <svg viewBox={V} className="ta">
      {at.map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={62} rx={34} ry={15} className="ta-ring" />
          {i < 2 && (
            <circle
              cx={x + 30}
              cy={68}
              r={i === 0 ? 5 : 4}
              className={i === 0 ? "ta-body" : "ta-body ta-body--dying"}
            />
          )}
          <circle cx={x} cy={62} r={7} className="ta-sun" opacity={1 - i * 0.3} />
        </g>
      ))}
      <path d="M28 104 H312" className="ta-axis" />
      <Cap x={62} y={124}>
        SENT
      </Cap>
      <Cap x={170} y={124}>
        FADING
      </Cap>
      <Cap x={278} y={124}>
        GONE
      </Cap>
    </svg>
  );
}

/* ---------------------------------------------------------------- 4. carry */

/** The one verb. It moves, and its clock starts again. */
export function ArtCarry() {
  return (
    <svg viewBox={V} className="ta">
      <System x={76} y={70} rings={[28]} />
      <System x={266} y={70} rings={[30]} />

      <path d="M112 52 C160 18 200 22 236 50" className="ta-flow" />
      <path d="M236 50 l-8 -2 l2 8" className="ta-flow" />
      <circle cx={174} cy={30} r={4.4} className="ta-body" />

      <g className="ta-reset">
        <circle cx={174} cy={82} r={13} />
        <path d="M174 74 v8 l5 4" />
      </g>
      <Cap x={174} y={124}>
        CARRIED. THE CLOCK STARTS AGAIN.
      </Cap>
    </svg>
  );
}

/* ------------------------------------------------------------- 5. what is not */

/** What is missing, and what is there instead. */
export function ArtNoFeed() {
  return (
    <svg viewBox={V} className="ta">
      <g className="ta-feed">
        {[30, 52, 74, 96].map((y) => (
          <rect key={y} x={26} y={y} width={92} height={14} rx={4} />
        ))}
      </g>
      <path d="M22 24 L124 112" className="ta-strike" />
      <Cap x={72} y={132}>
        NO FEED, NO RANKING
      </Cap>

      <Arrow x={140} y={68} />

      <g>
        {[
          [206, 40],
          [244, 62],
          [282, 36],
          [268, 92],
          [222, 96],
          [300, 70],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={3.6} className="ta-body" />
        ))}
        <path d="M206 40 L244 62 L282 36 M244 62 L268 92 L222 96" className="ta-link" />
      </g>
      <Cap x={254} y={132}>
        A PLACE YOU GO INTO
      </Cap>
    </svg>
  );
}

/* ----------------------------------------------------------------- 6. move */

/** Three clicks, in order. */
export function ArtMove() {
  const step = (x: number, n: string, label: string) => (
    <g key={n}>
      <circle cx={x} cy={54} r={17} className="ta-step" />
      <text x={x} y={59} className="ta-num" textAnchor="middle">
        {n}
      </text>
      <Cap x={x} y={96}>
        {label}
      </Cap>
    </g>
  );
  return (
    <svg viewBox={V} className="ta">
      <path d="M87 54 H123 M191 54 H227" className="ta-axis" />
      {step(60, "1", "A PLACE")}
      {step(157, "2", "A PERSON")}
      {step(254, "3", "A THING")}
      <Cap x={170} y={128}>
        CLICK AGAIN ON SOMEBODY TO OPEN WHO THEY ARE
      </Cap>
    </svg>
  );
}
