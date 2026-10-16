/**
 * Geometry helpers for architecture diagrams: a fixed row/column grid for entity nodes,
 * orthogonal edge routes between them, and `layoutDiagram`, which turns nodes + relationships
 * into props for `EntityNode`, `Edge` and `DiagramCanvas`. Coordinates are CSS pixels in the
 * `DiagramCanvas` stage (origin top-left). Screens own the data mapping and choose the grid.
 */
import type { ReactNode } from 'react';
import type { DiagramRelationship } from './Diagram';
import { warnOnce } from './devWarning';
import type { EdgeProps } from './Edge';
import type { EntityKind, EntityNodeVariant, RegularEntityNodeProps } from './EntityNode';

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

/** A fixed grid of equally sized nodes. Out-of-range cells log a dev warning. */
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
  const cell = (column: number, row: number): Point => {
    if (column < 0 || column >= columns || row < 0 || row >= rows) {
      warnOnce(
        `diagramGrid: cell (${column}, ${row}) is outside the ${columns}×${rows} grid; the stage ` +
          'size will not fit it.',
      );
    }
    return {
      x: origin.x + column * (nodeWidth + columnGap),
      y: origin.y + row * (nodeHeight + rowGap),
    };
  };
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

export type RelationshipChange = 'added' | 'removed' | 'unchanged';

export interface DiagramNodeSpec {
  /** Unique within the diagram; edges refer to it. */
  id: string;
  name: string;
  kind: EntityKind;
  column: number;
  row: number;
  variant?: EntityNodeVariant;
  subtitle?: ReactNode;
}

export interface DiagramEdgeSpec {
  /** Defaults to `${from}->${to}`. */
  id?: string;
  /** Node ids. */
  from: string;
  to: string;
  /** Protocol label on the edge and in the text list, e.g. "HTTPS". */
  protocol?: string;
  /** `added`: teal. `removed`: grey dashed. `unchanged` (default): grey. */
  change?: RelationshipChange;
  /**
   * `auto` (default): straight within a row or column; otherwise down (or up) through the gap
   * next to the source row, sharing one trunk and rail with every other `auto` edge from the same
   * source in that direction (fan-out). `straight`: always a straight line between facing sides.
   * `elbow`: from the side facing the target, horizontal first, into its top or bottom.
   */
  route?: 'auto' | 'straight' | 'elbow';
}

export interface LayoutDiagramOptions
  extends
    Omit<DiagramGridOptions, 'columns' | 'rows'>,
    Partial<Pick<DiagramGridOptions, 'columns' | 'rows'>> {
  nodes: readonly DiagramNodeSpec[];
  edges: readonly DiagramEdgeSpec[];
}

export interface DiagramLayout {
  /** Stage size for `DiagramCanvas`. */
  width: number;
  height: number;
  grid: DiagramGrid;
  /** In `nodes` order (keep it the reading order): spread `props` into `EntityNode`. */
  nodes: { id: string; props: RegularEntityNodeProps }[];
  /** Spread `props` into `Edge`; render before the nodes. */
  edges: { id: string; props: EdgeProps }[];
  /** For `DiagramCanvas`'s `relationships` (one per edge spec, by entity name). */
  relationships: DiagramRelationship[];
}

function edgeLook(change: RelationshipChange | undefined): Pick<EdgeProps, 'tone' | 'dashed'> {
  return { tone: change === 'added' ? 'accent' : 'neutral', dashed: change === 'removed' };
}

/** A shared trunk/rail is teal only when every edge in it is added (dashed when all removed). */
function sharedLook(
  changes: (RelationshipChange | undefined)[],
): Pick<EdgeProps, 'tone' | 'dashed'> {
  return {
    tone: changes.every((c) => c === 'added') ? 'accent' : 'neutral',
    dashed: changes.every((c) => c === 'removed'),
  };
}

/**
 * Lays out a diagram on a fixed grid: node positions, edge routes (picked from the cells' relative
 * positions) and the text list of relationships, all from one source so they cannot drift apart.
 * Throws on unknown node ids and on edges from a node to itself.
 */
