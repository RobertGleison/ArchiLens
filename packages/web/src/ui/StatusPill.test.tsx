import { render, screen } from '@testing-library/react';
import { Lock } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { KeyHint } from './KeyHint';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('defaults to the neutral tone without an icon', () => {
    render(<StatusPill>Baseline</StatusPill>);
    const pill = screen.getByText('Baseline');
    expect(pill).toHaveAttribute('data-tone', 'neutral');
    expect(pill.querySelector('svg')).toBeNull();
  });

  it('renders the accent tone with a decorative 12px icon', () => {
    render(
      <StatusPill tone="accent" icon={Lock} className="x">
        Private
      </StatusPill>,
    );
    const pill = screen.getByText('Private');
    expect(pill).toHaveAttribute('data-tone', 'accent');
    expect(pill).toHaveClass('x');
    const icon = pill.querySelector('svg');
    expect(icon).toHaveAttribute('width', '12');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('KeyHint', () => {
  it('renders a <kbd>', () => {
    render(<KeyHint className="x">⌘ K</KeyHint>);
    const hint = screen.getByText('⌘ K');
    expect(hint.tagName).toBe('KBD');
    expect(hint).toHaveClass('x');
  });
});
