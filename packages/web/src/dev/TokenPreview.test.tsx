import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseTokens } from '../styles/parseTokens';
import tokensCss from '../styles/tokens.css?raw';
import { TOKEN_PREVIEW_ICON_COUNT, TYPE_META, TokenPreview } from './TokenPreview';

const tokens = parseTokens(tokensCss);
const namesWith = (prefix: string) =>
  tokens.filter((t) => t.name.startsWith(prefix)).map((t) => t.name.slice(prefix.length));

describe('TokenPreview', () => {
  it('shows every color token with its value and a swatch', () => {
    render(<TokenPreview />);

    expect(screen.getByText('--color-accent')).toBeInTheDocument();
    expect(screen.getByText('#3c6e71')).toBeInTheDocument();
    expect(screen.getByTestId('swatch--color-accent')).toHaveStyle({
      background: 'var(--color-accent)',
    });
    expect(screen.getAllByTestId(/^swatch--color-/)).toHaveLength(namesWith('--color-').length);
  });

  it('shows the type scale, spacing, radius, sizes and icons', () => {
    const { container } = render(<TokenPreview />);

    expect(screen.getByRole('heading', { name: 'Type scale' })).toBeInTheDocument();
    expect(screen.getByText('display / semibold')).toBeInTheDocument();
    expect(screen.getByText('overline / semibold')).toBeInTheDocument();
    expect(screen.getByText('--space-34')).toBeInTheDocument();
    expect(screen.getByText('--radius-switch')).toBeInTheDocument();
    expect(screen.getByText('--size-sidebar')).toBeInTheDocument();
    expect(screen.getByText('ICON_SIZE.button = 15')).toBeInTheDocument();
    expect(container.querySelectorAll('svg[width="15"]')).toHaveLength(TOKEN_PREVIEW_ICON_COUNT);
  });

  it('has weights and an example for exactly the --font-size-* tokens', () => {
    expect(Object.keys(TYPE_META).sort()).toEqual(namesWith('--font-size-').sort());
  });
});
