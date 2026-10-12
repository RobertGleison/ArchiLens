import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('is a progressbar named by its visible label', () => {
    render(<ProgressBar label="Building architecture model · 68%" value={68} className="x" />);
    const bar = screen.getByRole('progressbar', { name: 'Building architecture model · 68%' });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '68%');
    expect(bar).toHaveAttribute('data-size', 'sm');
    expect(bar.parentElement).toHaveClass('x');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('68%');
  });

  it('supports aria-label, a custom range, value text and the md size', () => {
    render(
      <ProgressBar
        size="md"
        aria-label="Monthly budget"
        value={42.8}
        max={120}
        valueText="$42.80 of $120"
        className="x"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Monthly budget' });
    expect(bar).toHaveClass('x');
    expect(bar).toHaveAttribute('aria-valuemax', '120');
    expect(bar).toHaveAttribute('aria-valuetext', '$42.80 of $120');
    expect(bar).toHaveAttribute('data-size', 'md');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe(`${(42.8 / 120) * 100}%`);
  });

  it('clamps out-of-range values', () => {
    render(<ProgressBar aria-label="p" value={150} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%');
  });
});
