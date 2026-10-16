import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AsyncBoundary, getAsyncStatus, type AsyncStatus } from './AsyncBoundary';

describe('getAsyncStatus', () => {
  it.each([
    [{ isLoading: true }, 'loading'],
    [{ isLoading: true, error: new Error('x') }, 'error'],
    [{ isLoading: false, error: 'x' }, 'error'],
    [{ isLoading: false, isEmpty: true }, 'empty'],
    [{ isLoading: false }, 'ready'],
  ] as const)('%o is %s', (input, status) => {
    expect(getAsyncStatus(input)).toBe(status);
  });
});

describe('AsyncBoundary', () => {
  const renderAt = (state: AsyncStatus, withEmpty = true) => {
    const content = vi.fn(() => 'content');
    render(
      <AsyncBoundary
        state={state}
        loading="loading"
        error="error"
        empty={withEmpty ? 'empty' : undefined}
      >
        {content}
      </AsyncBoundary>,
    );
    return content;
  };

  it.each(['loading', 'error', 'empty'] as const)('renders only the %s branch', (state) => {
    const content = renderAt(state);
    expect(screen.getByText(state)).toBeInTheDocument();
    expect(content).not.toHaveBeenCalled();
  });

  it('calls the content function when ready', () => {
    renderAt('ready');
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('falls back to the content for empty data without an empty branch', () => {
    renderAt('empty', false);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
