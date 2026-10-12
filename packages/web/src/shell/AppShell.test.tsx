import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { AppShell } from './AppShell';

function Boom(): never {
  throw new Error('kaboom');
}

function renderShellAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="reports" element={<Boom />} />
          <Route path="history" element={<h1>History page</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell error boundary', () => {
  beforeEach(() => {
    // React and the boundary both log the caught error; keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an in-shell error for a failing route and recovers on navigation', () => {
    renderShellAt('/reports');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    // The shell stays usable.
    expect(screen.getByRole('navigation', { name: 'Workspace navigation' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'History' }));

    expect(screen.getByRole('heading', { level: 1, name: 'History page' })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('uses the page-level ErrorState: Retry re-renders the page, Back to Overview links home', () => {
    renderShellAt('/reports');

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute('href', '/');

    const errors = vi.mocked(console.error).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    // The page threw again (Boom always does), so the boundary caught a second render error.
    expect(vi.mocked(console.error).mock.calls.length).toBeGreaterThan(errors);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
  });
});
