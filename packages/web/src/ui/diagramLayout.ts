/**
 * Geometry helpers for architecture diagrams: a fixed row/column grid for entity nodes and
 * orthogonal edge routes between them. Coordinates are CSS pixels in the `DiagramCanvas` stage
 * (origin top-left). Screens own the data mapping and choose the grid; these helpers only do the
 * arithmetic so nodes and edges line up.
 */

export interface Point {
  x: number;
  y: number;
}

export type Side = 'top' | 'right' | 'bottom' | 'left' | 'center';

/**
 * Entity node box, matching `--size-entity-width` / `--size-entity-height` in tokens.css (a test
 * keeps the two in sync). The compact node is 90 wide and at least 48 tall.
 */
export const ENTITY_SIZE = { width: 166, height: 66 } as const;
export const ENTITY_COMPACT_SIZE = { width: 90, height: 48 } as const;

/**
 * Repository detail map (Figma 3:13320): columns 102px apart, rows 66px apart, and the first row
 * 54px below the top of the stage (the band holding the canvas's boundary label; the stage starts
 * at the canvas's 14px top inset, so the first row is 68px from the canvas top).
 */
export const DIAGRAM_GRID_DEFAULTS = {
  nodeWidth: ENTITY_SIZE.width,
  nodeHeight: ENTITY_SIZE.height,
  columnGap: 102,
  rowGap: 66,
  origin: { x: 0, y: 54 },
} as const;

export interface DiagramGridOptions {
  columns: number;
  rows: number;
  nodeWidth?: number;
  nodeHeight?: number;
  columnGap?: number;
  rowGap?: number;
  /** Top-left of the first cell. */
  origin?: Point;
}

export interface DiagramGrid {
  /** Stage size that fits every cell (origin included). */
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  /** Top-left corner of the node in `column`, `row` (0-based). */
  cell(column: number, row: number): Point;
  /** A point on the node's edge (or its centre), for edge endpoints. */
  anchor(column: number, row: number, side: Side): Point;
  /** Y halfway between the bottom of `row` and the top of `row + 1` (a fan-out junction). */
  gapBelow(row: number): number;
  /** X halfway between the right of `column` and the left of `column + 1`. */
  gapRightOf(column: number): number;
}

/** A fixed grid of equally sized nodes. */
export function diagramGrid(options: DiagramGridOptions): DiagramGrid {
  const {
    columns,
    rows,
    nodeWidth = DIAGRAM_GRID_DEFAULTS.nodeWidth,
    nodeHeight = DIAGRAM_GRID_DEFAULTS.nodeHeight,
    columnGap = DIAGRAM_GRID_DEFAULTS.columnGap,
    rowGap = DIAGRAM_GRID_DEFAULTS.rowGap,
    origin = DIAGRAM_GRID_DEFAULTS.origin,
  } = options;
  const cell = (column: number, row: number): Point => ({
    x: origin.x + column * (nodeWidth + columnGap),
    y: origin.y + row * (nodeHeight + rowGap),
  });
  return {
    width: origin.x + columns * nodeWidth + Math.max(0, columns - 1) * columnGap,
    height: origin.y + rows * nodeHeight + Math.max(0, rows - 1) * rowGap,
    nodeWidth,
    nodeHeight,
    cell,
    anchor(column, row, side) {
      const { x, y } = cell(column, row);
      const cx = x + nodeWidth / 2;
      const cy = y + nodeHeight / 2;
      switch (side) {
        case 'top':
          return { x: cx, y };
        case 'bottom':
          return { x: cx, y: y + nodeHeight };
        case 'left':
          return { x, y: cy };
        case 'right':
          return { x: x + nodeWidth, y: cy };
        case 'center':
          return { x: cx, y: cy };
      }
    },
    gapBelow: (row) => cell(0, row).y + nodeHeight + rowGap / 2,
    gapRightOf: (column) => cell(column, 0).x + nodeWidth + columnGap / 2,
  };
}

/**
 * Orthogonal route from `from` to `to` with one bend (an "L"), or a straight line when they share
 * an axis. `first` is the direction of the first segment.
 */
export function elbowRoute(
  from: Point,
  to: Point,
  first: 'horizontal' | 'vertical' = 'horizontal',
): Point[] {
  if (from.x === to.x || from.y === to.y) return [from, to];
  const bend = first === 'horizontal' ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  return [from, bend, to];
}

export interface FanOutRoute {
  /** Vertical segment from the source down (or up) to the junction line. No arrowhead. */
  trunk: Point[];
  /** Horizontal rail along the junction spanning every branch; null when nothing to span. */
  rail: Point[] | null;
  /** One route per target, from the rail to the target, in `targets` order. Draw with arrows. */
  branches: Point[][];
}

/**
 * Trunk + branch routing (Figma 3:13326–3:13333, the storage fan-out): a vertical trunk from
 * `source` to `junctionY`, a horizontal rail across all targets at `junctionY`, and a vertical
 * drop to each target. Each branch is separate so a screen can colour one relationship (e.g. an
 * added dependency) without recolouring the shared trunk and rail.
 */
export function fanOutRoute(source: Point, targets: Point[], junctionY: number): FanOutRoute {
  const xs = [source.x, ...targets.map((t) => t.x)];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return {
    trunk: [source, { x: source.x, y: junctionY }],
    rail:
      minX === maxX
        ? null
        : [
            { x: minX, y: junctionY },
            { x: maxX, y: junctionY },
          ],
    branches: targets.map((t) => [{ x: t.x, y: junctionY }, t]),
  };
}
