import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ICON_SIZE } from '../icon';
import { GithubIcon } from './GithubIcon';

describe('GithubIcon', () => {
  it('renders a decorative currentColor svg at the given size', () => {
    const { container } = render(<GithubIcon size={ICON_SIZE.button} className="x" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '15');
    expect(svg).toHaveAttribute('height', '15');
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('x');
  });

  it('defaults to 24px like lucide', () => {
    const { container } = render(<GithubIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('is exposed as an image when labelled', () => {
    render(<GithubIcon aria-label="GitHub" />);
    expect(screen.getByRole('img', { name: 'GitHub' })).not.toHaveAttribute('aria-hidden');
  });
});
