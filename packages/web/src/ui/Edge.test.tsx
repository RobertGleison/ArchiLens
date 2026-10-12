import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Edge, edgeGeometry } from './Edge';
import styles from './Edge.module.css';

describe('edgeGeometry', () => {
  it('stops the line at the arrowhead base, 6 long and 8 wide pointing right', () => {
    const { path, arrowhead } = edgeGeometry(
      [
        { x: 166, y: 74 },
        { x: 268, y: 74 },
      ],
      true,
    );
    expect(path).toBe('M166 74 L262 74');
    expect(arrowhead).toBe('268,74 262,78 262,70');
  });

  it('points the arrowhead down on a vertical last segment (8×6)', () => {
    const { path, arrowhead } = edgeGeometry(
      [
        { x: 83, y: 140 },
        { x: 83, y: 173 },
      ],
      true,
    );
    expect(path).toBe('M83 140 L83 167');
    expect(arrowhead).toBe('83,173 79,167 87,167');
  });

  it('draws every bend and no arrowhead when arrow is off', () => {
    const { path, arrowhead } = edgeGeometry(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 20 },
      ],
      false,
    );
    expect(path).toBe('M0 0 L10 0 L10 20');
    expect(arrowhead).toBeNull();
  });
});

describe('Edge', () => {
  it('is decorative and draws with the tone colour', () => {
    const { container } = render(
      <Edge
        points={[
          { x: 0, y: 11 },
          { x: 50, y: 11 },
        ]}
        tone="accent"
        label="HTTPS"
        className="x"
      />,
    );
    const edge = container.firstElementChild!;
    expect(edge).toHaveAttribute('aria-hidden', 'true');
    expect(edge).toHaveClass(styles.edge!, styles.accent!, 'x');
    expect(edge).toHaveAttribute('data-tone', 'accent');
    expect(edge.querySelector('path')).toHaveClass(styles.line!);
    expect(edge.querySelector('polygon')).toHaveClass(styles.arrow!);
    const label = edge.querySelector(`.${styles.label}`);
    expect(label).toHaveTextContent('HTTPS');
    expect(label).toHaveStyle({ left: '4px', top: '0px' });
  });

  it('defaults to grey with an arrowhead and no label', () => {
    const { container } = render(
      <Edge
        points={[
          { x: 0, y: 0 },
          { x: 0, y: 30 },
        ]}
      />,
    );
    const edge = container.firstElementChild!;
    expect(edge).toHaveClass(styles.neutral!);
    expect(edge.querySelector('polygon')).not.toBeNull();
    expect(edge.querySelector(`.${styles.label}`)).toBeNull();
  });
});
