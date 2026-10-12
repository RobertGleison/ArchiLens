import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../ui/ErrorState';

export interface RouteErrorBoundaryProps {
  /** Clears the error when it changes (the shell passes the current pathname). */
  resetKey: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in the routed page so the shell (sidebar, utility bar) stays usable.
 * Shows the page-level `ErrorState`; Retry re-renders the page, and navigating to another route
 * resets it too.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Route render failed', error, info.componentStack);
  }

  private readonly retry = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <ErrorState
        variant="page"
        title="Something went wrong"
        description="This page failed to load. Try again, or go back to Overview."
        detail={error.message}
        onRetry={this.retry}
      />
    );
  }
}
