import { describe, expect, it, vi } from 'vitest';
import { parseTokens } from '../styles/parseTokens';
import tokensCss from '../styles/tokens.css?raw';
import {
  diagramGrid,
  elbowRoute,
  ENTITY_COMPACT_SIZE,
  ENTITY_SIZE,
  fanOutRoute,
  layoutDiagram,
  type DiagramNodeSpec,
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

describe('diagramGrid range check', () => {
  it('warns in dev about cells outside the grid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    diagramGrid({ columns: 2, rows: 1 }).cell(2, 0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cell (2, 0) is outside the 2×1'));
    warn.mockRestore();
  });
});

describe('layoutDiagram', () => {
  const NODES: DiagramNodeSpec[] = [
    { id: 'gw', name: 'API gateway', kind: 'gateway', column: 0, row: 0 },
    { id: 'api', name: 'checkout-api', kind: 'service', column: 1, row: 0, variant: 'focus' },
    { id: 'stripe', name: 'Stripe', kind: 'integration', column: 2, row: 0 },
    { id: 'pg', name: 'PostgreSQL', kind: 'datastore', column: 0, row: 1, subtitle: 'RDS' },
    { id: 'redis', name: 'Redis', kind: 'datastore', column: 1, row: 1 },
    { id: 'sqs', name: 'Amazon SQS', kind: 'queue', column: 2, row: 1 },
  ];

  it('rebuilds the Figma 3:13320 map: straight row edges and a storage fan-out', () => {
    const layout = layoutDiagram({
      nodes: NODES,
      edges: [
        { from: 'gw', to: 'api', protocol: 'HTTPS' },
        { from: 'api', to: 'stripe', protocol: 'HTTPS' },
        { from: 'api', to: 'pg' },
        { from: 'api', to: 'redis', change: 'added' },
        { from: 'api', to: 'sqs' },
      ],
    });
    expect([layout.width, layout.height]).toEqual([702, 252]);
    expect(layout.nodes.map((n) => [n.id, n.props.at])).toEqual([
      ['gw', { x: 0, y: 54 }],
      ['api', { x: 268, y: 54 }],
      ['stripe', { x: 536, y: 54 }],
      ['pg', { x: 0, y: 186 }],
      ['redis', { x: 268, y: 186 }],
      ['sqs', { x: 536, y: 186 }],
    ]);
    expect(layout.nodes[1]!.props).toMatchObject({ name: 'checkout-api', variant: 'focus' });
    expect(layout.nodes[3]!.props.subtitle).toBe('RDS');

    expect(layout.edges.map((e) => [e.id, e.props.points, e.props.arrow, e.props.tone])).toEqual([
      [
        'gw->api',
        [
          { x: 166, y: 87 },
          { x: 268, y: 87 },
        ],
        undefined,
        'neutral',
      ],
      [
        'api->stripe',
        [
          { x: 434, y: 87 },
          { x: 536, y: 87 },
        ],
        undefined,
        'neutral',
      ],
      [
        'api:down:trunk',
        [
          { x: 351, y: 120 },
          { x: 351, y: 153 },
        ],
        false,
        'neutral',
      ],
      [
        'api:down:rail',
        [
          { x: 83, y: 153 },
          { x: 619, y: 153 },
        ],
        false,
        'neutral',
      ],
      [
        'api->pg',
        [
          { x: 83, y: 153 },
          { x: 83, y: 186 },
        ],
        undefined,
        'neutral',
      ],
      [
        'api->redis',
        [
          { x: 351, y: 153 },
          { x: 351, y: 186 },
        ],
        undefined,
        'accent',
      ],
      [
        'api->sqs',
        [
          { x: 619, y: 153 },
          { x: 619, y: 186 },
        ],
        undefined,
        'neutral',
      ],
    ]);
    expect(layout.edges[0]!.props.label).toBe('HTTPS');

    expect(layout.relationships).toEqual([
      {
        id: 'gw->api',
        from: 'API gateway',
        to: 'checkout-api',
        protocol: 'HTTPS',
        change: undefined,
      },
      {
        id: 'api->stripe',
        from: 'checkout-api',
        to: 'Stripe',
        protocol: 'HTTPS',
        change: undefined,
      },
      {
        id: 'api->pg',
        from: 'checkout-api',
        to: 'PostgreSQL',
        protocol: undefined,
        change: undefined,
      },
      { id: 'api->redis', from: 'checkout-api', to: 'Redis', protocol: undefined, change: 'added' },
      {
        id: 'api->sqs',
        from: 'checkout-api',
        to: 'Amazon SQS',
        protocol: undefined,
        change: undefined,
      },
    ]);
  });

  it('colours a shared trunk teal only when every edge in it is added', () => {
    const layout = layoutDiagram({
      nodes: NODES,
      edges: [
        { from: 'api', to: 'pg', change: 'added' },
        { from: 'api', to: 'sqs', change: 'added' },
      ],
    });
    expect(layout.edges.find((e) => e.id === 'api:down:trunk')!.props.tone).toBe('accent');
  });

  it('routes a lone diagonal edge as one path through the row gap', () => {
    const layout = layoutDiagram({
      nodes: NODES,
      edges: [{ from: 'gw', to: 'sqs', protocol: 'AMQP', change: 'removed' }],
    });
    expect(layout.edges).toHaveLength(1);
    expect(layout.edges[0]!.props).toMatchObject({
      points: [
        { x: 83, y: 120 },
        { x: 83, y: 153 },
        { x: 619, y: 153 },
        { x: 619, y: 186 },
      ],
      label: 'AMQP',
      tone: 'neutral',
      dashed: true,
    });
    expect(layout.relationships[0]!.change).toBe('removed');
  });

  it('draws a single vertical edge straight, and honours elbow and straight routes', () => {
    const layout = layoutDiagram({
      nodes: NODES,
      edges: [
        { from: 'api', to: 'redis' },
        { from: 'gw', to: 'redis', route: 'elbow' },
        { from: 'stripe', to: 'gw', route: 'straight' },
      ],
    });
    expect(layout.edges.map((e) => e.props.points)).toEqual([
      [
        { x: 351, y: 120 },
        { x: 351, y: 186 },
      ],
      [
        { x: 166, y: 87 },
        { x: 351, y: 87 },
        { x: 351, y: 186 },
      ],
      [
        { x: 536, y: 87 },
        { x: 166, y: 87 },
      ],
    ]);
  });

  it('derives the grid size from the nodes unless given', () => {
    expect(layoutDiagram({ nodes: NODES.slice(0, 2), edges: [] }).width).toBe(166 * 2 + 102);
    expect(layoutDiagram({ nodes: NODES.slice(0, 2), edges: [], columns: 3 }).width).toBe(702);
  });

  it('throws on unknown node ids and self edges', () => {
    expect(() => layoutDiagram({ nodes: NODES, edges: [{ from: 'gw', to: 'nope' }] })).toThrow(
      'no node "nope"',
    );
    expect(() => layoutDiagram({ nodes: NODES, edges: [{ from: 'gw', to: 'gw' }] })).toThrow(
      'to itself',
    );
  });
});
