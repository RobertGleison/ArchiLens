import { fireEvent, render, screen } from '@testing-library/react';
import { Plus } from 'lucide-react';
import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { Button } from './Button';

describe('Button', () => {
  it('renders a type="button" secondary md button by default', () => {
    render(<Button>Create project</Button>);
    const button = screen.getByRole('button', { name: 'Create project' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it.each([
    ['primary', 'md'],
    ['primary', 'sm'],
    ['secondary', 'sm'],
  ] as const)('maps variant %s and size %s to attributes', (variant, size) => {
    render(
      <Button variant={variant} size={size} className="extra">
        Go
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveAttribute('data-variant', variant);
    expect(button).toHaveAttribute('data-size', size);
    expect(button).toHaveClass('extra');
  });

  it('renders a decorative 15px leading icon', () => {
    render(<Button icon={Plus}>Create project</Button>);
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toHaveAttribute('width', '15');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button')).toHaveAccessibleName('Create project');
  });

  it('calls onClick and forwards the ref', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <Button ref={ref} onClick={onClick}>
        Run scan
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Run scan
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('replaces the icon with a spinner, sets aria-busy and disables while loading', () => {
    const onClick = vi.fn();
    render(
      <Button icon={Plus} loading onClick={onClick}>
        Run scan
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Run scan' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(button.querySelectorAll('svg')).toHaveLength(1);
    expect(button.querySelector('[data-spinner]')).not.toBeNull();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps the label (for width and name) when loading without an icon', () => {
    render(<Button loading>Compare</Button>);
    const button = screen.getByRole('button', { name: 'Compare' });
    expect(button.querySelector('[data-spinner]')).not.toBeNull();
    expect(button).toHaveTextContent('Compare');
  });

  it('is not busy when not loading', () => {
    render(<Button>Compare</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('renders a router link with `to`', () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <Button to="/history" variant="primary" icon={Plus}>
          View running job
        </Button>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'View running job' });
    expect(link).toHaveAttribute('href', '/history');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a plain anchor with `href`', () => {
    render(
      <Button href="https://github.com/acme/checkout" target="_blank" rel="noreferrer">
        Open in GitHub
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Open in GitHub' });
    expect(link).toHaveAttribute('href', 'https://github.com/acme/checkout');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
