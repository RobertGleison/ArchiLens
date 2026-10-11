import { lazy, Suspense } from 'react';
import { HealthStatus } from './HealthStatus';

// TODO(LIN-82): move /__tokens into the router as a dev-only route.
// Dev-only token preview. `import.meta.env.DEV` is statically false in production builds, so the
// dynamic import (and the preview chunk) is dropped from the bundle.
const TokenPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/TokenPreview').then((m) => ({ default: m.TokenPreview })))
  : null;

export function App() {
  if (TokenPreview && window.location.pathname === '/__tokens') {
    return (
      <Suspense fallback={null}>
        <TokenPreview />
      </Suspense>
    );
  }

  return (
    <main>
      <h1>ArchiLens</h1>
      <HealthStatus />
    </main>
  );
}
