import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from './routerFuture';
import { AppRoutes } from './routes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

const NAV_LABELS = ['Overview', 'Repositories', 'Projects', 'Reports', 'History', 'Configuration'];

describe('app shell routes', () => {
  beforeEach(() => {
    // The Overview placeholder shows server health; keep it pending.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the landmarks: workspace sidebar and nav, banner and main', () => {
    renderAt('/');

    const sidebar = screen.getByRole('complementary', { name: 'Workspace' });
    expect(
      within(sidebar).getByRole('navigation', { name: 'Workspace navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the nav items in order with accessible names', () => {
    renderAt('/');

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(NAV_LABELS);
    expect(within(nav).getByRole('link', { name: 'Repositories' })).toHaveAttribute(
      'href',
      '/repositories',
    );
  });

  it.each([
    ['/', 'Overview', 'Architecture, in view.'],
    ['/repositories', 'Repositories', 'Repositories'],
    ['/projects', 'Projects', 'Projects'],
    ['/reports', 'Reports', 'Reports'],
    ['/history', 'History', 'History'],
    ['/configuration', 'Configuration', 'Configuration'],
  ])('marks %s as the current nav item and renders its page', (path, label, title) => {
    renderAt(path);

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' });
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual([label]);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('keeps Projects active on a project detail route', () => {
    renderAt('/projects/commerce-platform');

    const nav = screen.getByRole('navigation', { name: 'Workspace navigation' });
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('shows the pinned project and the GitHub connection card', () => {
    renderAt('/');

    const pinned = screen.getByRole('navigation', { name: 'Pinned project' });
    expect(within(pinned).getByRole('link', { name: 'Commerce platform' })).toHaveAttribute(
      'href',
      '/projects/commerce-platform',
    );
    expect(screen.getByText('GitHub · read-only')).toBeInTheDocument();
    expect(screen.getByText('2 organizations connected')).toBeInTheDocument();
  });

  it('leaves out the workspace selector and the account block', () => {
    renderAt('/');

    // Only the six nav links and the pinned project: no workspace switcher, no account controls.
    const sidebar = screen.getByRole('complementary', { name: 'Workspace' });
    expect(within(sidebar).queryAllByRole('button')).toEqual([]);
    expect(within(sidebar).queryAllByRole('img')).toEqual([]);
    expect(within(sidebar).getAllByRole('link')).toHaveLength(NAV_LABELS.length + 1);
  });

  it('has a skip link to the main content', () => {
    renderAt('/');

    const skip = screen.getByRole('link', { name: 'Skip to content' });
    const main = screen.getByRole('main');
    expect(skip).toHaveAttribute('href', `#${main.id}`);
    expect(main.id).not.toBe('');
  });

  it('renders a not-found page inside the shell for unknown routes', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Workspace navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute('href', '/');
  });

  it('serves the token preview outside the shell in dev', async () => {
    renderAt('/__tokens');

    expect(await screen.findByRole('heading', { name: 'Design tokens' })).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Workspace navigation' }),
    ).not.toBeInTheDocument();
  });

  it('serves the component preview outside the shell in dev', async () => {
    renderAt('/__components');

    expect(
      // The lazy chunk imports every ui/ component; under a loaded parallel run that can take
      // longer than findBy's 1s default. Stays below the test's 5s timeout.
      await screen.findByRole('heading', { level: 1, name: 'Components' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Workspace navigation' }),
    ).not.toBeInTheDocument();
  });
});
