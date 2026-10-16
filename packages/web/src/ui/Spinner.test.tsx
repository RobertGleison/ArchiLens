import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveRegionContext } from './liveRegion';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is a decorative icon without a label', () => {
    const { container } = render(<Spinner size={12} />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('width', '12');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('is an 18px polite status with a visible label stand-alone', () => {
    render(<Spinner label="Loading repositories…" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading repositories…');
    expect(status.querySelector('svg')).toHaveAttribute('width', '18');
  });

  it('drops the role inside a live region', () => {
    render(
      <LiveRegionContext.Provider value>
        <Spinner label="Loading" hideLabel />
      </LiveRegionContext.Provider>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});
