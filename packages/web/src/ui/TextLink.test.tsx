import { fireEvent, render, screen } from '@testing-library/react';
import { FileCode } from 'lucide-react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { TextLink } from './TextLink';

function inRouter(node: ReactNode) {
  return render(<MemoryRouter future={ROUTER_FUTURE}>{node}</MemoryRouter>);
}

describe('TextLink', () => {
  it('renders a router link with the action variant by default', () => {
    inRouter(<TextLink to="/projects">View all projects</TextLink>);
    const link = screen.getByRole('link', { name: 'View all projects' });
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).toHaveAttribute('data-variant', 'action');
    expect(link).not.toHaveAttribute('target');
  });

  it('keeps the trailing arrow out of the accessible name', () => {
    inRouter(
      <TextLink variant="inline" size="sm" to="/history" arrow>
        View job
      </TextLink>,
    );
    const link = screen.getByRole('link', { name: 'View job' });
    expect(link).toHaveTextContent('View job →');
    expect(link).toHaveAttribute('data-variant', 'inline');
  });

  it('opens external links in a new tab and says so', () => {
    render(
      <TextLink variant="mono" icon={FileCode} href="https://github.com/x" external>
        checkout.module.ts:12–34
      </TextLink>,
    );
    const link = screen.getByRole('link', {
      name: 'checkout.module.ts:12–34 (opens in new tab)',
    });
    expect(link).toHaveAttribute('href', 'https://github.com/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('↗');
    expect(link.querySelector('svg')).toHaveAttribute('width', '12');
  });

  it('renders a plain anchor without new-tab behaviour unless external', () => {
    render(<TextLink href="/docs">Docs</TextLink>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders a button for actions without a destination', () => {
    const onClick = vi.fn();
    render(<TextLink onClick={onClick}>Refresh</TextLink>);
    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can disable button-mode actions', () => {
    const onClick = vi.fn();
    render(
      <TextLink onClick={onClick} disabled>
        Clear
      </TextLink>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('only accepts a size with the inline variant', () => {
    // @ts-expect-error `size` is only valid with variant="inline".
    const invalid = <TextLink size="sm">Refresh</TextLink>;
    expect(invalid).toBeTruthy();
  });
});
