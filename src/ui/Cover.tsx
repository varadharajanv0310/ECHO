import { coverFor } from "@/lib/library";

type Props = { title: string; size?: number; radius?: number };

/**
 * Generated cover art.
 *
 * Every title gets a gradient and a monogram derived from its own name, so a
 * shelf reads as artwork rather than as a row of broken images - and the hues
 * stay inside the palette band the rest of ECHO uses, so twenty covers still
 * look like they belong to this interface.
 */
export function Cover({ title, size = 96, radius = 14 }: Props) {
  const c = coverFor(title);
  return (
    <span
      className="cov"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: c.css,
        fontSize: size * 0.34,
      }}
      aria-hidden
    >
      <i className="cov__sheen" style={{ borderRadius: radius }} />
      <b>{c.mono}</b>
    </span>
  );
}
