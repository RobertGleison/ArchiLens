import { describe, expect, it } from 'vitest';
import { parseTokens } from '../styles/parseTokens';
import tokensCss from '../styles/tokens.css?raw';
import {
  diagramGrid,
  elbowRoute,
  ENTITY_COMPACT_SIZE,
  ENTITY_SIZE,
  fanOutRoute,
} from './diagramLayout';

describe('diagramGrid', () => {
  // Figma 3:13320 in canvas coordinates minus the canvas inset (24 left, 14 top).
  const grid = diagramGrid({ columns: 3, rows: 2 });

  it('sizes the stage to fit the cells', () => {
    expect(grid.width).toBe(702);
    expect(grid.height).toBe(54 + 66 * 3);
  });

  it('places cells 102px apart horizontally and 66px apart vertically', () => {
    expect(grid.cell(0, 0)).toEqual({ x: 0, y: 54 });
    expect(grid.cell(2, 1)).toEqual({ x: 536, y: 186 });
  });

  it('returns anchors on node sides', () => {
    expect(grid.anchor(0, 0, 'right')).toEqual({ x: 166, y: 87 });
    expect(grid.anchor(1, 0, 'left')).toEqual({ x: 268, y: 87 });
    expect(grid.anchor(1, 0, 'bottom')).toEqual({ x: 351, y: 120 });
    expect(grid.anchor(0, 1, 'top')).toEqual({ x: 83, y: 186 });
    expect(grid.anchor(0, 0, 'center')).toEqual({ x: 83, y: 87 });
    expect(grid.gapBelow(0)).toBe(153);
    expect(grid.gapRightOf(0)).toBe(217);
  });

  it('matches the entity size tokens', () => {
    const byName = new Map(parseTokens(tokensCss).map((t) => [t.name, t.value]));
    expect(byName.get('--size-entity-width')).toBe(`${ENTITY_SIZE.width}px`);
    expect(byName.get('--size-entity-height')).toBe(`${ENTITY_SIZE.height}px`);
    expect(byName.get('--size-entity-compact-width')).toBe(`${ENTITY_COMPACT_SIZE.width}px`);
    expect(byName.get('--size-entity-compact-height')).toBe(`${ENTITY_COMPACT_SIZE.height}px`);
  });
});

describe('routes', () => {
  it('elbowRoute bends once, or goes straight when aligned', () => {
    expect(elbowRoute({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 20 },
    ]);
    expect(elbowRoute({ x: 0, y: 0 }, { x: 10, y: 20 }, 'vertical')[1]).toEqual({ x: 0, y: 20 });
    expect(elbowRoute({ x: 0, y: 5 }, { x: 10, y: 5 })).toHaveLength(2);
  });

  it('fanOutRoute splits into trunk, rail and one branch per target', () => {
    const route = fanOutRoute(
      { x: 50, y: 0 },
      [
        { x: 0, y: 40 },
        { x: 50, y: 40 },
        { x: 100, y: 40 },
      ],
      20,
    );
    expect(route.trunk).toEqual([
      { x: 50, y: 0 },
      { x: 50, y: 20 },
    ]);
    expect(route.rail).toEqual([
      { x: 0, y: 20 },
      { x: 100, y: 20 },
    ]);
    expect(route.branches).toEqual([
      [
        { x: 0, y: 20 },
        { x: 0, y: 40 },
      ],
      [
        { x: 50, y: 20 },
        { x: 50, y: 40 },
      ],
      [
        { x: 100, y: 20 },
        { x: 100, y: 40 },
      ],
    ]);
  });

  it('fanOutRoute has no rail for a single aligned target', () => {
    expect(fanOutRoute({ x: 5, y: 0 }, [{ x: 5, y: 40 }], 20).rail).toBeNull();
  });
});
