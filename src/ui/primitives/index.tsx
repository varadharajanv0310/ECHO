import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/utils";
import "./primitives.css";

/**
 * The pieces the interface is assembled from.
 *
 * These were classes before they were components - `u-btn`, `u-card`,
 * `u-chip`, `u-empty` - which meant every call site had to remember the class,
 * the element, and which of `type="button"`, `aria-pressed` and a focus style
 * it needed. Most of them remembered two out of three, and the audit that
 * found sixty-two buttons without a type is what that costs.
 *
 * A component cannot forget. Each of these carries its own semantics: the
 * button is always a button, the chip always reports whether it is pressed,
 * the field is always associated with its label.
 *
 * @packageDocumentation
 */

export { ErrorBoundary } from "./ErrorBoundary";

/* --------------------------------------------------------------- button */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `go` is the affirmative one, `ghost` the quiet one. */
  variant?: "default" | "go" | "ghost";
  /** Fills the width it is given. */
  block?: boolean;
};

/**
 * A button, which is always a `<button>` and always states its type.
 *
 * A typeless button inside a form submits it, which is a bug that only appears
 * once somebody wraps the surrounding markup in a form.
 */
export function Button({
  variant = "default",
  block = false,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "u-btn",
        variant === "go" && "u-btn--go",
        variant === "ghost" && "u-btn--ghost",
        block && "u-btn--block",
        className,
      )}
      {...rest}
    />
  );
}

/* ----------------------------------------------------------------- chip */

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  /** Whether this chip is currently selected. */
  selected?: boolean;
};

/**
 * A chip: a small on/off control in a row of alternatives.
 *
 * Reports its state through `aria-pressed` as well as through colour, because
 * colour alone is not an answer to "is this one on".
 */
export function Chip({ selected = false, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={cn("u-chip", className)}
      data-on={selected}
      aria-pressed={selected}
      {...rest}
    />
  );
}

/* ----------------------------------------------------------------- card */

/** A bounded group of related things, with an optional heading. */
export function Card({
  title,
  children,
  className,
  ...rest
}: { title?: ReactNode; children: ReactNode; className?: string } & Record<
  string,
  unknown
>) {
  return (
    <section className={cn("u-card", className)} {...rest}>
      {title ? <h3 className="u-h">{title}</h3> : null}
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- field */

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Always rendered, visually hidden when `hideLabel` is set. */
  label: string;
  hideLabel?: boolean;
  /** A line under the field explaining it. */
  hint?: ReactNode;
  multiline?: boolean;
};

/**
 * A labelled field.
 *
 * The label and the control are associated by a generated id, so it is not
 * possible to use this and end up with an unlabelled input - which is the
 * failure this primitive exists to make unreachable.
 */
export function Field({
  label,
  hideLabel = false,
  hint,
  multiline = false,
  className,
  ...rest
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="u-field">
      <label className={hideLabel ? "sr-only" : "u-label"} htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          aria-describedby={hintId}
          className={cn("u-textarea", className)}
          {...(rest as object)}
        />
      ) : (
        <input
          id={id}
          aria-describedby={hintId}
          className={cn("u-input", className)}
          {...rest}
        />
      )}
      {hint ? (
        <span className="u-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- badge */

/** A small, non-interactive label. A trait, a state, a count. */
export function Badge({ children, tone }: { children: ReactNode; tone?: "dying" }) {
  return (
    <span className="u-badge" data-tone={tone}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- feedback */

/**
 * What to show where there is nothing.
 *
 * An empty region with no explanation reads as a bug. Every one of these says
 * what would be here and, where it helps, what to do about it.
 */
export function EmptyState({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="u-empty-state">
      <p className="u-empty">{children}</p>
      {action}
    </div>
  );
}

/**
 * Something is on its way.
 *
 * Announced politely rather than silently, so a screen reader is told that a
 * wait is happening rather than being left in a region that has not changed.
 */
export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="u-loading" role="status" aria-live="polite">
      <Skeleton lines={3} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** The shape of content that has not arrived, so the layout does not jump. */
export function Skeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="u-skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span className="u-skeleton__line" key={i} />
      ))}
    </div>
  );
}
