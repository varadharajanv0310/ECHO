import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** What to show instead. Receives the error and a way to try again. */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Where this boundary sits, used in the message and in the console. */
  label?: string;
};

type State = { error: Error | null };

/**
 * The last line, so a thrown error is a message rather than a black screen.
 *
 * ECHO renders into a canvas that fills the viewport. Without a boundary, an
 * exception anywhere in the tree unmounts everything and leaves exactly what a
 * WebGL failure leaves - a dark rectangle - so the two most likely ways this
 * can break are indistinguishable to the person it happened to.
 *
 * There is no error reporting service to send this to, and deliberately so.
 * It is logged to the console and shown to the reader, and that is the whole
 * of it.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(
      `[${this.props.label ?? "ECHO"}] ${error.message}`,
      info.componentStack,
    );
  }

  private retry = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.retry);

    return (
      <div className="u-boundary" role="alert">
        <h2 className="u-boundary__title">Something here stopped working</h2>
        <p className="u-boundary__body">
          {this.props.label ? `${this.props.label} ` : "This part "}
          could not be drawn. The rest of the page is unaffected, and nothing you have
          written has been lost - it is in this browser, not in whatever just failed.
        </p>
        <pre className="u-boundary__detail">{error.message}</pre>
        <button type="button" className="u-btn" onClick={this.retry}>
          Try again
        </button>
      </div>
    );
  }
}
