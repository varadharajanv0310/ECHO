import { copy } from "@/copy";
import "./no-webgl.css";

/**
 * What somebody sees when the browser cannot give us a WebGL context.
 *
 * Not an error page. Somebody who lands here still came to find out what ECHO
 * is, and the argument does not actually need the graphics - the field guide
 * carries all of it in text. So this says what is wrong in one line, says how
 * to fix it, and then hands over the two links that still work.
 *
 * Set in the same type on the same ground as everything else, because a
 * fallback that looks unfinished suggests the thing behind it is too.
 */
export function NoWebGL() {
  return (
    <main className="ngl">
      <div className="ngl__box">
        <p className="ngl__eyebrow">Signal lost</p>

        <h1 className="ngl__word">ECHO</h1>

        <p className="ngl__lede">{copy.noWebGL.lede}</p>

        <div className="ngl__how">
          <p className="ngl__how-title">{copy.noWebGL.fixTitle}</p>
          <ul>
            {copy.noWebGL.fixes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="ngl__links">
          <a
            className="ngl__btn ngl__btn--go"
            href={`${import.meta.env.BASE_URL}guide.html`}
          >
            Read the field guide
          </a>
          <a
            className="ngl__btn"
            href="https://github.com/varadharajanv0310/ECHO"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
        </div>

        <p className="ngl__foot">{copy.noWebGL.foot}</p>
      </div>
    </main>
  );
}
