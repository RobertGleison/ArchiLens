import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverviewPage } from './pages/OverviewPage';
import {
  ConfigurationPage,
  HistoryPage,
  ProjectsPage,
  ReportsPage,
  RepositoriesPage,
} from './pages/PlaceholderPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AppShell } from './shell/AppShell';

// Dev-only token preview, outside the shell. `import.meta.env.DEV` is statically false in
// production builds, so the route and the dynamic import (and its chunk) are dropped.
const TokenPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/TokenPreview').then((m) => ({ default: m.TokenPreview })))
  : null;

export function AppRoutes() {
  return (
    <Routes>
      {TokenPreview && (
        <Route
          path="/__tokens"
          element={
            <Suspense fallback={null}>
              <TokenPreview />
            </Suspense>
          }
        />
      )}
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="repositories" element={<RepositoriesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="configuration" element={<ConfigurationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
