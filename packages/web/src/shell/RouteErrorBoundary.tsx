import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../ui/ErrorState';

export interface RouteErrorBoundaryProps {
  /** Clears the error when it changes (the shell passes the current pathname). */
  resetKey: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
  /** Retries since the last reset; keys the error state so each new failure remounts it. */
  attempt: number;
}

/**
 * Catches render errors in the routed page so the shell (sidebar, utility bar) stays usable.
 * Shows the page-level `ErrorState`; Retry re-renders the page, and navigating to another route
 * resets it too. When a retry fails again, the new error state is remounted (so it is announced
 * again) and focus moves to its heading, since the Retry button that had focus was replaced.
 *
 * Retry only re-renders: it cannot recover a lazy route whose chunk failed to load, because
 * `React.lazy` caches the rejected import. That needs a full reload.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
  override state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    const { error, attempt } = this.state;
    if (error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, attempt: 0 });
    } else if (!error && attempt > 0) {
      // A retry rendered the page (a failed one never commits without the error).
      this.setState({ attempt: 0 });
    }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Route render failed', error, info.componentStack);
  }

  private readonly retry = () =>
    this.setState(({ attempt }) => ({ error: null, attempt: attempt + 1 }));

  override render() {
    const { error, attempt } = this.state;
    if (!error) return this.props.children;

    return (
      <ErrorState
        key={attempt}
        focusOnMount={attempt > 0}
        variant="page"
        title="Something went wrong"
        description="This page failed to load. Try again, or go back to Overview."
        detail={error.message}
        onRetry={this.retry}
      />
    );
  }
}
