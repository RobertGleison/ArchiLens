import { Component, type ErrorInfo, type ReactNode } from 'react';
import { PageHeading } from '../ui/PageHeading';
import styles from './RouteErrorBoundary.module.css';

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
 * Navigating to another route resets it.
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

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <>
        <PageHeading
          title="Something went wrong"
          description="This page failed to load. Try another page, or reload the app."
        />
        <p className={styles.detail}>{error.message}</p>
      </>
    );
  }
}
