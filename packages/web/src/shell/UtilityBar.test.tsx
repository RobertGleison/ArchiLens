import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';
import { UtilityBar } from './UtilityBar';

describe('UtilityBar', () => {
  it('has a search trigger, sync status and labelled icon buttons', () => {
    const onOpenSearch = vi.fn();
    render(
      <UtilityBar lastSyncedAt={new Date(Date.now() - 2 * 60_000)} onOpenSearch={onOpenSearch} />,
    );

    const search = screen.getByRole('button', { name: /search repositories/i });
    expect(search).toHaveTextContent('Search repositories, projects, reports…');
    fireEvent.click(search);
    expect(onOpenSearch).toHaveBeenCalledTimes(1);

    expect(screen.getByText('2 min ago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it.each([{ metaKey: true }, { ctrlKey: true }])(
    'opens and focuses search on %o + K',
    (modifier) => {
      const onOpenSearch = vi.fn();
      render(<UtilityBar lastSyncedAt={null} onOpenSearch={onOpenSearch} />);

      fireEvent.keyDown(document, { key: 'k', ...modifier });

      expect(onOpenSearch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /search repositories/i })).toHaveFocus();
    },
  );

  it('ignores K without a modifier and hides sync status when never synced', () => {
    const onOpenSearch = vi.fn();
    render(<UtilityBar lastSyncedAt={null} onOpenSearch={onOpenSearch} />);

    fireEvent.keyDown(document, { key: 'k' });

    expect(onOpenSearch).not.toHaveBeenCalled();
    expect(screen.queryByText(/last synced/i)).not.toBeInTheDocument();
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-12T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it.each([
    [10_000, 'just now'],
    [2 * 60_000, '2 min ago'],
    [3 * 3_600_000, '3 h ago'],
    [86_400_000, '1 day ago'],
    [3 * 86_400_000, '3 days ago'],
    [-60_000, 'just now'],
  ])('%i ms ago → %s', (ms, expected) => {
    expect(formatRelativeTime(ago(ms), now)).toBe(expected);
  });
});