export function layoutDiagram(options: LayoutDiagramOptions): DiagramLayout {
  const { nodes, edges, ...gridOptions } = options;
  const columns = gridOptions.columns ?? Math.max(0, ...nodes.map((n) => n.column)) + 1;
  const rows = gridOptions.rows ?? Math.max(0, ...nodes.map((n) => n.row)) + 1;
  const grid = diagramGrid({ ...gridOptions, columns, rows });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const resolve = (id: string, edge: DiagramEdgeSpec) => {
    const node = byId.get(id);
    if (!node) throw new Error(`layoutDiagram: edge ${edge.from} -> ${edge.to}: no node "${id}"`);
    return node;
  };
  const resolved = edges.map((spec) => {
    const from = resolve(spec.from, spec);
    const to = resolve(spec.to, spec);
    if (from === to) throw new Error(`layoutDiagram: edge from "${from.id}" to itself`);
    const dc = to.column - from.column;
    const dr = to.row - from.row;
    const route = spec.route ?? 'auto';
    const straight = route === 'straight' || dc === 0 || dr === 0;
    return { spec, from, to, dc, dr, route, straight };
  });

  // Fan-out groups: `auto` edges leaving the same source in the same vertical direction.
  const groupKey = (e: (typeof resolved)[number]) =>
    e.route === 'auto' && e.dr !== 0 ? `${e.from.id}:${e.dr > 0 ? 'down' : 'up'}` : null;
  const groups = new Map<string, (typeof resolved)[number][]>();
  for (const e of resolved) {
    const key = groupKey(e);
    if (key) groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  const out: DiagramLayout['edges'] = [];
  const emittedGroups = new Set<string>();
  for (const e of resolved) {
    const { spec, from, to, dc, dr } = e;
    const id = spec.id ?? `${spec.from}->${spec.to}`;
    const look = edgeLook(spec.change);
    const key = groupKey(e);
    const group = key ? groups.get(key)! : [];
    const fanOut = key !== null && (group.length > 1 || !e.straight);

    if (fanOut) {
      const down = dr > 0;
      const source = grid.anchor(from.column, from.row, down ? 'bottom' : 'top');
      const junctionY = down ? grid.gapBelow(from.row) : grid.gapBelow(from.row - 1);
      const route = fanOutRoute(
        source,
        group.map((g) => grid.anchor(g.to.column, g.to.row, down ? 'top' : 'bottom')),
        junctionY,
      );
      if (group.length === 1) {
        // A single bent edge: one path, so its label and colour cover the whole route.
        const branch = route.branches[0]!;
        const points = [...route.trunk, ...branch];
        out.push({ id, props: { points, label: spec.protocol, ...look } });
        continue;
      }
      if (!emittedGroups.has(key)) {
        emittedGroups.add(key);
        const shared = sharedLook(group.map((g) => g.spec.change));
        out.push({ id: `${key}:trunk`, props: { points: route.trunk, arrow: false, ...shared } });
        if (route.rail) {
          out.push({ id: `${key}:rail`, props: { points: route.rail, arrow: false, ...shared } });
        }
      }
      out.push({
        id,
        props: { points: route.branches[group.indexOf(e)]!, label: spec.protocol, ...look },
      });
      continue;
    }

    let points: Point[];
    if (e.straight) {
      points =
        dr === 0
          ? [
              grid.anchor(from.column, from.row, dc > 0 ? 'right' : 'left'),
              grid.anchor(to.column, to.row, dc > 0 ? 'left' : 'right'),
            ]
          : dc === 0
            ? [
                grid.anchor(from.column, from.row, dr > 0 ? 'bottom' : 'top'),
                grid.anchor(to.column, to.row, dr > 0 ? 'top' : 'bottom'),
              ]
            : // `straight` between cells that share no axis: centre to centre is not orthogonal,
              // so fall back to the elbow.
              elbowRoute(
                grid.anchor(from.column, from.row, dc > 0 ? 'right' : 'left'),
                grid.anchor(to.column, to.row, dr > 0 ? 'top' : 'bottom'),
                'horizontal',
              );
    } else {
      points = elbowRoute(
        grid.anchor(from.column, from.row, dc > 0 ? 'right' : 'left'),
        grid.anchor(to.column, to.row, dr > 0 ? 'top' : 'bottom'),
        'horizontal',
      );
    }
    out.push({ id, props: { points, label: spec.protocol, ...look } });
  }

  return {
    width: grid.width,
    height: grid.height,
    grid,
    nodes: nodes.map((n) => ({
      id: n.id,
      props: {
        name: n.name,
        kind: n.kind,
        subtitle: n.subtitle,
        variant: n.variant,
        at: grid.cell(n.column, n.row),
      },
    })),
    edges: out,
    relationships: resolved.map(({ spec, from, to }) => ({
      id: spec.id ?? `${spec.from}->${spec.to}`,
      from: from.name,
      to: to.name,
      protocol: spec.protocol,
      change: spec.change === 'unchanged' ? undefined : spec.change,
    })),
  };
}
