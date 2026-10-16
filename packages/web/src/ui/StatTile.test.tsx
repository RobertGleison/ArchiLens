import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatTile } from './StatTile';
import styles from './StatTile.module.css';

describe('StatTile', () => {
  it('is a description list: label term, value and helper details', () => {
    render(
      <StatTile
        label="Monitored repositories"
        value="8"
        helper="Across 2 GitHub organizations"
        className="x"
      />,
    );
    const term = screen.getByRole('term');
    expect(term).toHaveTextContent('Monitored repositories');
    const [value, helper] = screen.getAllByRole('definition');
    expect(value).toHaveTextContent('8');
    expect(helper).toHaveTextContent('Across 2 GitHub organizations');
    const tile = term.parentElement!;
    expect(tile.tagName).toBe('DL');
    expect(tile).toHaveClass(styles.outlined!);
    expect(value).toHaveClass(styles.value!);
    expect(value).not.toHaveClass(styles.accent!);
    expect(tile).toHaveClass('x');
    expect(tile).toHaveAttribute('data-variant', 'outlined');
    expect(tile).toHaveAttribute('data-tone', 'ink');
  });

  it('supports the filled variant with an accent value and no helper', () => {
    render(<StatTile variant="filled" tone="accent" label="Communication boundary" value="1" />);
    expect(screen.getAllByRole('definition')).toHaveLength(1);
    const tile = screen.getByRole('term').parentElement!;
    expect(tile).toHaveAttribute('data-variant', 'filled');
    expect(tile).toHaveAttribute('data-tone', 'accent');
    expect(tile).toHaveClass(styles.filled!);
    expect(tile).not.toHaveClass(styles.outlined!);
    expect(screen.getByRole('definition')).toHaveClass(styles.filledValue!, styles.accent!);
  });

  it('gives the filled variant an ink value by default', () => {
    render(<StatTile variant="filled" label="Removed components" value="0" />);
    expect(screen.getByRole('term').parentElement).toHaveAttribute('data-tone', 'ink');
  });

  it('renders a 0 value', () => {
    render(<StatTile label="Removed" value={0} />);
    expect(screen.getByRole('definition')).toHaveTextContent('0');
  });
});
