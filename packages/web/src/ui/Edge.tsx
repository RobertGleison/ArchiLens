import { forwardRef, type ComponentPropsWithoutRef, type DOMAttributes } from 'react';
import { cx } from './cx';
import { warnOnce } from './devWarning';
import type { Point } from './diagramLayout';
import styles from './Edge.module.css';

export type EdgeTone = 'neutral' | 'accent';

/** Arrowhead: 6 long and 8 wide (6×8 pointing sideways, 8×6 pointing up or down; Figma 3:13323). */
export const ARROW_LENGTH = 6;
export const ARROW_WIDTH = 8;
/**
 * Default protocol label placement. On a horizontal first segment (Figma 3:13350): 4px along
 * from the start, its bottom 11px above the line. On a vertical one: 6px right of the line,
 * vertically centred on the segment's midpoint.
 */
const LABEL_ABOVE = { x: 4, y: 11 } as const;
const LABEL_BESIDE_X = 6;

export interface EdgeProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  keyof DOMAttributes<HTMLSpanElement>
> {
  /**
   * Route in stage coordinates, at least two points; orthogonal routes come from `elbowRoute` /
   * `fanOutRoute` / `layoutDiagram` in `./diagramLayout`. The arrowhead's tip sits on the last
   * point.
   */
  points: readonly Point[];
  /** `neutral` (grey, unchanged) or `accent` (teal, added or changed). Default `neutral`. */
  tone?: EdgeTone;
  /** Dashed line, e.g. a removed relationship. Default `false`. */
  dashed?: boolean;
  /** Draw an arrowhead at the end. Default `true`; trunks and rails of a fan-out pass `false`. */
  arrow?: boolean;
  /** Optional protocol label, e.g. "HTTPS" (IBM Plex Mono 9px, muted). */
  label?: string;
  /**
   * Top-left of the label. Defaults to a spot beside the first segment: above its start when it
   * is horizontal, right of its midpoint when it is vertical.
   */
  labelPosition?: Point;
}

function unit(from: Point, to: Point): Point | null {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length === 0) return null;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const pt = (p: Point) => `${fmt(p.x)} ${fmt(p.y)}`;

/**
 * Returns the line's path (stopping at the arrowhead's base) and the arrowhead polygon. A
 * zero-length last segment has no direction, so it gets no arrowhead (and a dev warning).
 */
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
    if (!dir) {
      warnOnce('Edge: the last segment has zero length, so no arrowhead is drawn.');
    } else {
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
  }
  const path = `M${pt(line[0]!)}${line
    .slice(1)
    .map((p) => ` L${pt(p)}`)
    .join('')}`;
  return { path, arrowhead };
}

type LabelPlacement = { at: Point; anchor: 'above' | 'beside' };

/** Default label spot from the first segment's direction (see `LABEL_ABOVE` / `LABEL_BESIDE_X`). */
export function defaultLabelPlacement(points: readonly Point[]): LabelPlacement | null {
  const [start, next] = points;
  if (!start || !next) return null;
  const vertical = start.x === next.x && start.y !== next.y;
  return vertical
    ? { at: { x: start.x + LABEL_BESIDE_X, y: (start.y + next.y) / 2 }, anchor: 'beside' }
    : { at: { x: start.x + LABEL_ABOVE.x, y: start.y - LABEL_ABOVE.y }, anchor: 'above' };
}

/**
 * A relationship line between entity nodes (Figma 3:13322–3:13333): a 1.5px orthogonal SVG line,
 * grey or teal, with a small arrowhead and an optional protocol label. Place edges inside a
 * `DiagramCanvas` stage, before the nodes so the nodes paint over line ends.
 *
 * Decorative (`aria-hidden`, no event handlers): describe relationships in text too, e.g. with the
 * canvas's `relationships` prop.
 */
export const Edge = forwardRef<HTMLSpanElement, EdgeProps>(function Edge(
  {
    points,
    tone = 'neutral',
    dashed = false,
    arrow = true,
    label,
    labelPosition,
    className,
    ...rest
  },
  ref,
) {
  const { path, arrowhead } = edgeGeometry(points, arrow);
  const placement: LabelPlacement | null = labelPosition
    ? { at: labelPosition, anchor: 'above' }
    : defaultLabelPlacement(points);
  return (
    <span
      ref={ref}
      {...rest}
      aria-hidden
      className={cx(styles.edge, styles[tone], dashed && styles.dashed, className)}
      data-tone={tone}
    >
      <svg className={styles.svg} focusable="false">
        <path className={styles.line} d={path} />
        {arrowhead && <polygon className={styles.arrow} points={arrowhead} />}
      </svg>
      {label && placement && (
        <span
          className={cx(
            styles.label,
            !labelPosition &&
              (placement.anchor === 'above' ? styles.labelAbove : styles.labelBeside),
          )}
          style={{ left: placement.at.x, top: placement.at.y }}
        >
          {label}
        </span>
      )}
    </span>
  );
});
