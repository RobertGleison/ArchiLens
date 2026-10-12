import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';
import type { Point } from './diagramLayout';
import styles from './Edge.module.css';

export type EdgeTone = 'neutral' | 'accent';

/** Arrowhead: 6 long and 8 wide (6×8 pointing sideways, 8×6 pointing up or down; Figma 3:13323). */
export const ARROW_LENGTH = 6;
export const ARROW_WIDTH = 8;
/** Protocol label: 4px along from the edge's start, its bottom 11px above the line (3:13350). */
const LABEL_OFFSET = { x: 4, y: 11 } as const;

export interface EdgeProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /**
   * Route in stage coordinates, at least two points; orthogonal routes come from `elbowRoute` /
   * `fanOutRoute` in `./diagramLayout`. The arrowhead's tip sits on the last point.
   */
  points: readonly Point[];
  /** `neutral` (grey, unchanged) or `accent` (teal, added or changed). Default `neutral`. */
  tone?: EdgeTone;
  /** Draw an arrowhead at the end. Default `true`; trunks and rails of a fan-out pass `false`. */
  arrow?: boolean;
  /** Optional protocol label, e.g. "HTTPS" (IBM Plex Mono 9px, muted). */
  label?: string;
  /** Top-left of the label; defaults to just above the start of the first segment. */
  labelPosition?: Point;
}

function unit(from: Point, to: Point): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const pt = (p: Point) => `${fmt(p.x)} ${fmt(p.y)}`;

/** Returns the line's path (stopping at the arrowhead's base) and the arrowhead polygon. */
export function edgeGeometry(
  points: readonly Point[],
  arrow: boolean,
): { path: string; arrowhead: string | null } {
  if (points.length < 2) return { path: '', arrowhead: null };
  const line = points.slice();
  let arrowhead: string | null = null;
  if (arrow) {
    const tip = points[points.length - 1]!;
    const dir = unit(points[points.length - 2]!, tip);
    const base = { x: tip.x - dir.x * ARROW_LENGTH, y: tip.y - dir.y * ARROW_LENGTH };
    const half = ARROW_WIDTH / 2;
    arrowhead = [
      tip,
      { x: base.x - dir.y * half, y: base.y + dir.x * half },
      { x: base.x + dir.y * half, y: base.y - dir.x * half },
    ]
      .map((p) => `${fmt(p.x)},${fmt(p.y)}`)
      .join(' ');
    line[line.length - 1] = base;
  }
  const path = `M${pt(line[0]!)}${line
    .slice(1)
    .map((p) => ` L${pt(p)}`)
    .join('')}`;
  return { path, arrowhead };
}

/**
 * A relationship line between entity nodes (Figma 3:13322–3:13333): a 1.5px orthogonal SVG line,
 * grey or teal, with a small arrowhead and an optional protocol label. Place edges inside a
 * `DiagramCanvas` stage, before the nodes so the nodes paint over line ends.
 *
 * Decorative (`aria-hidden`): describe relationships in text too, e.g. with the canvas's
 * `relationships` prop.
 */
export const Edge = forwardRef<HTMLSpanElement, EdgeProps>(function Edge(
  { points, tone = 'neutral', arrow = true, label, labelPosition, className, ...rest },
  ref,
) {
  const { path, arrowhead } = edgeGeometry(points, arrow);
  const start = points[0];
  const labelAt =
    labelPosition ?? (start ? { x: start.x + LABEL_OFFSET.x, y: start.y - LABEL_OFFSET.y } : null);
  return (
    <span
      ref={ref}
      {...rest}
      aria-hidden
      className={cx(styles.edge, styles[tone], className)}
      data-tone={tone}
    >
      <svg className={styles.svg} focusable="false">
        <path className={styles.line} d={path} />
        {arrowhead && <polygon className={styles.arrow} points={arrowhead} />}
      </svg>
      {label && labelAt && (
        <span
          className={cx(styles.label, !labelPosition && styles.labelAbove)}
          style={{ left: labelAt.x, top: labelAt.y }}
        >
          {label}
        </span>
      )}
    </span>
  );
});
