import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { elbowRoute } from './diagramLayout';
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

describe('Edge geometry edge cases and labels', () => {
  it('draws an elbowRoute with its bend and the arrow on the last segment', () => {
    const points = elbowRoute({ x: 166, y: 87 }, { x: 351, y: 186 }, 'horizontal');
    const { path, arrowhead } = edgeGeometry(points, true);
    expect(path).toBe('M166 87 L351 87 L351 180');
    expect(arrowhead).toBe('351,186 347,180 355,180');
  });

  it('skips the arrowhead (with a dev warning) on a zero-length last segment', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { path, arrowhead } = edgeGeometry(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 0 },
      ],
      true,
    );
    expect(arrowhead).toBeNull();
    expect(path).toBe('M0 0 L10 0 L10 0');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('zero length'));
    warn.mockRestore();
  });

  it('puts the default label right of the midpoint of a vertical first segment', () => {
    const { container } = render(
      <Edge
        points={[
          { x: 100, y: 20 },
          { x: 100, y: 60 },
        ]}
        label="AMQP"
      />,
    );
    const label = container.querySelector(`.${styles.label}`);
    expect(label).toHaveClass(styles.labelBeside!);
    expect(label).toHaveStyle({ left: '106px', top: '40px' });
  });

  it('uses labelPosition as the top-left, without the default offset', () => {
    const { container } = render(
      <Edge
        points={[
          { x: 0, y: 20 },
          { x: 50, y: 20 },
        ]}
        label="gRPC"
        labelPosition={{ x: 12, y: 3 }}
      />,
    );
    const label = container.querySelector(`.${styles.label}`);
    expect(label).toHaveStyle({ left: '12px', top: '3px' });
    expect(label).not.toHaveClass(styles.labelAbove!);
    expect(label).not.toHaveClass(styles.labelBeside!);
  });

  it('can be dashed', () => {
    const { container } = render(
      <Edge
        points={[
          { x: 0, y: 0 },
          { x: 0, y: 30 },
        ]}
        dashed
      />,
    );
    expect(container.firstElementChild).toHaveClass(styles.dashed!);
  });
});
