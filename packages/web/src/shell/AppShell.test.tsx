import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { AppShell } from './AppShell';

function Boom(): never {
  throw new Error('kaboom');
}

let flakyFails = false;

function Flaky() {
  if (flakyFails) throw new Error('not yet');
  return <h1>Reports page</h1>;
}

function renderShellAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="reports" element={<Boom />} />
          <Route path="history" element={<h1>History page</h1>} />
          <Route path="flaky" element={<Flaky />} />
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

  it('uses the page-level ErrorState; a failed Retry remounts it and focuses its heading', () => {
    renderShellAt('/reports');

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute('href', '/');
    const first = screen.getByRole('heading', { level: 1, name: 'Something went wrong' });
    expect(first).not.toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // Boom throws again: a new error state (remounted, so it is announced again) with focus.
    const second = screen.getByRole('heading', { level: 1, name: 'Something went wrong' });
    expect(second).not.toBe(first);
    expect(second).toHaveFocus();
  });

  it('renders the page when a Retry succeeds', () => {
    flakyFails = true;
    renderShellAt('/flaky');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();

    flakyFails = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Reports page' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hides Back to Overview on Overview itself', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={ROUTER_FUTURE}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Boom />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to Overview' })).toBeNull();
  });
});
