import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('lets callers override the type', () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
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

  it('is inert but focusable while loading, with a spinner in place of the icon', () => {
    const onClick = vi.fn();
    render(
      <Button icon={Plus} loading onClick={onClick}>
        Run scan
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Run scan' });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelectorAll('svg')).toHaveLength(1);
    expect(button.querySelector('[data-spinner]')).not.toBeNull();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps focus when it starts loading and announces it politely', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button loading={false} onClick={onClick}>
        Run scan
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Run scan' });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    act(() => button.focus());
    rerender(
      <Button loading onClick={onClick}>
        Run scan
      </Button>,
    );
    expect(button).toHaveFocus();
    expect(status).toHaveTextContent('Loading');

    rerender(
      <Button loading={false} onClick={onClick}>
        Run scan
      </Button>,
    );
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(status).toHaveTextContent('');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not submit a form while loading', () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Save
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the label (for width and name) when loading without an icon', () => {
    render(<Button loading>Compare</Button>);
    const button = screen.getByRole('button', { name: 'Compare' });
    expect(button.querySelector('[data-spinner]')).not.toBeNull();
  });

  it('has no busy state when not loading but always renders an empty status region', () => {
    render(<Button>Compare</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).not.toHaveAttribute('aria-disabled');
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    expect(button.nextElementSibling).toBe(status);
  });

  it("keeps a caller's aria-disabled when not loading", () => {
    const { rerender } = render(<Button aria-disabled="true">Compare</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    rerender(
      <Button aria-disabled="true" loading>
        Compare
      </Button>,
    );
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a router link with `to`, never disabled or busy', () => {
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
    for (const attr of ['disabled', 'aria-disabled', 'aria-busy', 'type']) {
      expect(link).not.toHaveAttribute(attr);
    }
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an external anchor with `href external`, never disabled or busy', () => {
    render(
      <Button href="https://github.com/acme/checkout" external>
        Open in GitHub
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Open in GitHub (opens in new tab)' });
    expect(link).toHaveAttribute('href', 'https://github.com/acme/checkout');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    for (const attr of ['disabled', 'aria-disabled', 'aria-busy', 'type']) {
      expect(link).not.toHaveAttribute(attr);
    }
  });

  it('renders a same-tab anchor with `href` alone', () => {
    render(<Button href="/docs">Docs</Button>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).not.toHaveAttribute('target');
  });
});
