import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

const fillWidth = (bar: HTMLElement) => (bar.firstElementChild as HTMLElement).style.width;

describe('ProgressBar', () => {
  it('is a progressbar named by its visible label', () => {
    render(<ProgressBar label="Building architecture model · 68%" value={68} />);
    const bar = screen.getByRole('progressbar', { name: 'Building architecture model · 68%' });
    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '68%');
    expect(bar).toHaveAttribute('data-size', 'sm');
    expect(fillWidth(bar)).toBe('68%');
  });

  it('puts the ref, className and other props on the progressbar in labelled mode', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressBar
        ref={ref}
        label="Scan"
        value={10}
        id="scan-progress"
        data-testid="bar"
        aria-describedby="hint"
        className="track"
        wrapperClassName="wrapper"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Scan' });
    expect(ref.current).toBe(bar);
    expect(bar).toHaveAttribute('id', 'scan-progress');
    expect(bar).toHaveAttribute('data-testid', 'bar');
    expect(bar).toHaveAttribute('aria-describedby', 'hint');
    expect(bar).toHaveClass('track');
    expect(bar.parentElement).toHaveClass('wrapper');
    expect(bar.parentElement).not.toHaveAttribute('id');
  });

  it('supports aria-label, a custom range, value text and the md size', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressBar
        ref={ref}
        size="md"
        aria-label="Monthly budget"
        value={42.8}
        max={120}
        valueText="$42.80 of $120"
        className="x"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Monthly budget' });
    expect(ref.current).toBe(bar);
    expect(bar).toHaveClass('x');
    expect(bar).toHaveAttribute('aria-valuemax', '120');
    expect(bar).toHaveAttribute('aria-valuetext', '$42.80 of $120');
    expect(bar).toHaveAttribute('data-size', 'md');
    expect(fillWidth(bar)).toBe(`${(42.8 / 120) * 100}%`);
  });

  it('clamps out-of-range values', () => {
    render(<ProgressBar aria-label="p" value={150} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(fillWidth(bar)).toBe('100%');
  });

  it.each([NaN, Infinity, -Infinity])('treats a non-finite value (%s) as the minimum', (value) => {
    render(<ProgressBar aria-label="p" value={value} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuetext', '0%');
    expect(fillWidth(bar)).toBe('0%');
  });

  it('handles a non-finite or empty range', () => {
    render(<ProgressBar aria-label="p" value={5} max={NaN} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '0');
    expect(fillWidth(bar)).toBe('0%');
  });
});
