import { render, screen } from '@testing-library/react';
import { Check, CircleAlert, Clock, Lock } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { SCAN_STATUSES, scanStatusToPill } from './scanStatus';
import { Spinner } from './Spinner';
import { KeyHint, StatusPill } from './StatusPill';

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

  it('renders a key hint as a <kbd>', () => {
    render(<KeyHint>⌘ K</KeyHint>);
    expect(screen.getByText('⌘ K').tagName).toBe('KBD');
  });
});

describe('scanStatusToPill', () => {
  it.each([
    ['up_to_date', 'accent', Check, 'Up to date'],
    ['running', 'accent', Spinner, 'Running'],
    ['queued', 'neutral', Clock, 'Queued'],
    ['failed', 'neutral', CircleAlert, 'Failed'],
    ['needs_attention', 'neutral', CircleAlert, 'Needs attention'],
  ] as const)('maps %s to a %s pill', (status, tone, icon, label) => {
    expect(scanStatusToPill(status)).toEqual({ tone, icon, label });
  });

  it('covers every scan status', () => {
    expect(SCAN_STATUSES).toHaveLength(5);
  });

  it('renders the running state with a spinning loader', () => {
    const { label, ...pill } = scanStatusToPill('running');
    render(<StatusPill {...pill}>{label}</StatusPill>);
    expect(screen.getByText('Running').querySelector('[data-spinner]')).not.toBeNull();
  });
});
