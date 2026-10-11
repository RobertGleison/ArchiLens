import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders the token preview at /__tokens in dev', async () => {
    window.history.replaceState(null, '', '/__tokens');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Design tokens' })).toBeInTheDocument();
  });
});
