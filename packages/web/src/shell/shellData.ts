/**
 * Data shown by the app shell (sidebar connection card, pinned project, last sync time).
 *
 * The server has no endpoints for these yet, so `useShellData` returns placeholder values. It is
 * the single seam to swap for real API data later; components only receive these props.
 */

export interface GithubConnection {
  /** Number of GitHub organizations the read-only connection can see; null when not connected. */
  organizationsConnected: number | null;
}

export interface PinnedProject {
  id: string;
  name: string;
}

export interface ShellData {
  connection: GithubConnection;
  pinnedProject: PinnedProject | null;
  /** When the workspace last synced with GitHub; null if it never has. */
  lastSyncedAt: Date | null;
}

const PLACEHOLDER_SYNC_AGE_MS = 2 * 60_000;

// TODO: replace with real connection / pinned project / sync state once the API exposes it.
export function useShellData(): ShellData {
  return {
    connection: { organizationsConnected: 2 },
    pinnedProject: { id: 'commerce-platform', name: 'Commerce platform' },
    lastSyncedAt: new Date(Date.now() - PLACEHOLDER_SYNC_AGE_MS),
  };
}
