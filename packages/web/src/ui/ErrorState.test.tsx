import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { ErrorState } from './ErrorState';
import { LiveRegionContext } from './liveRegion';

describe('ErrorState', () => {
  it('card: an alert with an 18px icon, the message and a small Retry wired to onRetry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState className="x" message="Couldn't load repositories." onRetry={onRetry} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('x');
    expect(alert).toHaveTextContent("Couldn't load repositories.");
    expect(alert.querySelector('svg')).toHaveAttribute('width', '18');
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toHaveAttribute('data-size', 'sm');
    expect(retry).toHaveAttribute('data-variant', 'secondary');
    // No loading live region unless the caller tracks `retrying`.
    expect(screen.queryByRole('status')).toBeNull();
    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the Retry loading state while retrying and swallows clicks', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed." onRetry={onRetry} retrying />);
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toHaveAttribute('aria-busy', 'true');
    // One live region: the "Loading" text joins the alert instead of a nested status.
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Loading');
    await userEvent.click(retry);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('has no alert role inside a live region', () => {
    render(
      <LiveRegionContext.Provider value>
        <ErrorState message="Failed." onRetry={() => {}} />
      </LiveRegionContext.Provider>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Failed.')).toBeInTheDocument();
  });

  it('page: an h1 title, detail, Retry and Back to Overview', async () => {
    const onRetry = vi.fn();
    render(
      <MemoryRouter initialEntries={['/reports']} future={ROUTER_FUTURE}>
        <ErrorState
          variant="page"
          title="Something went wrong"
          description="This page failed to load."
          detail="kaboom"
          onRetry={onRetry}
        />
      </MemoryRouter>,
    );
    // Only the title + description are the alert; the actions are outside it.
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/^Something went wrongThis page failed to load\.$/);
    expect(alert).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    );
    expect(alert.parentElement?.querySelector('svg')).toHaveAttribute('width', '28');
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute('href', '/');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('page: hides Back to Overview on that page and can focus its title on mount', () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <ErrorState variant="page" title="Something went wrong" onRetry={() => {}} focusOnMount />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Back to Overview' })).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });
});
