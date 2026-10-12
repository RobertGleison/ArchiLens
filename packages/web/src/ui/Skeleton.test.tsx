import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveRegionContext } from './liveRegion';
import { SkeletonCard, SkeletonStatTile, SkeletonTableRows, SkeletonText } from './Skeleton';

describe('skeletons', () => {
  it('are a polite status named by a hidden label, with text-free blocks', () => {
    const { container } = render(<SkeletonText lines={3} label="Loading repositories" />);
    expect(screen.getByRole('status')).toHaveTextContent(/^Loading repositories$/);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });

  it('default the label to "Loading"', () => {
    render(<SkeletonStatTile />);
    expect(screen.getByRole('status')).toHaveTextContent(/^Loading$/);
  });

  it('nest without a second role or label', () => {
    render(
      <SkeletonCard label="Loading report">
        <SkeletonText lines={2} />
      </SkeletonCard>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(/^Loading report$/);
  });

  it('drop the role but keep the label inside a live region', () => {
    render(
      <div role="status" data-testid="region">
        <LiveRegionContext.Provider value>
          <SkeletonTableRows rows={2} />
        </LiveRegionContext.Provider>
      </div>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByTestId('region')).toHaveTextContent('Loading');
  });

  it('line table rows up with the column widths (last fixed column flexes)', () => {
    const { container } = render(<SkeletonTableRows rows={2} columns={[200, undefined, 100]} />);
    expect(screen.getByRole('status')).toHaveStyle({
      '--skeleton-columns': '200px minmax(0, 1fr) 100px',
    });
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(6);

    const { getAllByRole } = render(<SkeletonTableRows columns={[200, 100]} />);
    expect(getAllByRole('status')[1]).toHaveStyle({
      '--skeleton-columns': '200px minmax(0, 1fr)',
    });
  });
});
