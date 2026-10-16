import type { ReactNode } from 'react';

/** Where a data-backed area is: fetching, failed, loaded with nothing to show, or loaded. */
export type AsyncStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface AsyncStatusInput {
  /**
   * There is no data to show yet: the first load, or a retry after an error. Not a background
   * refetch of data already on screen; keep showing that data (`ready`) instead of a skeleton.
   */
  isLoading: boolean;
  /** The last request failed (any truthy value). */
  error?: unknown;
  /** The loaded data has nothing to show. */
  isEmpty?: boolean;
}

/**
 * Derives an `AsyncStatus`. An error wins over loading, so a retry keeps the error state on screen
 * (pass `retrying={isLoading}` to its `ErrorState`, and a `key` that changes per failure so a
 * repeated failure is announced again) instead of flashing back to the skeleton.
 */
export function getAsyncStatus({
  isLoading,
  error,
  isEmpty = false,
}: AsyncStatusInput): AsyncStatus {
  if (error) return 'error';
  if (isLoading) return 'loading';
  return isEmpty ? 'empty' : 'ready';
}

export interface AsyncBoundaryProps {
  /** Which branch to render; see `getAsyncStatus`. */
  state: AsyncStatus;
  /** Skeleton (`SkeletonCard`, `SkeletonText`, …) or a labelled `Spinner`. */
  loading: ReactNode;
  /** An `ErrorState` wired to the retry callback. */
  error: ReactNode;
  /** An `EmptyState`. Without it, the `ready` content is rendered for empty data too. */
  empty?: ReactNode;
  /** The content. A function is only called in the `ready` state (so it can read loaded data). */
  children: ReactNode | (() => ReactNode);
}

/**
 * Switches a card, table area or page between skeleton / empty / error / content, so screens do
 * not re-implement the branching. It adds no markup or live region: the state components announce
 * themselves. Not a React error boundary (render errors are caught by the shell's
 * `RouteErrorBoundary`).
 *
 * ```tsx
 * <AsyncBoundary
 *   state={getAsyncStatus({ isLoading, error, isEmpty: repos?.length === 0 })}
 *   loading={<SkeletonCard />}
 *   error={
 *     <ErrorState
 *       key={failureCount}
 *       message="Couldn't load repositories."
 *       onRetry={refetch}
 *       retrying={isLoading}
 *     />
 *   }
 *   empty={<EmptyState icon={FolderGit2} title="No repositories monitored yet" />}
 * >
 *   {() => <RepoList repos={repos!} />}
 * </AsyncBoundary>
 * ```
 */
export function AsyncBoundary({ state, loading, error, empty, children }: AsyncBoundaryProps) {
  if (state === 'loading') return <>{loading}</>;
  if (state === 'error') return <>{error}</>;
  if (state === 'empty' && empty !== undefined) return <>{empty}</>;
  return <>{typeof children === 'function' ? children() : children}</>;
}
