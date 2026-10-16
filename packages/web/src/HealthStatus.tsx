import type { HealthResponse } from '@archilens/shared';
import { useEffect, useState } from 'react';
import { fetchHealth } from './api/health';

type State =
  { kind: 'loading' } | { kind: 'ok'; health: HealthResponse } | { kind: 'error'; message: string };

export function HealthStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal).then(
      (health) => setState({ kind: 'ok', health }),
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      },
    );
    return () => controller.abort();
  }, []);

  switch (state.kind) {
    case 'loading':
      return <p>Checking server…</p>;
    case 'error':
      return <p role="alert">Server unreachable: {state.message}</p>;
    case 'ok':
      return (
        <dl>
          <dt>Server: {state.health.status}</dt>
          <dd>Version {state.health.version}</dd>
          <dd>Data dir {state.health.dataDir}</dd>
        </dl>
      );
  }
}
