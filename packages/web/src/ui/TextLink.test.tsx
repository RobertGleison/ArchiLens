import { fireEvent, render, screen } from '@testing-library/react';
import { FileCode } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { TextLink } from './TextLink';

function inRouter(node: React.ReactNode) {
  return render(<MemoryRouter future={ROUTER_FUTURE}>{node}</MemoryRouter>);
}

describe('TextLink', () => {
  it('renders a router link with the action variant by default', () => {
    inRouter(<TextLink to="/projects">View all projects</TextLink>);
    const link = screen.getByRole('link', { name: 'View all projects' });
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).toHaveAttribute('data-variant', 'action');
  });

  it('keeps the trailing arrow out of the accessible name', () => {
    inRouter(
      <TextLink variant="inline" to="/history" trailing="arrow">
        View job
      </TextLink>,
    );
    const link = screen.getByRole('link', { name: 'View job' });
    expect(link).toHaveTextContent('View job →');
    expect(link).toHaveAttribute('data-variant', 'inline');
  });

  it('renders an external mono link with a leading icon and ↗', () => {
    render(
      <TextLink variant="mono" icon={FileCode} href="https://github.com/x" trailing="external">
        checkout.module.ts:12–34
      </TextLink>,
    );
    const link = screen.getByRole('link', { name: 'checkout.module.ts:12–34' });
    expect(link).toHaveAttribute('href', 'https://github.com/x');
    expect(link).toHaveTextContent('↗');
    expect(link.querySelector('svg')).toHaveAttribute('width', '12');
  });

  it('renders a button for actions without a destination', () => {
    const onClick = vi.fn();
    render(<TextLink onClick={onClick}>Refresh</TextLink>);
    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
