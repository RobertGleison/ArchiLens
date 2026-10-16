import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('routes the browser location into the app shell', () => {
    window.history.replaceState(null, '', '/reports');

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');
  });
});
