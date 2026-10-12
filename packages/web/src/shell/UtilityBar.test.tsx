import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';
import { UtilityBar } from './UtilityBar';

function setPlatform(platform: string) {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
}

describe('UtilityBar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has a search trigger named by its visible text, sync status and labelled icon buttons', () => {
    const onOpenSearch = vi.fn();
    render(
      <UtilityBar lastSyncedAt={new Date(Date.now() - 2 * 60_000)} onOpenSearch={onOpenSearch} />,
    );

    const search = screen.getByRole('button', {
      name: /^Search repositories, projects, reports…/,
    });
    fireEvent.click(search);
    expect(onOpenSearch).toHaveBeenCalledTimes(1);

    expect(screen.getByText('2 min ago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('uses ⌘K on macOS', () => {
    setPlatform('MacIntel');
    const onOpenSearch = vi.fn();
    render(<UtilityBar lastSyncedAt={null} onOpenSearch={onOpenSearch} />);
    const search = screen.getByRole('button', { name: /search repositories/i });
    expect(search).toHaveTextContent('⌘ K');
    expect(search).toHaveAttribute('aria-keyshortcuts', 'Meta+K');

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(onOpenSearch).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
    expect(search).toHaveFocus();
  });

  it('uses Ctrl+K elsewhere', () => {
    setPlatform('Linux x86_64');
    const onOpenSearch = vi.fn();
    render(<UtilityBar lastSyncedAt={null} onOpenSearch={onOpenSearch} />);
    const search = screen.getByRole('button', { name: /search repositories/i });
    expect(search).toHaveTextContent('Ctrl K');
    expect(search).toHaveAttribute('aria-keyshortcuts', 'Control+K');

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(onOpenSearch).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
    expect(search).toHaveFocus();
  });

  it('ignores plain K, handled events and IME composition', () => {
    setPlatform('Win32');
    const onOpenSearch = vi.fn();
    render(<UtilityBar lastSyncedAt={null} onOpenSearch={onOpenSearch} />);

    fireEvent.keyDown(document, { key: 'k' });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, isComposing: true });
    const handled = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    handled.preventDefault();
    document.dispatchEvent(handled);

    expect(onOpenSearch).not.toHaveBeenCalled();
    expect(screen.queryByText(/last synced/i)).not.toBeInTheDocument();
  });

  it('leaves the shortcut to the browser without an onOpenSearch handler', () => {
    setPlatform('Win32');
    render(<UtilityBar lastSyncedAt={null} />);

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('removes the shortcut listener on unmount', () => {
    setPlatform('Win32');
    const onOpenSearch = vi.fn();
    const { unmount } = render(<UtilityBar lastSyncedAt={null} onOpenSearch={onOpenSearch} />);

    unmount();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(onOpenSearch).not.toHaveBeenCalled();
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
