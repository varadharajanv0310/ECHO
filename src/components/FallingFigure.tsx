import figureUrl from "@/assets/falling-figure.png";
import "./falling-figure.css";

type Props = { className?: string };

/**
 * The falling figure from the loading reference.
 *
 * This is the reference silhouette itself, thresholded out of the source image
 * and kept as an alpha mask. Two hand-authored SVG attempts came before it and
 * both failed the only test that matters: at the size this actually renders,
 * roughly a hundred pixels, a constructed figure collapses into an abstract
 * shape. The real silhouette reads as a person instantly because its
 * proportions and its foreshortening are real.
 *
 * It still tumbles and drifts, which a static placement would not.
 */
export function FallingFigure({ className }: Props) {
  return (
    <div className={className}>
      <div className="ff">
        <img className="ff__img" src={figureUrl} alt="" aria-hidden />
      </div>
    </div>
  );
}
